using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Snag;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using System.Text.Json.Serialization;
using PubnubApi.EndPoint;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace SnagMintNftCallback;

public class Function
{
    private readonly IFranchiseCacheRepository _franchiseCacheRepository;
    private static IServiceProvider? services;

    public Function()
    {
        string? redisEndpointEnvironmentVar = Environment.GetEnvironmentVariable("REDIS_ENDPOINT");
        string? redisPortEnvironmentVar = Environment.GetEnvironmentVariable("REDIS_PORT");
        string? redisPasswordEnvironmentVar = Environment.GetEnvironmentVariable("REDIS_PASSWORD");
        string? redisUserEnvironmentVar = Environment.GetEnvironmentVariable("REDIS_USER");

        if (String.IsNullOrEmpty(redisEndpointEnvironmentVar))
        {
            Console.WriteLine("REDIS_ENDPOINT Environment Variable is not set!");
        }

        int redisPort = 18063;
        if (!String.IsNullOrEmpty(redisPortEnvironmentVar)
            && int.TryParse(redisPortEnvironmentVar, out int parsedRedisPort))
        {
            redisPort = parsedRedisPort;
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = redisEndpointEnvironmentVar,
            Port = redisPort,
            Password = redisPasswordEnvironmentVar,
            User = redisUserEnvironmentVar
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<IFranchiseCacheRepository, RedisFranchiseCacheRepository>();
        services = serviceCollection.BuildServiceProvider();

        _franchiseCacheRepository = services.GetRequiredService<IFranchiseCacheRepository>();
    }

    private sealed class FranchiseUserNfts
    {
        [JsonPropertyName("nfts")]
        public List<FranchiseNft> Nfts { get; set; } = new List<FranchiseNft>();
    }

    private sealed class FranchiseNft
    {
        [JsonPropertyName("nftAddress")]
        public string NftAddress { get; set; } = "";

        [JsonPropertyName("tokenId")]
        public string TokenId { get; set; } = "";

        [JsonPropertyName("startDate")]
        public DateTime StartDate { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; } = null;
    }

    /// <summary>
    /// A function to handle callbacks from Snag when a user mints an NFT
    /// </summary>
    /// <param name="proxyRequest">The proxy request for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<bool> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"Received request: {JsonSerializer.Serialize(proxyRequest)}");

        // Deserialize the webhook body to extract relevant data
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        List<SnagSubscriptionEvent>? snagEvents =
            JsonSerializer.Deserialize<List<SnagSubscriptionEvent>>(proxyRequest.Body, options);

        if (snagEvents == null)
        {
            Console.WriteLine("Error deserializing snagEvents.");
            return false;
        }

        foreach (var snagEvent in snagEvents)
        {
            var eventArgs = snagEvent?.DecodedEvent?.Args;
            var nftAddress = snagEvent?.ContractAddress;
            if (eventArgs != null && nftAddress != null)
            {
                var mintedTo = eventArgs.MintedTo;
                var tokenId = eventArgs.TokenIdMinted;
                var quantity = eventArgs.QuantityMinted;

                if (string.IsNullOrWhiteSpace(mintedTo))
                {
                    Console.WriteLine("mintedTo is null or empty; skipping.");
                    continue;
                }

                string normalizedMintedTo = mintedTo.Trim().ToLowerInvariant();
                string redisKey = $"franchise:user:nfts:{normalizedMintedTo}";
                Console.WriteLine($"Redis key: {redisKey} (original mintedTo: {mintedTo})");
                FranchiseUserNfts userNfts = new FranchiseUserNfts();

                try
                {
                    //Read from redis key user:franchise:nfts:[mintedTo]
                    Console.WriteLine($"Redis read start: {redisKey}");
                    string? existingPayload = await _franchiseCacheRepository.GetUserNfts(normalizedMintedTo);
                    Console.WriteLine($"Redis read done: {(string.IsNullOrWhiteSpace(existingPayload) ? "empty" : "payload")}");

                    if (!string.IsNullOrWhiteSpace(existingPayload))
                    {
                        try
                        {
                            FranchiseUserNfts? parsedUserNfts = JsonSerializer.Deserialize<FranchiseUserNfts>(existingPayload, options);
                            if (parsedUserNfts != null)
                            {
                                userNfts = parsedUserNfts;
                            }
                        }
                        catch (JsonException jsonException)
                        {
                            Console.WriteLine($"Failed to deserialize franchise NFTs payload: {jsonException.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis read error for {normalizedMintedTo}: {ex.Message}");
                    continue;
                }

                //Add NFT's to the nfts array so that we now have a combination of what was in the redis key plus the new nft
                //nftAddress is nftAddress, tokenId is tokenId, startDate is now, and endDate is null.  quantity is the number of these rows to add to the nfts array.
                int rowsToAdd = 1;
                if (!string.IsNullOrWhiteSpace(quantity) && int.TryParse(quantity, out int parsedQuantity))
                {
                    rowsToAdd = Math.Max(1, parsedQuantity);
                }

                string normalizedTokenId = tokenId ?? "";
                for (int index = 0; index < rowsToAdd; index++)
                {
                    userNfts.Nfts.Add(new FranchiseNft
                    {
                        NftAddress = nftAddress,
                        TokenId = normalizedTokenId,
                        StartDate = DateTime.UtcNow,
                        EndDate = null
                    });
                }

                //Write the new update JSON to the redis key user:franchise:nfts:[mintedTo]
                string updatedPayload = JsonSerializer.Serialize(userNfts);
                try
                {
                    Console.WriteLine($"Redis write start: {redisKey}");
                    await _franchiseCacheRepository.AddUserNfts(normalizedMintedTo, updatedPayload);
                    Console.WriteLine("Redis write done");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis write error for {normalizedMintedTo}: {ex.Message}");
                }
            }
        }       

        return true;
    }
}
