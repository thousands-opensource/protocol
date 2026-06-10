using System;
using System.Text.Json;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Wildcard;
using IvsIdleGameShared.Services.Interfaces;

namespace IvsIdleGameShared.Services.Implementations;

public class NextJsBlockchainService : IBlockChainService
{
    private readonly string? _fetchFanDetailsUrl;
    private readonly string? _fetchFanDetailsPlatformXApiKey;

    public NextJsBlockchainService(IPlatformSettings iPlatformSettings)
    {
        if (!string.IsNullOrEmpty(iPlatformSettings.FetchFanDetailsUrl))
        {
            _fetchFanDetailsUrl = iPlatformSettings.FetchFanDetailsUrl;
        }
        else
        {
            Console.WriteLine("NextJSBlockchainService - iPlatformSettings.FetchFanDetailsUrl is NULL or empty!");
        }

        if (!string.IsNullOrEmpty(iPlatformSettings.PlatformXApiKey))
        {
            _fetchFanDetailsPlatformXApiKey = iPlatformSettings.PlatformXApiKey;
        }
        else
        {
            Console.WriteLine("NextJSBlockchainService - iPlatformSettings.PlatformXApiKey is NULL or empty!");
        }
    }

    public async Task<GetWildpassesAndSwagPinsResponse> GetWildpassesAndSwagPins(string fanId)
    {
        using HttpClient client = new HttpClient();
        string url = $"{_fetchFanDetailsUrl}?fanId={fanId}";

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("x-api-key", _fetchFanDetailsPlatformXApiKey);

            HttpResponseMessage response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();

            string content = await response.Content.ReadAsStringAsync();
            WildcardApiNextJSResponse<FanDetails>? fanDetailsResponse = JsonSerializer.Deserialize<WildcardApiNextJSResponse<FanDetails>>(content);

            if (fanDetailsResponse == null)
            {
                Console.WriteLine("Failed to deserialize response or content was null.");
                return DefaultWildpassesAndSwagPinsResponse();
            }

            if (!fanDetailsResponse.Success)
            {
                Console.WriteLine($"Failed to fetch fan details: {fanDetailsResponse.Error ?? "Unknown Error"}");
                return DefaultWildpassesAndSwagPinsResponse();
            }

            FanDetails? fanDetails = fanDetailsResponse.Data;
            if (fanDetails == null)
            {
                Console.WriteLine("No fan details found in the response.");
                return DefaultWildpassesAndSwagPinsResponse();
            }

            return new GetWildpassesAndSwagPinsResponse()
            {
                Wildpasses = fanDetails.Wildpasses,
                SwagPins = fanDetails.SwagPins
            };
        }
        catch (HttpRequestException e)
        {
            Console.WriteLine($"HTTP request error: {e.Message}");
        }
        catch (JsonException e)
        {
            Console.WriteLine($"JSON error: {e.Message}");
        }

        return DefaultWildpassesAndSwagPinsResponse();
    }

    private GetWildpassesAndSwagPinsResponse DefaultWildpassesAndSwagPinsResponse()
    {
        return new GetWildpassesAndSwagPinsResponse()
        {
            Wildpasses = new List<Wildpass>(),
            SwagPins = new List<SwagPin>()
        };
    }
}


