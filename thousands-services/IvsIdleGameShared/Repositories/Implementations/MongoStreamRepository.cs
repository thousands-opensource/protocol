using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Events;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using PubnubApi;
using System.IO;
using System.Text.Json;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoStreamRepository : IStreamRepository
    {
        private readonly IMongoCollection<EventStream> _streamsCollection;
        private readonly IMongoCollection<Stage> _stagesCollection;

        public MongoStreamRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _streamsCollection = database.GetCollection<EventStream>(mongoDbSettings.StreamsCollectionName);
            _stagesCollection = database.GetCollection<Stage>("stages");
        }

        public async Task<EventStream?> GetStream(string streamId)
        {
            FilterDefinition<EventStream> filter = Builders<EventStream>.Filter.Eq("Id", streamId);
            return await _streamsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<EventStream> GetStreamFromChannelArn(string channelArn)
        {
            FilterDefinition<EventStream> filter = Builders<EventStream>.Filter.Eq("channelArn", channelArn);
            return await _streamsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<EventStream> GetStreamFromStageArn(string stageArn)
        {
            FilterDefinition<EventStream> filter = Builders<EventStream>.Filter.Eq("stageArn", stageArn);
            return await _streamsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Stage?> GetStage(string stageId)
        {
            FilterDefinition<Stage> filter = Builders<Stage>.Filter.Eq("_id", ObjectId.Parse(stageId));
            return await _stagesCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<StageAndEvent>?> GetEvents(string? eventStatus, DateTime? startTime, DateTime? endTime)
        {
            var pipeline = new List<BsonDocument>();

            var matchConditions = new BsonDocument();

            // Add eventStatus filter if provided
            if (!string.IsNullOrEmpty(eventStatus))
            {
                matchConditions.Add("status", eventStatus);
            }

            // Add date range startTime filter if provided
            if (startTime.HasValue)
            {
                matchConditions.Add("startDate", new BsonDocument("$gte", startTime.Value));
            }

            // Add date range endTime filter if provided
            if (endTime.HasValue)
            {
                matchConditions.Add("startDate", new BsonDocument("$lte", endTime.Value));
            }

            // Only add `$match` if there are conditions
            if (matchConditions.ElementCount > 0)
            {
                pipeline.Add(new BsonDocument("$match", matchConditions));
            }

            //Sort by startTime
            pipeline.Add(new BsonDocument("$sort", new BsonDocument("startTime", -1)));

            pipeline.Add(new BsonDocument("$lookup", new BsonDocument
            {
                { "from", "events" }, // Collection to join
                { "localField", "eventId" }, // Field in stages
                { "foreignField", "_id" }, // Field in events
                { "as", "eventDetails" } // Output field
            }));

            var result = await _stagesCollection.AggregateAsync<StageAndEvent>(pipeline);

            var resultList = await result.ToListAsync();

            Console.WriteLine(JsonSerializer.Serialize(resultList));

            return resultList;
        }
    }
}
