using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface ICreditService
    {
        Task<bool> SpendCredits(string userId, int creditsToSpend);
    }
}