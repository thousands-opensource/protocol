using System;
using System.Text.Json;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations;

public class MongoBoostRepository : IBoostRepository
{
    private readonly IMongoCollection<BoostsSegement> _boostSegmentsCollection;

    public MongoBoostRepository(IMongoDbSettings mongoDbSettings)
    {
        MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
        IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
        _boostSegmentsCollection = database.GetCollection<BoostsSegement>(mongoDbSettings.BoostsSegmentsCollectionName);
    }

    public async Task AddBoost(string stageId, int segment, Boost boost)
    {
        FilterDefinition<BoostsSegement> filter =
            Builders<BoostsSegement>.Filter.Eq("stageId", stageId)
            & Builders<BoostsSegement>.Filter.Eq("segment", segment);

        var updateDefinition = new UpdateDefinitionBuilder<BoostsSegement>().Push(p => p.Boosts, boost);
        var resultFindAndPush = await _boostSegmentsCollection.UpdateOneAsync(filter, updateDefinition);

        if (resultFindAndPush?.ModifiedCount < 1)
        {
            BoostsSegement boostsSegmentToAdd = new BoostsSegement()
            {
                StageId = stageId,
                Segment = segment,
                Boosts = new List<Boost>()
                {
                    boost
                }
            };

            await _boostSegmentsCollection.InsertOneAsync(boostsSegmentToAdd);
        }
    }

    public async Task AddBoosts(string stageId, int segment, Boost[] boosts)
    {
        FilterDefinition<BoostsSegement> filter =
            Builders<BoostsSegement>.Filter.Eq("stageId", stageId)
            & Builders<BoostsSegement>.Filter.Eq("segment", segment);

        var updateDefinition = new UpdateDefinitionBuilder<BoostsSegement>()
                .PushEach(p => p.Boosts, boosts)
                .SetOnInsert("stageId", stageId)
                .SetOnInsert("segment", segment);
        var resultFindAndPush = await _boostSegmentsCollection.UpdateOneAsync(filter, updateDefinition, new UpdateOptions() { IsUpsert = true });

        /*
        if (resultFindAndPush?.ModifiedCount < 1)
        {
            BoostsSegement boostsSegmentToAdd = new BoostsSegement()
            {
                StageId = stageId,
                Segment = segment,
                Boosts = boosts.ToList()
            };

            await _boostSegmentsCollection.InsertOneAsync(boostsSegmentToAdd);
        }
        */
    }

    public async Task<List<BoostsSegement>> GetBoostsSegments(string stageId)
    {
        try
        {
            FilterDefinition<BoostsSegement> filter =
                Builders<BoostsSegement>.Filter.Eq("stageId", stageId);

            return await _boostSegmentsCollection.Find(filter).ToListAsync();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }

    public async Task<BoostsSegement> GetBoosts(string stageId, int segment)
    {
        try
        {
            FilterDefinition<BoostsSegement> filter =
                Builders<BoostsSegement>.Filter.Eq("stageId", stageId)
                & Builders<BoostsSegement>.Filter.Eq("segment", segment);

            return await _boostSegmentsCollection.Find(filter).FirstOrDefaultAsync<BoostsSegement>();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }

    public async Task<List<BoostOutput>> GetBoosts(string stageId, int segment, string? userId)
    {
        var pipeline = new List<BsonDocument>();

        var matchConditions = new BsonDocument();

        pipeline.Add(new BsonDocument("$match", new BsonDocument
            {
                { "$and", new BsonArray
                    {
                        new BsonDocument("stageId", stageId),
                        new BsonDocument("segment", segment)
                    }
                }
            })
        );

        pipeline.Add(new BsonDocument("$unwind", "$boosts"));

        // Add userId filter if provided
        if (!string.IsNullOrEmpty(userId))
        {
            //matchConditions.Add("boosts",  new BsonDocument("boosts.userId", userId));

            pipeline.Add(new BsonDocument("$match", new BsonDocument("boosts.userId", userId)));
        }

        //Sort by startTime
        pipeline.Add(new BsonDocument("$sort", new BsonDocument("boosts.timestamp", -1)));

        //Replace root with boosts
        pipeline.Add(new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$boosts")));

        var result = await _boostSegmentsCollection.AggregateAsync<BoostOutput>(pipeline);

        var resultList = await result.ToListAsync();

        Console.WriteLine(JsonSerializer.Serialize(resultList));

        return resultList;
    }
}
