using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Sponsorship;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations;

public class MongoSponsorshipRepository : ISponsorshipRepository
{
    private readonly IMongoCollection<SponsoredEvent> _sponsoredEventsCollection;
    private readonly IMongoCollection<UserSponsoredEvent> _userSponsoredEventsCollection;

    public MongoSponsorshipRepository(IMongoDbSettings mongoDbSettings)
    {
        MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
        IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
        _sponsoredEventsCollection = database.GetCollection<SponsoredEvent>(mongoDbSettings.SponsoredEventsCollectionName);
        _userSponsoredEventsCollection = database.GetCollection<UserSponsoredEvent>(mongoDbSettings.UserSponsoredEventsCollectionName);
    }

    public async Task<SponsoredEvent?> GetSponsoredEvent(string sponsoredEventId)
    {
        try
        {
            ObjectId sponsoredEventObjectId = ObjectId.Parse(sponsoredEventId);
            var filter = Builders<SponsoredEvent>.Filter.Eq(s => s.Id, sponsoredEventObjectId);
            return await _sponsoredEventsCollection.Find(filter).FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetSponsoredEvent Error: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> AddUserSponsoredEvent(UserSponsoredEvent userSponsoredEvent)
    {
        try
        {
            await _userSponsoredEventsCollection.InsertOneAsync(userSponsoredEvent);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AddUserSponsoredEvent Error: {ex.Message}");
            return false;
        }
    }

    public async Task<long> GetUserSponsoredEventCount(ObjectId sponsoredEventId, ObjectId sponsorshipSlotId)
    {
        try
        {
            var filter = Builders<UserSponsoredEvent>.Filter.Eq(u => u.SponsoredEventId, sponsoredEventId)
                & Builders<UserSponsoredEvent>.Filter.Eq(u => u.SponsorshipSlotId, sponsorshipSlotId);
            return await _userSponsoredEventsCollection.CountDocumentsAsync(filter);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetUserSponsoredEventCount Error: {ex.Message}");
            return -1;
        }
    }

    public async Task<long> GetUserSponsoredEventCount(IClientSessionHandle session, ObjectId sponsoredEventId, ObjectId sponsorshipSlotId)
    {
        try
        {
            var filter = Builders<UserSponsoredEvent>.Filter.Eq(u => u.SponsoredEventId, sponsoredEventId)
                & Builders<UserSponsoredEvent>.Filter.Eq(u => u.SponsorshipSlotId, sponsorshipSlotId);
            return await _userSponsoredEventsCollection.CountDocumentsAsync(session, filter);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetUserSponsoredEventCount Error: {ex.Message}");
            return -1;
        }
    }
}
