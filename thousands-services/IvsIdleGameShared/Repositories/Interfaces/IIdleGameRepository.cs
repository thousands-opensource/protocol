using IvsIdleGameShared.Models;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IIdleGameRepository
    {
        Task<bool> AddSharedEvent(string eventId, IdleEvent idleEvent);
        Task<IdleEvent?> GetSharedEvent(string eventId, string chatActionId);
        Task<bool> AddPlayerToSharedEvent(string eventId, string userId, string chatActionId, string option);
        Task<string[]> GetPlayersFromSharedEventOption(string eventId, string chatActionId, string option);

        Task<bool> AddEventForPlayer(string eventId, string userId, IdleEvent idleEvent);
        Task<bool> RemoveEventsForPlayer(string eventId, string userId, List<IdleEvent> idleEventsToRemove);
        Task<bool> RemoveAllEventsForPlayer(string eventId, string userId);
        Task<List<IdleEvent>> GetEventsForPlayer(string eventId, string userId);

        Task<bool> AddEventMatch(string vendorEventId, EventMatch eventMatch, string stageId);
        Task<EventMatch?> GetEventMatchFromVendorEventId(string vendorEventId);
        Task<EventMatch?> GetEventMatchFromStageId(string stageId);
        Task RemoveEventMatch(string vendorEventId);

        Task<int> GetRolledUpPersonalCredits(string eventId, string userId);
        Task<bool> IncrementRolledUpPersonalCredits(string eventId, string userId, decimal incrementAmount);

        Task<bool> AddItemToUserInventory(string userId, string itemName);
        Task<string[]> GetItemsInUserInventory(string userId);
        Task<bool> EquipItemForUser(string userId, string itemName);
        Task<bool> UnEquipItemForUser(string userId, string itemName);
        Task<string[]> GetEquippedItemsForUser(string userId);

        Task<int> GetPlayerLevel(string userId);
        Task<bool> SetPlayerLevel(string userId, int level);

        Task<long> GetStreamScore(string eventId);
        Task<long> IncrementStreamScore(string eventId, int incrementAmount);
    }
}
