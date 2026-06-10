using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.Runtime.Internal;
using IvsIdleGameShared.Models.Market;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface ICreditBalanceRepository
    {
        Task<bool> UpdateTransactionStatus(string transactionId, string status, string paymentGatewayTransactionId);
        Task<bool> AddCreditTransaction(string userId, string transactionId, int amount, string currency, string paymentMethod, string paymentGateway, string? paymentGatewayTransactionId,
            int refundedAmount, string status, string? creditType, string? stageId, int? segment, int? skyboxTier);
        Task<List<CreditTransactionOutput>> GetCreditTransactions(string userId);
        Task<List<CreditTransaction>> GetSkyboxPurchaseCreditTransactions(string stageId, int segment);

        Task<int> GetCreditBalance(string userId);
        Task<bool> UpdateCreditBalance(string userId, int changeInCreditBalance);
        Task<bool> SpendCredits(string userId, int creditsToSpend);
    }
}
