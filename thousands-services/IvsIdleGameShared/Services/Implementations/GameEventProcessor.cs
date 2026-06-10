using System.Text.Json;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using MongoDB.Bson;
using NRedisStack.DataTypes;
using PubnubApi;
using PubnubApi.EventEngine.Subscribe.Common;

namespace IvsIdleGameShared.Services.Implementations
{
    public class GameEventProcessor : IGameEventProcessor
    {
        public async Task<SuccessAndErrorMessage> ProcessGameEvent(IUserRepository userRepository, IEventRepository eventRepository, IIdleGameRepository idleGameRepository,
            IWebSocketService webSocketService, IBoostRepository boostRepository, long currentTimestamp, string vendorEventId, string matchId, GameEventEvent gameEvent)
        {
            Console.WriteLine($"vendorEventId: {vendorEventId}");

            //If this is match start
            if (gameEvent.Name == "MatchStarted")
            {
                Console.WriteLine("MatchStarted");

                //Looks up the stage by stageId in MongoDB
                Event? eventFromVendorEventId = await eventRepository.GetEventFromVendorEventId(vendorEventId);
                if (eventFromVendorEventId == null || eventFromVendorEventId.Id == ObjectId.Empty)
                {
                    Console.WriteLine($"Unable to find Event from VendorEventId: {vendorEventId}");

                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = "Unable to find Event from VendorEventId"
                    };
                }

                string? stageId = eventFromVendorEventId?.Id.ToString();
                int? currentSegmentNullable = eventFromVendorEventId?.CurrentSegment;

                Console.WriteLine($"tempEventId: {stageId}, currentSegment: {currentSegmentNullable}");

                if (String.IsNullOrEmpty(stageId))
                {
                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = "Error parsing stageId from Stage"
                    };
                }

                if (!currentSegmentNullable.HasValue)
                {
                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = "currentSegment is missing on stage"
                    };
                }

                int currentSegment = (int)currentSegmentNullable; //currentSegment can't be null because of the null check above

                //If gameEvent.Data is null, return an error
                if (gameEvent?.Data == null)
                {
                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = "Game Event Data is null"
                    };
                }

                Console.WriteLine("Check to make sure the currentSegment hasn't already been used...");

                //Check to make sure the currentSegment hasn't already been used.  We do this by checking the boosts-segments collection in MongoDB for a document with the same value.
                var boostSegment = await boostRepository.GetBoosts(stageId, currentSegment);  

                //If there is already a boosts-segments document for this stageId and segment, then we cannot start the rallies
                if (boostSegment?.StageId == stageId)
                {
                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = $"Match #{currentSegment} is already complete!"
                    };
                }

                Console.WriteLine("There is no boosts-segments doc, so continue...");

                EventMatch newEventMatch = new EventMatch()
                {
                    VendorEventId = vendorEventId,
                    EventId = stageId,
                    MatchId = matchId,
                    Team0Champion = gameEvent.Data.Team0Champion,
                    Team1Champion = gameEvent.Data.Team1Champion,
                    Team0Sidekick = gameEvent.Data.Team0Sidekick,
                    Team1Sidekick = gameEvent.Data.Team1Sidekick,
                    Team0Name = gameEvent.Data.Team0Name,
                    Team0GamerTag = gameEvent.Data.Team0GamerTag,
                    Team1Name = gameEvent.Data.Team1Name,
                    Team1GamerTag = gameEvent.Data.Team1GamerTag,
                    Team0ShortName = gameEvent.Data.Team0ShortName,
                    Team0Color = gameEvent.Data.Team0Color,
                    Team1ShortName = gameEvent.Data.Team1ShortName,
                    Team1Color = gameEvent.Data.Team1Color,
                    Timestamp = currentTimestamp,
                    Segment = currentSegment
                };
                Console.WriteLine("Add event match");

                await idleGameRepository.AddEventMatch(vendorEventId, newEventMatch, stageId);

                //The rounder number is the currentSegment (zero based) + 1
                int roundNumber = currentSegment + 1;
                BoostSignalMessage boostSignalMessage = new BoostSignalMessage
                {
                    BoostEventType = "StartMatch",
                    EventId = stageId, //StageId
                    RoundNumber = roundNumber,
                    EventMatchStartTime = currentTimestamp
                };
                
                string boostSignalMessageString = JsonSerializer.Serialize(boostSignalMessage);
                bool sendMessageSuccess = await webSocketService.SendMessageSignalToPlatformClient($"s.{boostSignalMessage.EventId}", "system",
                    boostSignalMessageString);

                bool sendMessageSuccess2 = await webSocketService.SendMessageSignalToPlatformClient($"rally-overlay-channel", "system",
                    boostSignalMessageString);

                Console.WriteLine($"SendMessageSignalToPlatformClient Completed: {sendMessageSuccess}");

                return new SuccessAndErrorMessage()
                {
                    Success = true,
                    ErrorMessage = ""
                };
            }
            else if (gameEvent.Name == "ChampionScored") //ChampionScored means the match ended
            {
                Console.WriteLine("MatchEnded");

                Event? eventFromVendorEventId = await eventRepository.GetEventFromVendorEventId(vendorEventId);
                if (eventFromVendorEventId == null || eventFromVendorEventId.Id == ObjectId.Empty)
                {
                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = "Unable to find Event from VendorEventId"
                    };
                }

                string? tempEventId = eventFromVendorEventId?.Id.ToString() ?? "";
                Console.WriteLine($"tempEventId: {tempEventId}");

                if (String.IsNullOrEmpty(tempEventId))
                {
                    return new SuccessAndErrorMessage()
                    {
                        Success = false,
                        ErrorMessage = "Error parsing eventId from Event"
                    };
                }

                await idleGameRepository.RemoveEventMatch(vendorEventId);

                BoostSignalMessage boostSignalMessage = new BoostSignalMessage
                {
                    BoostEventType = "EndMatch",
                    EventId = tempEventId,
                    RoundNumber = 0
                };

                string boostSignalMessageString = JsonSerializer.Serialize(boostSignalMessage);
                bool sendMessageSuccess = await webSocketService.SendMessageSignalToPlatformClient($"s.{boostSignalMessage.EventId}", "system",
                    boostSignalMessageString);

                bool sendMessageSuccess2 = await webSocketService.SendMessageSignalToPlatformClient($"rally-overlay-channel", "system",
                    boostSignalMessageString);

                Console.WriteLine($"SendMessageSignalToPlatformClient Completed: {sendMessageSuccess}");

                return new SuccessAndErrorMessage()
                {
                    Success = true,
                    ErrorMessage = ""
                };
            }

            return new SuccessAndErrorMessage()
            {
                Success = false,
                ErrorMessage = "gameEvent.Name type wasn't handlded"
            };
        }
    }
}
