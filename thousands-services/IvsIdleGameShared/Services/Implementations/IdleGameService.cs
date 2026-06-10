using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml.Linq;
using Amazon.IVSRealTime.Model;
using Amazon.Lambda.CloudWatchEvents.BatchEvents;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.IdleGame;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using NRedisStack.DataTypes;
using PubnubApi;

namespace IvsIdleGameShared.Services.Implementations
{
    public class IdleGameService : IIdleGameService
    {
        private readonly IIdleGameRepository _idleGameRepository;
        private readonly IIdleGameActionsRepository _idleGameActionsRepository;
        private readonly IIdleEventProcessor _idleEventProcessor;
        private readonly Dictionary<string, IdleEvent> _idleEventsSetup;

        public IdleGameService(IIdleGameRepository idleGameRepository, IIdleEventProcessor idleEventProcessor, IIdleGameActionsRepository idleGameActionsRepository)
        {
            _idleGameRepository = idleGameRepository;
            _idleEventsSetup = new Dictionary<string, IdleEvent>()
            {
                {
                    "BUTTON_1.1X",
                    new IdleEvent() {
                        Name = "BUTTON_1.1X",
                        Cost = 0,
                        PerTick = 0.1M,
                        Duration = 60,
                        Timestamp = 1,
                        IsPersonalEvent = true,
                        VendorEventId = "",
                        ChatActionGuid = Guid.NewGuid()
                    }
                },
                {
                    "BUTTON_1.5X",
                    new IdleEvent() {
                        Name = "BUTTON_1.5X",
                        Cost = 0,
                        PerTick = 0.5M,
                        Duration = 60,
                        Timestamp = 1,
                        IsPersonalEvent = true,
                        VendorEventId = "",
                        ChatActionGuid = Guid.NewGuid()
                    }
                },
                {
                    "BUTTON_2X",
                    new IdleEvent() {
                        Name = "BUTTON_2X",
                        Cost = 0,
                        PerTick = 1.0M,
                        Duration = 60,
                        Timestamp = 1,
                        IsPersonalEvent = true,
                        VendorEventId = "",
                        ChatActionGuid = Guid.NewGuid()
                    }
                }
            };
            _idleEventProcessor = idleEventProcessor;
            _idleGameActionsRepository = idleGameActionsRepository;
        }

        public async Task<IdleGamePlayerActionResponse> PlayerAction(string eventId, string vendorEventId,
            string userId, string command)
        {
            decimal personalCredits = 0;
            decimal previousRolledUpPersonalCredits = 0;

            //Make command uppercase
            command = command.ToUpper();

            //Get the current timestamp
            DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
            long currentTimestamp = dto.ToUnixTimeMilliseconds();

            //Get rolled up personal credits
            previousRolledUpPersonalCredits = await _idleGameRepository.GetRolledUpPersonalCredits(eventId, userId);

            Console.WriteLine($"previousRolledUpPersonalCredits: {previousRolledUpPersonalCredits}");

            //Get the event template for the event type
            IdleEvent idleEvent = _idleEventsSetup[command];
            //Create a chatActionGuid
            idleEvent.ChatActionGuid = Guid.NewGuid();
            //Set the timestamp to Now
            idleEvent.Timestamp = currentTimestamp;

            //Get active events for this player
            var idleEvents = await _idleGameRepository.GetEventsForPlayer(eventId, userId);

            //Calculate personal credits and rollup expired idle game actions
            decimal rolledUpPersonalCredits = 0;
            List<IdleEvent> eventsBeingRemoved = new List<IdleEvent>();
            personalCredits = _idleEventProcessor.CalculatePersonalCreditsFromEvents(currentTimestamp, idleEvents,
                ref rolledUpPersonalCredits, ref eventsBeingRemoved);

            //Remove expired idle game events from cache
            if (eventsBeingRemoved.Count > 0)
            {
                string eventsBeingRemovedJson = JsonSerializer.Serialize(eventsBeingRemoved);
                Console.WriteLine($"Removing event: {eventsBeingRemovedJson}");
                bool success = await _idleGameRepository.RemoveEventsForPlayer(eventId, userId, eventsBeingRemoved);
                if (success)
                {
                    bool success2 =
                        await _idleGameRepository.IncrementRolledUpPersonalCredits(eventId, userId,
                            rolledUpPersonalCredits);
                }
                else
                {
                    Console.WriteLine("Error removing events for player!");
                }
            }

            //Wait until after IncrementRolledUpPersonalCredits to add back the previousRolledUpPersonalCredits 
            rolledUpPersonalCredits += previousRolledUpPersonalCredits;

            //Verify if the cost is met if it has a cost
            Console.WriteLine($"idleEvent.Cost: {idleEvent.Cost}");
            if (idleEvent.Cost > 0)
            {
                if (personalCredits < idleEvent.Cost)
                {
                    Console.WriteLine($"currentTimestamp: {currentTimestamp}");
                    Console.WriteLine($"personalCredits: {personalCredits}");
                    return new IdleGamePlayerActionResponse()
                    {
                        Success = false,
                        Err = $"Action cost not met.  Your credits are: {personalCredits}",
                        Timestamp = currentTimestamp,
                        RolledUpPersonalCredits = rolledUpPersonalCredits
                    };
                }
            }

            //If the event is a "join", then set the vendorEventId
            if (idleEvent.Name == "join")
            {
                idleEvent.VendorEventId = vendorEventId;
            }

            decimal basePointsPerSeconds = 1;
            long streamScore = await _idleGameRepository.GetStreamScore(eventId);
            decimal amountToNextStreamScoreLevel = 100;
            decimal streamScoreLevel = Math.Floor(streamScore / amountToNextStreamScoreLevel) + 1;
            decimal streamScoreBoostMultiplier = streamScoreLevel * 0.1M;

            //Check to see if this is a duplicate join (iterate in reverse)
            for (int eventIndex = idleEvents.Count - 1; eventIndex >= 0; eventIndex--)
            {
                var previousJoinIdleEvent = idleEvents[eventIndex];
                if (previousJoinIdleEvent.Name == "join")
                {
                    if (idleEvent.Name == "join")
                    {
                        Console.WriteLine("Already joined!");

                        //Already joined
                        return new IdleGamePlayerActionResponse()
                        {
                            Success = true,
                            Err = "",
                            Timestamp = currentTimestamp,
                            RolledUpPersonalCredits = rolledUpPersonalCredits,
                            IdleEvent = previousJoinIdleEvent,
                            StreamScore = streamScore
                        };
                    }

                    previousJoinIdleEvent.PerTick = basePointsPerSeconds + streamScoreBoostMultiplier;
                }
            }

            //Send event to projection
            bool successfullyAddedIdleEvent = await _idleGameRepository.AddEventForPlayer(eventId, userId, idleEvent);

            //Adjust the score if there is a cost
            if (idleEvent.Cost > 0)
            {
                personalCredits -= idleEvent.Cost;
            }

            //Add the event to the repository
            StoredIdleEvent storedIdleEvent = new StoredIdleEvent()
            {
                UserId = userId,
                EventId = eventId,
                IdleEvent = idleEvent
            };
            await _idleGameActionsRepository.AddIdleGameAction(storedIdleEvent);

            long newStreamScore = -1;
            //Custom handling per command Name
            if (idleEvent.Name == "BUTTON_1.1X")
            {
                //Update stream score
                newStreamScore = await _idleGameRepository.IncrementStreamScore(eventId, 6);
            }
            else if (idleEvent.Name == "BUTTON_1.5X")
            {
                //Update stream score
                newStreamScore = await _idleGameRepository.IncrementStreamScore(eventId, 30);
            }
            else if (idleEvent.Name == "BUTTON_2X")
            {
                //Update stream score
                newStreamScore = await _idleGameRepository.IncrementStreamScore(eventId, 60);
            }

            Console.WriteLine(JsonSerializer.Serialize(idleEvent));
            Console.WriteLine($"currentTimestamp: {currentTimestamp}");
            Console.WriteLine($"personalCredits: {personalCredits}");
            Console.WriteLine($"rolledUpPersonalCredits: {rolledUpPersonalCredits}");

            //If idleEvents is empty, return null
            IdleEvent[]? idleEventsToReturn = null;
            if (idleEvents.Count > 0)
            {
                idleEventsToReturn = idleEvents.ToArray();
            }

            return new IdleGamePlayerActionResponse()
            {
                Success = true,
                Err = "",
                Timestamp = currentTimestamp,
                RolledUpPersonalCredits = rolledUpPersonalCredits,
                IdleEvent = idleEvent,
                IdleEvents = idleEventsToReturn,
                StreamScore = newStreamScore
            };
        }
    }
}
