using IvsIdleGameShared.Models.Sponsorship;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Interfaces;

public interface ISponsorshipRepository
{
    Task<SponsoredEvent?> GetSponsoredEvent(string sponsoredEventId);
    Task<bool> AddUserSponsoredEvent(UserSponsoredEvent userSponsoredEvent);
    Task<long> GetUserSponsoredEventCount(ObjectId sponsoredEventId, ObjectId sponsorshipSlotId);
    Task<long> GetUserSponsoredEventCount(IClientSessionHandle session, ObjectId sponsoredEventId, ObjectId sponsorshipSlotId);
}
