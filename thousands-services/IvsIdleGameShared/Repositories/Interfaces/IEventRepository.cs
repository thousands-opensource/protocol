using IvsIdleGameShared.Models;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public  interface IEventRepository
    {
        Task<Event?> GetEventFromVendorEventId(string vendorEventId);
        Task<bool> IncrementCurrentSegment(string stageId, int amountToIncrement);
    }
}
