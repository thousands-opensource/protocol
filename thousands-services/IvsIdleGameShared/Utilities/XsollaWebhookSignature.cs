using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Utilities
{
    public static class XsollaWebhookSignature
    {
        public static string ComputeSha1(string jsonBody, string secretKey)
        {
            // Concatenation of the JSON from the request body and the project's secret key
            string dataToSign = jsonBody + secretKey;
            using var sha1 = SHA1.Create();
            byte[] hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(dataToSign));
            return Convert.ToHexString(hashBytes).ToLower();
        }
        public static bool VerifySignature(string jsonBody, string secretKey, string receivedSignature)
        {
            string computedSignature = ComputeSha1(jsonBody, secretKey);
            return string.Equals(computedSignature, receivedSignature, StringComparison.OrdinalIgnoreCase);
        }
    }
}
