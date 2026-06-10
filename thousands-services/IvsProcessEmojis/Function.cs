using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Amazon.Runtime.Internal;
using Microsoft.IdentityModel.Tokens;
using Amazon.Runtime.Internal.Transform;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsProcessEmojis;

public class EmojiEvent
{
    [JsonPropertyName("vendorEventId")] 
    public string VendorEventId { get; set; } = "";

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = "";

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("authorizationHeader")]
    public string AuthorizationHeader { get; set; } = "";

}

public class Function
{
    private static IServiceProvider services { get; set; }
    private readonly IFanVisibilityService _fanVisibilityServiceService;
    private const int NumberOfEmojisToTriggerLevel2 = 10;
    private const int NumberOfEmojisToTriggerLevel3 = 30;
    private const string HeartEmoji = "\u2764\uFE0F";
    private const string TadaEmoji = "\uD83C\uDF89";
    private const string FireEmoji = "\ud83d\udd25";
    private const string BoomEmoji = "\ud83d\udca5";
    private const string WaveEmoji = "\ud83d\udc4b";
    private const string ClapEmoji = "\ud83d\udc4f";

    public Function()
    {
        string? fanVisibilityServiceEndpointEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_ENDPOINT");

        if (String.IsNullOrEmpty(fanVisibilityServiceEndpointEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_ENDPOINT Environment Variable is not set!");
        }

        string? fanVisibilityServicePortEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PORT");

        int fanVisibilityServicePort = 0;
        if (!String.IsNullOrEmpty(fanVisibilityServicePortEnvironmentVar))
        {
            fanVisibilityServicePort = int.Parse(fanVisibilityServicePortEnvironmentVar);
        }
        else
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_PORT Environment Variable is not set!");
        }

        string? fanVisibilityServicePasswordEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PASSWORD");

        if (String.IsNullOrEmpty(fanVisibilityServicePasswordEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_PASSWORD Environment Variable is not set!");
        }

        string? fanVisibilityServiceUserEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_USER");

        if (String.IsNullOrEmpty(fanVisibilityServiceUserEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_USER Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
            Port = fanVisibilityServicePort,
            Password = fanVisibilityServicePasswordEnvironmentVar,
            User = fanVisibilityServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();

        services = serviceCollection.BuildServiceProvider();

        _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="events">The events for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<bool> FunctionHandler(SQSEvent events, ILambdaContext context)
    {
        Console.WriteLine(JsonSerializer.Serialize(events));
        string secretKey = "";

        Dictionary<string, int> emojiEvents = new Dictionary<string, int>();

        var validator = new JsonWebTokenHandler();

        foreach (var message in events.Records)
        {
            EmojiEvent? emojiEvent = JsonSerializer.Deserialize<EmojiEvent>(message.Body);
            Console.WriteLine(JsonSerializer.Serialize(emojiEvent));
            string vendorEventId = emojiEvent.VendorEventId;
            string authorizationHeader = emojiEvent.AuthorizationHeader;
            Console.WriteLine("authorizationHeader: " + authorizationHeader);

            var jwtTokenValidatorParams = new TokenValidationParameters()
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateActor = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey))
            };
            try
            {
                TokenValidationResult tokenValidationResult =
                    await validator.ValidateTokenAsync(authorizationHeader, jwtTokenValidatorParams);
                if (tokenValidationResult.IsValid)
                {
                    Console.WriteLine("Token is valid");
                }
                else
                {
                    Console.WriteLine($"Token is invalid: {tokenValidationResult.Exception}");
                    continue;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
            }

            Dictionary<string, int> emojiCounts = CountEmojis(emojiEvent.Message);

            foreach (KeyValuePair<string, int> emojiCount in emojiCounts)
            {
                Console.WriteLine($"{emojiCount.Key} - {emojiCount.Value}");
                if (emojiCount.Key != "NotUsed")
                {
                    string keyWithVendorEventId = $"{vendorEventId}-{emojiCount.Key}";
                    Console.WriteLine(keyWithVendorEventId);
                    //If this key isn't in the Dictionary yet, create it
                    if (!emojiEvents.ContainsKey(keyWithVendorEventId))
                    {
                        emojiEvents.Add(keyWithVendorEventId, emojiCount.Value);
                    }
                    else
                    {
                        emojiEvents[keyWithVendorEventId] += emojiCount.Value;
                    }
                }
            }
        }

        Random random = new Random();

        foreach (KeyValuePair<string, int> emojiEvent in emojiEvents)
        {
            Console.WriteLine($"{emojiEvent.Key} - {emojiEvent.Value}");
            //Split out the vendorEventId and Emoji
            string[] vendorEventIdAndEmoji = emojiEvent.Key.Split("-");
            string vendorEventId = vendorEventIdAndEmoji[0];
            Console.WriteLine(vendorEventId);
            string emojiName = vendorEventIdAndEmoji[1];
            int emojiCount = emojiEvent.Value;
            Console.WriteLine($"emojiCount: {emojiCount}");

            //Convert emoji to FanfareEffect.name
            string fanfareEffectName = ConvertEmojiNameToFanfareEffectName(emojiName, emojiCount);
            Console.WriteLine($"fanfareEffectName: {fanfareEffectName}");

            //Send to a single random section
            if (emojiCount < NumberOfEmojisToTriggerLevel3)
            {
                //Randomly choose a section between 1 and 12
                int randomSectionNumber = random.Next(1, 12);
                Console.WriteLine($"Random Section: {randomSectionNumber}");

                if (fanfareEffectName.Contains("Group")) emojiCount = 1;

                await SendFanfareEffectToSectionForEvent(vendorEventId, randomSectionNumber, fanfareEffectName,
                    emojiCount);
            }
            else //Send to all sections
            {
                for (int sectionIndex = 1; sectionIndex < 13; sectionIndex++)
                {
                    await SendFanfareEffectToSectionForEvent(vendorEventId, sectionIndex, fanfareEffectName,
                        emojiCount);
                }
            }
        }

        return true;
    }

    private async Task SendFanfareEffectToSectionForEvent(string vendorEventId, int sectionNumber, string fanfareEffectName, int emojiCount)
    {
        string fanfareEventType = "FanfareEffect";
        FanfareEffect fanfareEffect = new FanfareEffect()
        {
            Type = "AudienceNiagara",
            Name = fanfareEffectName,
            Value = "RandomActivation",
            SectionId = 0,
            SectionName = $"SpectatorSplines/Section{sectionNumber}A",
            Magnitude = emojiCount, //quantity of emojiEvents
            Delay = 0,
            Duration = 3,
            Notify = false,
            Metadata = new AirDropMetadata()
        };
        await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);

        FanfareEffect fanfareEffect2 = new FanfareEffect()
        {
            Type = "AudienceNiagara",
            Name = fanfareEffectName,
            Value = "RandomActivation",
            SectionId = 0,
            SectionName = $"SpectatorSplines/Section{sectionNumber}B",
            Magnitude = emojiCount, //quantity of emojiEvents
            Delay = 0,
            Duration = 3,
            Notify = false,
            Metadata = new AirDropMetadata()
        };
        await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect2);
    }

    private static Dictionary<string, int> CountEmojis(string input)
    {
        //string emojiPattern = @"(\p{Cs}|\p{So})";
        string emojiPattern = @"(" + HeartEmoji + "|"+ TadaEmoji + "|"+ FireEmoji + "|"+ BoomEmoji + "|"+ WaveEmoji + "|"+ ClapEmoji + ")";
        Regex regex = new Regex(emojiPattern, RegexOptions.Compiled);
        MatchCollection matches = regex.Matches(input);

        Dictionary<string, int> emojiCounts = new Dictionary<string, int>();
        foreach (Match match in matches)
        {
            string emoji = match.Value;
            Console.WriteLine($"CountEmojis emoji: {emoji}");
            string emojiName = ConverEmojiToEmojiName(emoji);
            Console.WriteLine($"CountEmojis emojiName: {emojiName}");
            if (emojiCounts.ContainsKey(emojiName))
            {
                emojiCounts[emojiName]++;
            }
            else
            {
                emojiCounts[emojiName] = 1;
            }
        }

        return emojiCounts;
    }

    private static string ConverEmojiToEmojiName(string emoji)
    {
        switch (emoji)
        {
            case HeartEmoji:
                return ":heart:";
            case TadaEmoji: //tada
                return ":tada:";
            case FireEmoji: //fire
                return ":fire:";
            case BoomEmoji: //boom
                return ":boom:";
            case WaveEmoji: //wave
                return ":wave:";
            case ClapEmoji: //clap
                return ":clap:";
        }

        return "NotUsed";
    }

    private static string ConvertEmojiNameToFanfareEffectName(string emojiName, int count)
    {
        switch (emojiName)
        {
            case ":heart:":
                if (count < NumberOfEmojisToTriggerLevel2) return "ff.ns.EmojiHeart";
                return "ff.ns.EmojiGroupHeart";
            case ":tada:": //tada
                if (count < NumberOfEmojisToTriggerLevel2) return "ff.ns.EmojiTada";
                return "ff.ns.EmojiGroupTada";
            case ":fire:": //fire
                if (count < NumberOfEmojisToTriggerLevel2) return "ff.ns.EmojiFire";
                return "ff.ns.EmojiGroupFire";
            case ":boom:": //boom
                if (count < NumberOfEmojisToTriggerLevel2) return "ff.ns.EmojiBoom";
                return "ff.ns.EmojiGroupBoom";
            case ":wave:": //wave
                if (count < NumberOfEmojisToTriggerLevel2) return "ff.ns.EmojiWave";
                return "ff.ns.EmojiGroupWave";
            case ":clap:": //clap
                if (count < NumberOfEmojisToTriggerLevel2) return "ff.ns.EmojiClap";
                return "ff.ns.EmojiGroupClap";
        }

        return "";
    }
}
