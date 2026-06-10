using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Metagame;
using IvsIdleGameShared.Models.RallyPrediction;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoRallyPredictionRepository : IRallyPredictionRepository
    {
        private readonly IMongoCollection<RallyPrediction> _rallyPredictionCollection;
        private readonly IMongoCollection<UserRallyPrediction> _userRallyPredictionCollection;
        private readonly IMongoCollection<PredictionChartData> _predictionChartDataCollection;

        public MongoRallyPredictionRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _rallyPredictionCollection = database.GetCollection<RallyPrediction>(mongoDbSettings.RallyPredictionCollectionName);
            _userRallyPredictionCollection = database.GetCollection<UserRallyPrediction>(mongoDbSettings.UserRallyPredictionCollectionName);
            _predictionChartDataCollection = database.GetCollection<PredictionChartData>(mongoDbSettings.PredictionChartDataCollectionName);
        }

        public async Task<RallyPrediction?> GetRallyPrediction(string rallyPredictionId)
        {
            try
            {
                ObjectId rallyPredictionObjectId = ObjectId.Parse(rallyPredictionId);
                var filter = Builders<RallyPrediction>.Filter.Eq(s => s.Id, rallyPredictionObjectId);
                return await _rallyPredictionCollection.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetRallyPrediction Error: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> AddUserRallyPrediction(UserRallyPrediction userRallyPrediction)
        {
            try
            {
                await _userRallyPredictionCollection.InsertOneAsync(userRallyPrediction);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddUserRallyPrediction Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> AddPredictionChartData(PredictionChartData predictionChartData)
        {
            try
            {
                await _predictionChartDataCollection.InsertOneAsync(predictionChartData);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddPredictionChartData Error: {ex.Message}");
                return false;
            }
        }

        public async Task<List<RallyPrediction>> GetRallyPredictions()
        {
            try
            {
                return await _rallyPredictionCollection.Find(new BsonDocument()).ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetRallyPredictions Error: {ex.Message}");
                return new List<RallyPrediction>();
            }
        }

        public async Task<List<UserRallyPrediction>> GetUserRallyPredictions(bool includeFreeCalls, string? rallyPredictionId = null)
        {
            try
            {
                var builder = Builders<UserRallyPrediction>.Filter;
                var filters = new List<FilterDefinition<UserRallyPrediction>>();

                if (!string.IsNullOrEmpty(rallyPredictionId))
                {
                    ObjectId rallyPredictionObjectId = ObjectId.Parse(rallyPredictionId);
                    filters.Add(builder.Eq(doc => doc.RallyPredictionId, rallyPredictionObjectId));
                }

                if (!includeFreeCalls)
                {
                    filters.Add(builder.Gt(doc => doc.Amount, 0));
                }

                var finalFilter = filters.Any() ? builder.And(filters) : builder.Empty;

                return await _userRallyPredictionCollection.Find(finalFilter).ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetUserRallyPredictions Error: {ex.Message}");
                return new List<UserRallyPrediction>();
            }
        }
    }
}
