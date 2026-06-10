using System.Net.Quic;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Events;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.Json;
using IvsIdleGameShared.Models.Users;
using IvsIdleGameShared.Models.ExternalStreams;
using System.Text.RegularExpressions;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoUserRepository : IUserRepository
    {
        private readonly IMongoCollection<User> _userCollection;

        public MongoUserRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _userCollection = database.GetCollection<User>(mongoDbSettings.UsersCollectionName);
        }

        public async Task<User> GetUser(string userId)
        {
            FilterDefinition<User> filter = Builders<User>.Filter.Eq("_id", ObjectId.Parse(userId));
            var user = await _userCollection.Find(filter).FirstOrDefaultAsync();

            return user;
        }

        public async Task<User> GetUserByWalletAddress(string walletAddress)
        {
            var normalizedAddress = (walletAddress ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(normalizedAddress))
            {
                return null;
            }

            var regex = new BsonRegularExpression($"^{Regex.Escape(normalizedAddress)}$", "i");
            var filter = Builders<User>.Filter.Or(
                Builders<User>.Filter.Regex("walletProvider.address", regex),
                Builders<User>.Filter.Regex("walletProvider.additionalWallets", regex)
            );

            var user = await _userCollection.Find(filter).FirstOrDefaultAsync();

            return user;
        }

        public async Task<List<UserOutput>> GetUsers(string? userId, string? displayName, string? walletAddress, int? page, int? pageSize)
        {
            var pipeline = new List<BsonDocument>();

            var matchConditions = new BsonDocument();

            // Add userId filter if provided
            if (!string.IsNullOrEmpty(userId) && ObjectId.TryParse(userId, out ObjectId userIdObjectId))
            {
                matchConditions.Add("_id", userIdObjectId);
            }

            // Add displayName filter if provided
            if (!string.IsNullOrEmpty(displayName))
            {
                matchConditions.Add("preferences.displayName", displayName);
            }

            // Add eventStatus filter if provided
            if (!string.IsNullOrEmpty(walletAddress))
            {
                matchConditions.Add("walletProvider.address", walletAddress);
            }

            // Only add `$match` if there are conditions
            if (matchConditions.ElementCount > 0)
            {
                pipeline.Add(new BsonDocument("$match", matchConditions));
            }

            //Sort by startTime
            pipeline.Add(new BsonDocument("$sort", new BsonDocument("createdAt", -1)));

            if (page.HasValue && pageSize.HasValue)
            {
                pipeline.Add(new BsonDocument("$skip", page - 1)); // Page starts at 1
                pipeline.Add(new BsonDocument("$limit", pageSize)); // Limit the number of documents per page
            }

            var result = await _userCollection.AggregateAsync<UserOutput>(pipeline);

            var resultList = await result.ToListAsync();

            Console.WriteLine(JsonSerializer.Serialize(resultList));

            return resultList;
        }

        public async Task<List<User>> GetStreamerUsers()
        {
            try
            {
                var filter = Builders<User>.Filter.AnyEq(s => s.Roles, "streamer");

                var test = await _userCollection.Find(filter).FirstOrDefaultAsync();

                Console.Write(JsonSerializer.Serialize(test));

                return await _userCollection.Find(filter)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetAllActiveExternalStreams Error: {ex.Message}");
                return new List<User>();
            }
        }

        public async Task<string> GetPFPUrlFromGamerTag(string gamerTag)
        {
            FilterDefinition<User> filter = Builders<User>.Filter.Eq("beamableProvider.id", gamerTag);
            var user = await _userCollection.Find(filter).FirstOrDefaultAsync();

            return user?.WalletProvider?.Pfp?.ImageUrl ?? "";
        }

        public async Task<bool> AddToUserPoints(string userId, int creditsToAdd)
        {
            try
            {
                FilterDefinition<User> filter = Builders<User>.Filter.Eq("_id", ObjectId.Parse(userId));
                var updateDefinition = new UpdateDefinitionBuilder<User>().Inc(p => p.AccumulatedPersonalCredits, creditsToAdd);
                var user = await _userCollection.FindOneAndUpdateAsync(filter, updateDefinition);
            }
            catch (Exception e)
            {
                Console.WriteLine($"AddToUserPoints - Exception: {e}");
                return false;
            }

            Console.WriteLine("AddToUserPoints - Success");

            return true;
        }

        public async Task<List<UserWithNameAndWalletAddress>> GetAllUsersWithNameAndPrimaryWalletAddress()
        {
            try
            {
                var projection = Builders<User>.Projection
                    .Include("preferences.displayName")
                    .Include("walletProvider.address");

                var documents = await _userCollection
                    .Find<User>(_ => true) // Empty filter = all documents
                    .Project(user => new UserWithNameAndWalletAddress
                    {
                        Id = user.Id.ToString() ?? "",
                        UserName = user.Preferences!.DisplayName ?? "",
                        WalletAddress = user.WalletProvider!.Address ?? ""
                    })
                    .ToListAsync();

                return documents;
            }
            catch (Exception e)
            {
                Console.WriteLine($"GetAllUsersWithNameAndPrimaryWalletAddress - Exception: {e}");
                return new List<UserWithNameAndWalletAddress>();
            }
        }
    }
}
