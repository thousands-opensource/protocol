using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models.ExternalStreams;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace KickPolling;

public class Function
{
    // Reuse HttpClient across invocations (best practice for Lambda).
    private static readonly HttpClient Http = new HttpClient();

    // Simple in-memory token cache for warm Lambda containers.
    private static string? _accessToken;
    private static DateTimeOffset _accessTokenExpiresAt = DateTimeOffset.MinValue;

    private readonly IExternalStreamRepository _externalStreamRepository;

    public Function()
    {
        string? streamRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("STREAM_REPOSITORY_CONNECTION_URI");

        if (string.IsNullOrWhiteSpace(streamRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? streamRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("STREAM_REPOSITORY_DATABASE_NAME");

        if (string.IsNullOrWhiteSpace(streamRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
            GiftEventsCollectionName = "gift-events",
            ExternalStreamsCollectionName = "external-streams",
            ExternalStreamStatsCollectionName = "external-stream-stats"
        });
        serviceCollection.AddSingleton<IExternalStreamRepository, MongoExternalStreamRepository>();

        var services = serviceCollection.BuildServiceProvider();
        _externalStreamRepository = services.GetRequiredService<IExternalStreamRepository>();
    }

    public async Task<object> FunctionHandler(object input, ILambdaContext context)
    {
        // Required env vars (set these in Lambda configuration)
        var clientId = Environment.GetEnvironmentVariable("KICK_CLIENT_ID");
        var clientSecret = Environment.GetEnvironmentVariable("KICK_CLIENT_SECRET");
        var categoryId = Environment.GetEnvironmentVariable("KICK_CATEGORY_ID"); // e.g. Wildcard category id
        var scope = Environment.GetEnvironmentVariable("KICK_SCOPE") ?? "";      // optional; depends on what you call

        if (string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(clientSecret) ||
            string.IsNullOrWhiteSpace(categoryId))
        {
            throw new Exception("Missing required env vars: KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_CATEGORY_ID");
        }

        var token = await GetAppAccessTokenAsync(clientId, clientSecret, scope, context);

        Console.WriteLine($"token: {token}");

        // Kick Public API base
        var url = $"https://api.kick.com/public/v1/livestreams?category_id={Uri.EscapeDataString(categoryId)}&limit=100";

        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var resp = await Http.SendAsync(req);
        var body = await resp.Content.ReadAsStringAsync();

        if (!resp.IsSuccessStatusCode)
        {
            context.Logger.LogLine($"Kick API error {(int)resp.StatusCode}: {body}");
            throw new Exception($"Kick API error {(int)resp.StatusCode}");
        }

        // Parse to JSON so you can reshape it for your website
        using var doc = JsonDocument.Parse(body);

        // Example: log how many streams came back (shape depends on API response)
        // If response is paginated, you may see fields like "data" + "pagination".
        int count = 0;
        if (TryGetStreamsArray(doc.RootElement, out var dataEl))
        {
            count = dataEl.GetArrayLength();
        }

        context.Logger.LogLine($"Fetched {count} livestream(s) for category_id={categoryId} at {DateTimeOffset.UtcNow:o}");

        var activeStreams = await _externalStreamRepository.GetAllActiveExternalStreams() ?? new List<ExternalStream>();
        var activeStreamsByUserId = new Dictionary<string, List<ExternalStream>>(StringComparer.OrdinalIgnoreCase);
        foreach (var stream in activeStreams.Where(s => s.PlatformId == AccountProviderType.Kick))
        {
            if (string.IsNullOrWhiteSpace(stream.PlatformUserId))
            {
                continue;
            }

            if (!activeStreamsByUserId.TryGetValue(stream.PlatformUserId, out var list))
            {
                list = new List<ExternalStream>();
                activeStreamsByUserId[stream.PlatformUserId] = list;
            }

            list.Add(stream);
        }
        var kickPlatformUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var kickDataOk = TryGetStreamsArray(doc.RootElement, out dataEl);
        if (kickDataOk)
        {
            foreach (var streamEl in dataEl.EnumerateArray())
            {
                string? platformUserId = GetString(streamEl, "broadcaster_user_id");
                if (string.IsNullOrWhiteSpace(platformUserId))
                {
                    context.Logger.LogLine("Skipping stream with missing broadcaster_user_id.");
                    continue;
                }

                kickPlatformUserIds.Add(platformUserId);

                string? platformUserName = GetString(streamEl, "slug");
                string? channelId = GetString(streamEl, "channel_id") ?? GetStringFromNested(streamEl, "channel", "id");
                string? thumbnail = GetString(streamEl, "thumbnail") ?? GetString(streamEl, "thumbnail_url");
                string? streamTitle = GetString(streamEl, "stream_title") ?? GetString(streamEl, "title");
                string? language = GetString(streamEl, "language");
                string? profilePicture = GetString(streamEl, "profile_picture") ?? GetStringFromNested(streamEl, "channel", "profile_picture");
                bool? hasMatureContent = GetBool(streamEl, "has_mature_content") ?? GetBool(streamEl, "is_mature");
                int viewerCount = GetInt(streamEl, "viewer_count") ?? 0;
                DateTime? streamStartDate = GetDateTime(streamEl, "started_at");
                if (streamStartDate == null)
                {
                    context.Logger.LogLine("Skipping stream with missing started_at.");
                    continue;
                }

                activeStreamsByUserId.TryGetValue(platformUserId, out var userStreams);
                var existingStream = userStreams?.FirstOrDefault(s => s.StartDate == streamStartDate.Value);

                string externalStreamId;
                if (existingStream == null)
                {
                    var externalStream = new ExternalStream
                    {
                        Id = ObjectId.GenerateNewId().ToString()!,
                        PlatformId = AccountProviderType.Kick,
                        PlatformUserId = platformUserId,
                        PlatformUserName = platformUserName,
                        ChannelId = channelId ?? string.Empty,
                        Thumbnail = thumbnail ?? string.Empty,
                        StreamTitle = streamTitle ?? string.Empty,
                        Language = language,
                        ProfilePicture = profilePicture,
                        HasMatureContent = hasMatureContent,
                        StartDate = streamStartDate.Value,
                        AmountEarned = 0,
                        ViewerCount = viewerCount
                    };

                    bool addStreamSuccess = await _externalStreamRepository.AddExternalStream(externalStream);
                    if (!addStreamSuccess)
                    {
                        context.Logger.LogLine($"Failed to add external stream for platformUserId={platformUserId}.");
                        continue;
                    }

                    externalStreamId = externalStream.Id;
                    activeStreams.Add(externalStream);
                    if (userStreams == null)
                    {
                        userStreams = new List<ExternalStream>();
                        activeStreamsByUserId[platformUserId] = userStreams;
                    }

                    // Close out the previous active stream for this user (if any).
                    var previousStream = userStreams
                        .OrderByDescending(s => s.StartDate)
                        .FirstOrDefault();

                    if (previousStream != null)
                    {
                        var previousEndDate = streamStartDate.Value.AddMinutes(-1);
                        await _externalStreamRepository.UpdateExternalStreamSetEndDate(previousStream.Id, previousEndDate);
                        previousStream.EndDate = previousEndDate;
                    }

                    userStreams.Add(externalStream);
                }
                else
                {
                    externalStreamId = existingStream.Id;
                    if (!string.IsNullOrWhiteSpace(thumbnail) &&
                        !string.Equals(existingStream.Thumbnail, thumbnail, StringComparison.OrdinalIgnoreCase))
                    {
                        await _externalStreamRepository.UpdateExternalStreamSetThumbnailAndViewerCount(
                            existingStream.Id,
                            thumbnail,
                            viewerCount);
                        existingStream.Thumbnail = thumbnail;
                        existingStream.ViewerCount = viewerCount;
                    }
                }

                if (string.IsNullOrWhiteSpace(externalStreamId))
                {
                    context.Logger.LogLine($"Missing externalStreamId for platformUserId={platformUserId}.");
                    continue;
                }

                var externalStreamStats = new ExternalStreamStats
                {
                    Id = ObjectId.GenerateNewId().ToString()!,
                    ExternalStreamId = externalStreamId,
                    CreatedAt = DateTime.UtcNow,
                    ViewerCount = viewerCount
                };

                await _externalStreamRepository.AddExternalStreamStats(externalStreamStats);
            }
        }
        else
        {
            context.Logger.LogLine("Kick response did not include a data array. Skipping inactive stream detection.");
        }

        if (kickDataOk)
        {
            var now = DateTime.UtcNow;
            foreach (var activeStream in activeStreams.Where(s => s.PlatformId == AccountProviderType.Kick))
            {
                if (string.IsNullOrWhiteSpace(activeStream.PlatformUserId))
                {
                    continue;
                }

                if (!kickPlatformUserIds.Contains(activeStream.PlatformUserId))
                {
                    await _externalStreamRepository.UpdateExternalStreamSetEndDate(activeStream.Id, now);
                }
            }
        }

        // Return the raw payload (or map it into your own DTO)
        return new
        {
            updatedAtUtc = DateTimeOffset.UtcNow,
            categoryId,
            streamCount = count,
            payload = JsonSerializer.Deserialize<object>(body)
        };
    }

    private static async Task<string> GetAppAccessTokenAsync(string clientId, string clientSecret, string scope, ILambdaContext context)
    {
        // If token still valid, reuse it.
        if (!string.IsNullOrWhiteSpace(_accessToken) && DateTimeOffset.UtcNow < _accessTokenExpiresAt.AddSeconds(-30))
            return _accessToken!;

        // Kick OAuth server is hosted on id.kick.com. :contentReference[oaicite:4]{index=4}
        var tokenUrl = "https://id.kick.com/oauth/token";

        // OAuth Client Credentials flow. :contentReference[oaicite:5]{index=5}
        var form = new List<KeyValuePair<string, string>>
        {
            new("grant_type", "client_credentials"),
            new("client_id", clientId),
            new("client_secret", clientSecret),
        };

        // Some OAuth servers require scope, some allow it to be omitted.
        if (!string.IsNullOrWhiteSpace(scope))
            form.Add(new("scope", scope));

        using var req = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
        {
            Content = new FormUrlEncodedContent(form)
        };

        using var resp = await Http.SendAsync(req);
        var body = await resp.Content.ReadAsStringAsync();

        if (!resp.IsSuccessStatusCode)
        {
            context.Logger.LogLine($"Token error {(int)resp.StatusCode}: {body}");
            throw new Exception($"OAuth token request failed {(int)resp.StatusCode}");
        }

        using var doc = JsonDocument.Parse(body);
        var accessToken = doc.RootElement.GetProperty("access_token").GetString();
        var expiresIn = doc.RootElement.TryGetProperty("expires_in", out var expEl) ? expEl.GetInt32() : 300;

        if (string.IsNullOrWhiteSpace(accessToken))
            throw new Exception("OAuth token response missing access_token");

        _accessToken = accessToken;
        _accessTokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(expiresIn);

        return accessToken;
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.String)
                return prop.GetString();
            if (prop.ValueKind == JsonValueKind.Number || prop.ValueKind == JsonValueKind.True || prop.ValueKind == JsonValueKind.False)
                return prop.ToString();
        }

        return null;
    }

    private static string? GetStringFromNested(JsonElement element, string objectProperty, string propertyName)
    {
        if (element.TryGetProperty(objectProperty, out var obj) && obj.ValueKind == JsonValueKind.Object)
        {
            return GetString(obj, propertyName);
        }

        return null;
    }

    private static int? GetInt(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt32(out var value))
                return value;
            if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out var parsed))
                return parsed;
        }

        return null;
    }

    private static bool? GetBool(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.True)
                return true;
            if (prop.ValueKind == JsonValueKind.False)
                return false;
            if (prop.ValueKind == JsonValueKind.String && bool.TryParse(prop.GetString(), out var parsed))
                return parsed;
        }

        return null;
    }

    private static DateTime? GetDateTime(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.String &&
                DateTime.TryParse(prop.GetString(), null, System.Globalization.DateTimeStyles.AdjustToUniversal, out var parsed))
                return parsed;
        }

        return null;
    }

    private static bool TryGetStreamsArray(JsonElement root, out JsonElement streamsArray)
    {
        if (root.TryGetProperty("data", out var dataEl))
        {
            if (dataEl.ValueKind == JsonValueKind.Array)
            {
                streamsArray = dataEl;
                return true;
            }

            if (dataEl.ValueKind == JsonValueKind.Object)
            {
                if (dataEl.TryGetProperty("data", out var innerDataEl) && innerDataEl.ValueKind == JsonValueKind.Array)
                {
                    streamsArray = innerDataEl;
                    return true;
                }

                if (dataEl.TryGetProperty("livestreams", out var liveEl) && liveEl.ValueKind == JsonValueKind.Array)
                {
                    streamsArray = liveEl;
                    return true;
                }
            }
        }

        if (root.TryGetProperty("livestreams", out var rootLiveEl) && rootLiveEl.ValueKind == JsonValueKind.Array)
        {
            streamsArray = rootLiveEl;
            return true;
        }

        streamsArray = default;
        return false;
    }
}
