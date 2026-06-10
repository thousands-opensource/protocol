using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Chat;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using PubnubApi;
using ChatMessage = IvsIdleGameShared.Models.Chat.ChatMessage;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoChatRepository : IChatRepository
    {
        private readonly IMongoCollection<ChatMessagesSegment> _chatMessagesSegmentsCollection;
        private readonly IMongoCollection<ChatReactionsSegment> _chatReactionsSegmentsCollection;

        public MongoChatRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _chatMessagesSegmentsCollection = database.GetCollection<ChatMessagesSegment>(mongoDbSettings.ChatMessagesSegmentsCollectionName);
            _chatReactionsSegmentsCollection = database.GetCollection<ChatReactionsSegment>(mongoDbSettings.ChatReactionsSegmentsCollectionName);
        }

        public async Task AddChatMessage(string stageId, int segment, Models.Chat.ChatMessage chatMessage)
        {
            FilterDefinition<ChatMessagesSegment> filter =
                Builders<ChatMessagesSegment>.Filter.Eq("stageId", stageId)
                & Builders<ChatMessagesSegment>.Filter.Eq("segment", segment);
            var updateDefinition =
                new UpdateDefinitionBuilder<ChatMessagesSegment>().Push(p => p.ChatMessages, chatMessage);
            var resultFindAndPush = await _chatMessagesSegmentsCollection.UpdateOneAsync(filter, updateDefinition);

            if (resultFindAndPush?.ModifiedCount < 1)
            {
                ChatMessagesSegment chatMessagesSegmentToAdd = new ChatMessagesSegment()
                {
                    StageId = stageId,
                    Segment = segment,
                    ChatMessages = new List<ChatMessage>()
                    {
                        chatMessage
                    }
                };

                await _chatMessagesSegmentsCollection.InsertOneAsync(chatMessagesSegmentToAdd);
            }
        }

        public async Task AddChatReaction(string stageId, int segment, ChatReaction chatReaction)
        {
            FilterDefinition<ChatReactionsSegment> filter = 
                Builders<ChatReactionsSegment>.Filter.Eq("stageId", stageId)
                & Builders<ChatReactionsSegment>.Filter.Eq("segment", segment);
            var updateDefinition = 
                new UpdateDefinitionBuilder<ChatReactionsSegment>().Push(p => p.ChatReactions, chatReaction);
            var resultFindAndPush = await _chatReactionsSegmentsCollection.UpdateOneAsync(filter, updateDefinition);

            if (resultFindAndPush?.ModifiedCount < 1)
            {
                ChatReactionsSegment chatReactionsSegmentToAdd = new ChatReactionsSegment()
                {
                    StageId = stageId,
                    Segment = segment,
                    ChatReactions = new List<ChatReaction>()
                    {
                        chatReaction
                    }
                };

                await _chatReactionsSegmentsCollection.InsertOneAsync(chatReactionsSegmentToAdd);
            }
        }

        public async Task<List<ChatMessageOutput>> GetChatMessages(string stageId, int segment, long? timestamp)
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

            pipeline.Add(new BsonDocument("$unwind", "$chatMessages"));

            // Add timestamp filter if provided
            if (timestamp.HasValue)
            {
                //matchConditions.Add("chatMessages", /*new BsonDocument("$elemMatch",*/ new BsonDocument("chatMessages.timestamp", new BsonDocument("$gt", timestamp))/*)*/);

                pipeline.Add(new BsonDocument("$match", new BsonDocument("chatMessages.timestamp", new BsonDocument("$gt", timestamp))));
            }

            //Sort by startTime
            pipeline.Add(new BsonDocument("$sort", new BsonDocument("chatMessages.timestamp", -1)));

            //Replace root with boosts
            pipeline.Add(new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$chatMessages")));

            var result = await _chatMessagesSegmentsCollection.AggregateAsync<ChatMessageOutput>(pipeline);

            var resultList = await result.ToListAsync();

            Console.WriteLine(JsonSerializer.Serialize(resultList));

            return resultList;
        }
    }
}
