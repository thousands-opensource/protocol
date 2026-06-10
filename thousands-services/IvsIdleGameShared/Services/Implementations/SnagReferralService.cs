using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Snag;
using IvsIdleGameShared.Services.Interfaces;

namespace IvsIdleGameShared.Services.Implementations
{
    public class SnagReferralService : IReferralService
    {
        private readonly string? _thousandsApiRootUrl;
        private readonly string? _thousandsApiPlatformXApiKey;

        public SnagReferralService(IPlatformSettings iPlatformSettings)
        {
            if (!string.IsNullOrEmpty(iPlatformSettings.ThousandsApiRootUrl))
            {
                _thousandsApiRootUrl = iPlatformSettings.ThousandsApiRootUrl;
            }
            else
            {
                Console.WriteLine("SnagReferralService - iPlatformSettings.FetchFanDetailsUrl is NULL or empty!");
            }

            if (!string.IsNullOrEmpty(iPlatformSettings.PlatformXApiKey))
            {
                _thousandsApiPlatformXApiKey = iPlatformSettings.PlatformXApiKey;
            }
            else
            {
                Console.WriteLine("SnagReferralService - iPlatformSettings.PlatformXApiKey is NULL or empty!");
            }
        }

        public async Task<GetReferralUsersResponse> GetReferralUsers(string walletAddress)
        {
            if (string.IsNullOrEmpty(walletAddress))
            {
                Console.WriteLine("walletAddress is null or empty.");
                return new GetReferralUsersResponse();
            }

            using HttpClient client = new HttpClient();
            string url = $"{_thousandsApiRootUrl}/api/referrals/getReferralUsers?walletAddress={walletAddress}";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("x-api-key", _thousandsApiPlatformXApiKey);

                HttpResponseMessage response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();

                string content = await response.Content.ReadAsStringAsync();
                GetReferralUsersResponse? getReferralUsersResponse = JsonSerializer.Deserialize<GetReferralUsersResponse>(content);

                if (getReferralUsersResponse == null)
                {
                    Console.WriteLine("Failed to deserialize response or content was null.");
                    return new GetReferralUsersResponse();
                }

                if (!getReferralUsersResponse.Success)
                {
                    Console.WriteLine($"Failed to fetch referral users.");
                    return new GetReferralUsersResponse();
                }

                return getReferralUsersResponse;
            }
            catch (HttpRequestException e)
            {
                Console.WriteLine($"HTTP request error: {e.Message}");
            }
            catch (JsonException e)
            {
                Console.WriteLine($"JSON error: {e.Message}");
            }

            return new GetReferralUsersResponse();
        }

        public async Task<bool> CreateLoyaltyTransaction(string walletAddress, string transactionId, int amount)
        {
            if (string.IsNullOrEmpty(walletAddress))
            {
                Console.WriteLine("walletAddress is null or empty.");
                return false;
            }

            if (string.IsNullOrEmpty(transactionId))
            {
                Console.WriteLine("transactionId is null or empty.");
                return false;
            }

            if (amount < 0)
            {
                Console.WriteLine("amount is less than zero.");
                return false;
            }

            using HttpClient client = new HttpClient();
            string url = $"{_thousandsApiRootUrl}/api/referrals/createLoyaltyTransaction";

            var createLoyaltyTransactionRequest = new CreateLoyaltyTransactionRequest
            {
                WalletAddress = walletAddress,
                TransactionId = transactionId,
                Amount = amount
            };

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.Add("x-api-key", _thousandsApiPlatformXApiKey);
                string requestJson = JsonSerializer.Serialize(createLoyaltyTransactionRequest);
                Console.WriteLine(requestJson);
                request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

                HttpResponseMessage response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();

                string content = await response.Content.ReadAsStringAsync();
                CreateLoyaltyTransactionResponse? getReferralUsersResponse = JsonSerializer.Deserialize<CreateLoyaltyTransactionResponse>(content);

                if (getReferralUsersResponse == null)
                {
                    Console.WriteLine("Failed to deserialize response or content was null.");
                    return false;
                }

                if (!getReferralUsersResponse.Success)
                {
                    Console.WriteLine($"Failed to fetch referral users.");
                    return false;
                }

                return true;
            }
            catch (HttpRequestException e)
            {
                Console.WriteLine($"HTTP request error: {e.Message}");
            }
            catch (JsonException e)
            {
                Console.WriteLine($"JSON error: {e.Message}");
            }

            return false;
        }
    }
}
