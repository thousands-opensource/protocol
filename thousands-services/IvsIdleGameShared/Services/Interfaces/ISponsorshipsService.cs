using IvsIdleGameShared.Models;

namespace IvsIdleGameShared.Services.Interfaces;

public interface ISponsorshipsService
{
    Task<PurchaseSponsorshipResult> PurchaseSponsorship(string userId, string sponsoredEventId, string sponsorshipSlotId);
}
