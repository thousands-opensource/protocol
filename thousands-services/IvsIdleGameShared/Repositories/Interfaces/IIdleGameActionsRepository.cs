using IvsIdleGameShared.Models;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IIdleGameActionsRepository
    {
        Task AddIdleGameAction(StoredIdleEvent storedIdleEvent);
    }
}
