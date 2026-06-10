using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Request;
using IvsIdleGameShared.Models.Response;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IThousandsApiService
    {
        Task<GetEventsResponse> GetEvents(GetEventsRequest request);
        Task<GetUsersResponse> GetUsers(GetUsersRequest request);
        Task<GetCreditsPurchasedResponse> GetCreditsPurchased(GetCreditsPurchasedRequest request);
        Task<GetCreditsSpentResponse> GetCreditsSpent(GetCreditsSpentRequest request);
        Task<GetChatMessagesResponse> GetChatMessages(GetChatMessagesRequest request);
        Task<GetCallsForForecastsResponse> GetCallsForForecasts(GetCallsForForecastsRequest request);
    }
}
