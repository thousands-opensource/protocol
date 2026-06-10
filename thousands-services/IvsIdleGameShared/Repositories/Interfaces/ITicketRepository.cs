using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Ticket;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface ITicketRepository
    {
        Task<AccessCode> CreateAccessCode(AccessCode accessCode);

        Task<ClaimedTicket?> GetClaimedTicket(string userId, string queueId);
        Task<ClaimedTicket> CreateClaimedTicket(ClaimedTicket claimedTicket);
    }
}
