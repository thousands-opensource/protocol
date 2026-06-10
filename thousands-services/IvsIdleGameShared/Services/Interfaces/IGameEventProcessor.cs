using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Interfaces;

namespace IvsIdleGameShared.Services.Interfaces;

public interface IGameEventProcessor
{
    Task<SuccessAndErrorMessage> ProcessGameEvent(IUserRepository userRepository, IEventRepository eventRepository, IIdleGameRepository idleGameRepository, 
        IWebSocketService webSocketService, IBoostRepository boostRepository, long currentTimestamp, string vendorEventId, string matchId, GameEventEvent gameEvent);
}