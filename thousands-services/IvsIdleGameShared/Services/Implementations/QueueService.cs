using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Queue;
using IvsIdleGameShared.Models.Ticket;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using MongoDB.Bson;
using PubnubApi;

namespace IvsIdleGameShared.Services.Implementations
{
    public class QueueService : IQueueService
    {
        private readonly IQueueRepository _queueRepository;
        private readonly ITicketRepository _ticketRepository;
        private readonly IStreamRepository _streamsRepository;
        private readonly IFanVisibilityService _fanVisibilityService;

        public QueueService(IQueueRepository queueRepository, ITicketRepository ticketRepository, IStreamRepository streamsRepository,
            IFanVisibilityService fanVisibilityService)
        {
            _queueRepository = queueRepository;
            _ticketRepository = ticketRepository;
            _streamsRepository = streamsRepository;
            _fanVisibilityService = fanVisibilityService;
        }

        public async Task<PositionInQueue> GetPositionInQueue(string queueId, string userId)
        {
            //Check if we event need to put a player in the queue - queueId = stageId
            var stage = await _streamsRepository.GetStage(queueId);

            //We didn't find the stream from the queueId
            if (stage == null)
            {
                Console.WriteLine($"Can't find stage from queueId: {queueId}");
                return new PositionInQueue();
            }

            string? seriesId = stage.SeriesId?.ToString();
            string vendorEventId = stage.BeamableEventId ?? "";

            //Use the vendorEventId to get the numberOfGeneralAdmissionFansInTheStands
            long numberOfGeneralAdmissionFansInTheStands = await _fanVisibilityService.GetNumberOfGeneralAdmissionFansInTheStands(vendorEventId);
            Console.WriteLine($"GetNumberOfGeneralAdmissionFansInTheStands: {numberOfGeneralAdmissionFansInTheStands}");

            //If we aren't full, just let the user in
            if (numberOfGeneralAdmissionFansInTheStands < stage.MaxGeneralAdmission)
            {
                await GenerateAccessCodeAndClaimTicketForUser(userId, queueId, seriesId);

                return new PositionInQueue()
                {
                    PlaceInLine = -1,
                    NumberAheadOfMe = -1,
                    TotalInLine = -1,
                    LetUserInNow = true
                };
            }

            int placeInLine = await _queueRepository.GetUserPlaceInLine(queueId, userId);

            //If we are already in line.  GetUserPlaceInLine returns -1 when we aren't in line
            if (placeInLine > -1)
            {
                int currentEndOfLine = await _queueRepository.GetEndOfLine(queueId);
                int beginningOfLine = await _queueRepository.GetBeginningOfLine(queueId);
                int numberOfUsersInLine = currentEndOfLine - beginningOfLine;
                int numberAheadOfMe = placeInLine - beginningOfLine;

                return new PositionInQueue()
                {
                    PlaceInLine = placeInLine,
                    NumberAheadOfMe = numberAheadOfMe,
                    TotalInLine = numberOfUsersInLine,
                    LetUserInNow = numberAheadOfMe < 1 //If we are at the front of the line, then LetUserInNow is true
                };
            }

            //We aren't in line yet
            return new PositionInQueue();
        }

        public async Task<PositionInQueue> JoinQueue(string queueId, string userId)
        {
            //Make sure we aren't already in the queue.  No dupes.
            int placeInLine = await _queueRepository.GetUserPlaceInLine(queueId, userId);

            //If we are already in line.  GetUserPlaceInLine returns -1 when we aren't in line
            if (placeInLine > -1)
            {
                //We fill the PlaceInLine to let the caller know we are already in line
                return new PositionInQueue()
                {
                    PlaceInLine = placeInLine
                };
            }

            //Move the end of line up by one because we are adding one new user to the line
            int newEndOfLine = await _queueRepository.IncrementEndOfLine(queueId, 1);

            bool success = await _queueRepository.AddUserToLine(queueId, userId, newEndOfLine);

            if (success)
            {
                int beginningOfLine = await _queueRepository.GetBeginningOfLine(queueId);

                if (beginningOfLine < 0)
                {
                    beginningOfLine = await _queueRepository.SetBeginningOfLine(queueId, 0);
                }

                int numberOfUsersInLine = newEndOfLine - beginningOfLine;

                return new PositionInQueue()
                {
                    PlaceInLine = newEndOfLine,
                    NumberAheadOfMe = numberOfUsersInLine,
                    TotalInLine = numberOfUsersInLine,
                    LetUserInNow = false
                };
            }

            //There was an error adding us to the line
            return new PositionInQueue();
        }

        //Find user(s) at the front of the updated queue.  Generate access codes and apply and claim ticket for each user
        public async Task<int> AdvanceQueue(string queueId, int amountToAdvanceTheQueue)
        {
            //Get the beginning of the line
            int beginningOfLine = await _queueRepository.GetBeginningOfLine(queueId);

            //Get the end of the line
            int endOfLine = await _queueRepository.GetEndOfLine(queueId);

            //If amountToAdvanceTheQueue would go past the end of the line, adjust it lower
            int adjustedAmountToAdvanceTheQueue = amountToAdvanceTheQueue;
            if (beginningOfLine + amountToAdvanceTheQueue > endOfLine)
            {
                adjustedAmountToAdvanceTheQueue = endOfLine - beginningOfLine;
                Console.WriteLine($"Adjusted amountToAdvanceTheQueue of {amountToAdvanceTheQueue} down to {adjustedAmountToAdvanceTheQueue} so it doesn't go past the end of the line {endOfLine}");
            }

            //Loop through each user who has reached the front of the line
            for (int placeInLineOffset = 0; placeInLineOffset < adjustedAmountToAdvanceTheQueue; placeInLineOffset++)
            {
                //Get the user at the beginning of the line (we have to add 1 because the line is 1 based instead of zero based)
                string userId = await _queueRepository.GetUserInPlaceInLine(queueId, beginningOfLine + placeInLineOffset + 1);

                //If we were unable to find a user at this place in line
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("Error getting user at beginning of line!");
                    return beginningOfLine;
                }

                await GenerateAccessCodeAndClaimTicketForUser(userId, queueId, null);
                Console.WriteLine($"GenerateAccessCodeAndClaimTicketForUser: {userId}");
            }

            Console.WriteLine($"IncrementBeginningOfLine: {adjustedAmountToAdvanceTheQueue}");
            int newBeginningOfLine = await _queueRepository.IncrementBeginningOfLine(queueId, adjustedAmountToAdvanceTheQueue);

            return newBeginningOfLine;
        }

        public async Task GenerateAccessCodeAndClaimTicketForUser(string userId, string queueId, string? seriesId)
        {
            //Make sure we don't already have a ticket to this queueId (stageId)
            ClaimedTicket? existingClaimedTicket = await _ticketRepository.GetClaimedTicket(userId, queueId);

            string claimedTicketJson = JsonSerializer.Serialize(existingClaimedTicket);
            Console.WriteLine($"Existing claimed ticket found: {claimedTicketJson}");

            //If we have an existing claimed ticket for this stageId (eventId and queueId are actually stageId)
            if (existingClaimedTicket != null && existingClaimedTicket.EventId == queueId)
            {
                Console.WriteLine("We already have a claimed ticket!");
                return;
            }

            //If we didn't get a seriesId passed in, then we have to look it up
            if (seriesId == null)
            {
                //Check if we event need to put a player in the queue - queueId = stageId
                var stage = await _streamsRepository.GetStage(queueId);

                //We didn't find the stream from the queueId
                if (stage == null)
                {
                    Console.WriteLine($"GenerateAccessCodeAndClaimTicketForUser: Can't find stage from queueId: {queueId}");
                    return;
                }

                seriesId = stage.SeriesId?.ToString();
            }

            //Generate an access code
            AccessCode newAccessAccessCode = new AccessCode()
            {
                AccessCodeValue = Guid.NewGuid().ToString(),
                SeriesId = new ObjectId(seriesId),
                Intent = "ticket",
                Tier = "general-admission",
                MaxQuantity = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 0
            };

            AccessCode accessCode = await _ticketRepository.CreateAccessCode(newAccessAccessCode);

            //We failed to create an access code
            if (String.IsNullOrEmpty(accessCode.AccessCodeValue))
            {
                Console.WriteLine("Error creating access code!");
                return;
            }

            //Claim a ticket
            ClaimedTicket newClaimedTicket = new ClaimedTicket()
            {
                AccessCodeId = accessCode.Id,
                UserId = new ObjectId(userId),
                Tier = "general-admission",
                EventId = queueId, //This is the stageId
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 0
            };

            ClaimedTicket claimedTicket = await _ticketRepository.CreateClaimedTicket(newClaimedTicket);

            //We failed to create a claimed ticket
            if (String.IsNullOrEmpty(claimedTicket.EventId))
            {
                Console.WriteLine("Error creating claimed ticket!");
                return;
            }
        }
    }
}
