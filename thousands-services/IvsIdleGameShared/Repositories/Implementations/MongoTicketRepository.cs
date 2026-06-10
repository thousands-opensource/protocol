using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.SecurityToken.Model;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Ticket;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using PubnubApi;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoTicketRepository : ITicketRepository
    {
        private readonly IMongoCollection<AccessCode> _accessCodesCollection;
        private readonly IMongoCollection<ClaimedTicket> _claimedTicketsCollection;

        public MongoTicketRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _accessCodesCollection = database.GetCollection<AccessCode>(mongoDbSettings.AccessCodesCollectionName);
            _claimedTicketsCollection = database.GetCollection<ClaimedTicket>(mongoDbSettings.ClaimedTicketsCollectionName);
        }

        public async Task<AccessCode> CreateAccessCode(AccessCode accessCode)
        {
            try
            {
                await _accessCodesCollection.InsertOneAsync(accessCode);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddMarketTransaction Error: {ex.Message}");
                return new AccessCode();
            }

            return accessCode;
        }

        public async Task<ClaimedTicket?> GetClaimedTicket(string userId, string queueId)
        {
            try
            {
                var filterOnUserId = Builders<ClaimedTicket>.Filter.Eq("userId", ObjectId.Parse(userId));
                //eventId is actually stageId stored in queueId :(
                var filterOnEventId = Builders<ClaimedTicket>.Filter.Eq("eventId", queueId);
                var combinedFilter = Builders<ClaimedTicket>.Filter.And(filterOnUserId, filterOnEventId);
                return await _claimedTicketsCollection.Find(combinedFilter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetClaimedTicket Error: {ex.Message}");
            }

            return null;
        }

        public async Task<ClaimedTicket> CreateClaimedTicket(ClaimedTicket claimedTicket)
        {
            try
            {
                await _claimedTicketsCollection.InsertOneAsync(claimedTicket);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddMarketTransaction Error: {ex.Message}");
                return new ClaimedTicket();
            }

            return claimedTicket;
        }
    }
}
