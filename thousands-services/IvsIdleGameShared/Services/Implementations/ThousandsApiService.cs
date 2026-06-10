using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Chat;
using IvsIdleGameShared.Models.Events;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.RallyPrediction;
using IvsIdleGameShared.Models.Request;
using IvsIdleGameShared.Models.Response;
using IvsIdleGameShared.Models.Users;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using MongoDB.Bson;
using PubnubApi;

namespace IvsIdleGameShared.Services.Implementations
{
    public class ThousandsApiService : IThousandsApiService
    {
        private readonly IStreamRepository _streamRepository;
        private readonly IUserRepository _userRepository;
        private readonly ICreditBalanceRepository _creditBalanceRepository;
        private readonly IChatRepository _chatRepository;
        private readonly IBoostRepository _boostRepository;
        private readonly IRallyPredictionRepository _rallyPredictionRepository;

        public ThousandsApiService(IStreamRepository streamRepository, 
            IUserRepository userRepository, 
            ICreditBalanceRepository creditBalanceRepository,
            IBoostRepository boostRepository,
            IChatRepository chatRepository,
            IRallyPredictionRepository rallyPredictionRepository)
        {
            _streamRepository = streamRepository;
            _userRepository = userRepository;
            _creditBalanceRepository = creditBalanceRepository;
            _boostRepository = boostRepository;
            _chatRepository = chatRepository;
            _rallyPredictionRepository = rallyPredictionRepository;
        }

        public async Task<GetEventsResponse> GetEvents(GetEventsRequest request)
        {
            var stagesAndEvents = await _streamRepository.GetEvents(request.EventStatus, request.StartTime, request.EndTime);

            return new GetEventsResponse()
            {
                Success = true,
                Message = "",
                Data = stagesAndEvents
            };
        }

        public async Task<GetUsersResponse> GetUsers(GetUsersRequest request)
        {
            int? page = null;
            if (!string.IsNullOrEmpty(request.PageString))
            {
                page = int.Parse(request.PageString);
            }
            int? pageSize = null;
            if (!string.IsNullOrEmpty(request.PageSizeString))
            {
                pageSize = int.Parse(request.PageSizeString);
            }

            var user = await _userRepository.GetUsers(request.UserId, request.DisplayName, request.WalletAddress, page, pageSize);

            return new GetUsersResponse()
            {
                Success = true,
                Message = "",
                Data = user
            };
        }

        public async Task<GetCreditsPurchasedResponse> GetCreditsPurchased(GetCreditsPurchasedRequest request)
        {
            var creditTransactions = await _creditBalanceRepository.GetCreditTransactions(request.UserId);

            return new GetCreditsPurchasedResponse()
            {
                Success = true,
                Message = "",
                Data = creditTransactions
            };
        }

        public async Task<GetCreditsSpentResponse> GetCreditsSpent(GetCreditsSpentRequest request)
        {
            int segment = 0;
            if (!string.IsNullOrEmpty(request.SegmentString))
            {
                segment = int.Parse(request.SegmentString);
            }

            var creditsSpent = await _boostRepository.GetBoosts(request.StageId, segment, request.UserId);

            return new GetCreditsSpentResponse()
            {
                Success = true,
                Message = "",
                Data = creditsSpent
            };
        }

        public async Task<GetChatMessagesResponse> GetChatMessages(GetChatMessagesRequest request)
        {
            int segment = 0;
            if (!string.IsNullOrEmpty(request.SegmentString))
            {
                segment = int.Parse(request.SegmentString);
            }

            long? timestamp = null;
            if (!string.IsNullOrEmpty(request.TimestampString))
            {
                timestamp = long.Parse(request.TimestampString);
            }

            var chatMessages = await _chatRepository.GetChatMessages(request.StageId, segment, timestamp);

            return new GetChatMessagesResponse()
            {
                Success = true,
                Message = "",
                Data = chatMessages
            };
        }

        public async Task<GetCallsForForecastsResponse> GetCallsForForecasts(GetCallsForForecastsRequest request)
        {
            bool includeFreeCalls = request.IncludeFreeCalls.ToLower() == "true";
            bool onlyIncludeResolvedForecasts = request.OnlyIncludeResolvedForecasts.ToLower() == "true";

            var listOfUsers = await _userRepository.GetAllUsersWithNameAndPrimaryWalletAddress();
            Console.WriteLine($"listOfUsers row count: {listOfUsers.Count}");

            var cachedUsers = new Dictionary<string, UserWithNameAndWalletAddress>();
            foreach (var userToCache in listOfUsers)
            {
                cachedUsers.TryAdd(userToCache.Id, userToCache);
            }

            var listOfForecasts = await _rallyPredictionRepository.GetRallyPredictions();
            Console.WriteLine($"listOfForecasts row count: {listOfForecasts.Count}");

            var listOfCalls = await _rallyPredictionRepository.GetUserRallyPredictions(includeFreeCalls, request.ForecastId);
            Console.WriteLine($"listOfCalls row count: {listOfCalls.Count}");

            List<CallWithForecast> outputCalls = new List<CallWithForecast>();
            foreach (var call in listOfCalls)
            {
                var forecast = listOfForecasts.Find(forecast => forecast.Id == call.RallyPredictionId);

                string userId = call.UserId.ToString() ?? "";

                var foundUser = new UserWithNameAndWalletAddress();
                if (!string.IsNullOrEmpty(userId) && cachedUsers.TryGetValue(userId, out UserWithNameAndWalletAddress? userFromCache))
                {
                    foundUser = userFromCache;
                }

                if (string.IsNullOrEmpty(foundUser.Id))
                {
                    Console.WriteLine($"GetCallsForForecasts: Couldn't find user for userId: {call.UserId.ToString()}");
                    continue;
                }

                if (forecast == null)
                {
                    Console.WriteLine($"GetCallsForForecasts: Couldn't find forecast for forecastId: {call.RallyPredictionId}");
                    continue;
                }

                if (!onlyIncludeResolvedForecasts || onlyIncludeResolvedForecasts && !forecast.ResolvedChoice != null)
                {
                    var outputCall = new CallWithForecast
                    {
                        ForecastId = forecast.Id.ToString() ?? "",
                        Title = forecast.Title,
                        OptionAText = forecast.OptionAText,
                        OptionBText = forecast.OptionBText,
                        StartDate = forecast.StartDate,
                        EndDate = forecast.EndDate,
                        MaxCreditSpend = forecast.MaxCreditSpend,
                        WcAmount = forecast.WcAmount,
                        ResolvedChoice = forecast.ResolvedChoice,
                        CallId = call.Id.ToString() ?? "",
                        CallMadeAt = call.CreatedAt,
                        UserId = userId,
                        UserName = foundUser.UserName,
                        WalletAddress = foundUser.WalletAddress,
                        Amount = call.Amount,
                        Price = call.Price,
                        ForOrAgainst = call.ForOrAgainst,
                        SelectedOptionText = call.SelectedOptionText
                    };

                    outputCalls.Add(outputCall);
                }
            }

            return new GetCallsForForecastsResponse
            {
                Success = true,
                Message = "",
                Data = outputCalls
            };
        }
    }
}
