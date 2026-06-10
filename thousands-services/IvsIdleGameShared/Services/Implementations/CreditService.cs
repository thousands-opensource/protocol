using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;

namespace IvsIdleGameShared.Services.Implementations
{
    public class CreditService : ICreditService
    {
        private readonly ICreditBalanceRepository _creditBalanceRepository;

        public CreditService(ICreditBalanceRepository creditBalanceRepository)
        {
            _creditBalanceRepository = creditBalanceRepository;
        }

        public async Task<bool> SpendCredits(string userId, int creditsToSpend)
        {
            await _creditBalanceRepository.SpendCredits(userId, creditsToSpend);

            return true;
        }
    }
}
