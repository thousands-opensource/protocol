using Amazon.Lambda.APIGatewayEvents;
using Microsoft.IdentityModel.JsonWebTokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using PubnubApi;
using IvsIdleGameShared.Models;
using NRedisStack;

namespace IvsIdleGameShared.Utilities
{
    public static class LambdaUtilities
    {
        public static Dictionary<string, string> GetCORSHeaders()
        {
            return new Dictionary<string, string>
            {
                {
                    "Access-Control-Allow-Headers", "Content-Type, Authorization"
                },
                {
                    "Access-Control-Allow-Methods", "OPTIONS,POST"
                },
                {
                    "Access-Control-Allow-Origin", "*"
                },
                {
                    "Content-Type", "application/json"
                }
            };
        }

        public static async Task<ThousandsJwt> VerifyWildcardAccessTokenInProxyRequestAndGetUserId(APIGatewayProxyRequest proxyRequest)
        {
            ThousandsJwt thousandsJwt = new ThousandsJwt();

            Console.WriteLine(JsonSerializer.Serialize(proxyRequest));

            if (!proxyRequest.Headers.ContainsKey("Authorization") || string.IsNullOrEmpty(proxyRequest.Headers["Authorization"]))
            {
                Console.WriteLine("Missing authorization!");
                return thousandsJwt;
            }

            string authorizationHeader = proxyRequest.Headers["Authorization"].Replace("Bearer ", "");

            //Validate user
            string secretKey = "";
            var validator = new JsonWebTokenHandler();
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
                    return thousandsJwt;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
                return thousandsJwt;
            }

            var jsonToken = validator.ReadJsonWebToken(authorizationHeader);
            if (jsonToken == null)
            {
                Console.WriteLine("Unable to read JWT!");
                return thousandsJwt;
            }

            //Get userId
            var claimedUserId = jsonToken.Claims.First(claim => claim.Type == "userId");
            thousandsJwt.UserId = claimedUserId.Value;

            // Get roles
            string[] roles = jsonToken.Claims.Where(claim => claim.Type == "roles").Select(claim => claim.Value).ToArray();
            thousandsJwt.Roles = roles;

            return thousandsJwt;
        }

        public static bool IsValidThirdWebSignature(string requestBody, string timestamp, string signature, string paymentWebHookSecret)
        {
            string payload = $"{timestamp}.{requestBody}";
            // The key for HMAC
            byte[] key = Encoding.UTF8.GetBytes(paymentWebHookSecret);
            // The message to hash the requestBody
            byte[] messageBytes = Encoding.UTF8.GetBytes(payload);
            // Create HMACSHA256 instance with the key
            using (var hmac = new HMACSHA256(key))
            {
                // Compute the hash
                byte[] hashValue = hmac.ComputeHash(messageBytes);
                // Convert hash to a hexadecimal string
                string hashHex = BitConverter.ToString(hashValue).Replace("-", "").ToLower();
                Console.WriteLine($"HMAC hash: {hashHex}");
                Console.WriteLine($"Third Web Signature: {signature}");

                if (hashHex.Equals(signature))
                {
                    return true;
                }
            }

            return true;
        }

        public static bool IsThirdWebSignatureExpired(string timestamp, int expirationSeconds)
        {
            //Get the current timestamp
            DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
            long currentTimestampInThirdWebFormat = dto.ToUnixTimeSeconds();

            Console.WriteLine($"{currentTimestampInThirdWebFormat} - {timestamp} > {expirationSeconds}");

            return false;
        }
    }
}
