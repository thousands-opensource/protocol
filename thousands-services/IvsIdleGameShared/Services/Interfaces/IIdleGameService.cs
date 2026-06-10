using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.IdleGame;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IIdleGameService
    {
        Task<IdleGamePlayerActionResponse> PlayerAction(string eventId, string vendorEventId, string userId, string command);
    }
}
