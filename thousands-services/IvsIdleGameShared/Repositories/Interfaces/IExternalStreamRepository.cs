using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.ExternalStreams;
using PubnubApi.EndPoint;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IExternalStreamRepository
    {
        Task<bool> AddExternalStream(ExternalStream externalStream);
        Task<List<ExternalStream>?> GetAllActiveExternalStreams();
        Task<bool> UpdateExternalStreamSetAmountEarned(string id, decimal newAmountEarned);
        Task<bool> UpdateExternalStreamSetEndDate(string id, DateTime endDate);
        Task<bool> UpdateExternalStreamSetThumbnailAndViewerCount(string id, string thumbnail, int viewerCount);

        Task<bool> AddExternalStreamStats(ExternalStreamStats externalStreamStats);
        Task<List<ExternalStreamStats>> GetExternalStreamStatsByDateRange(DateTime startDate, DateTime endDate);

        Task<bool> AddGiftEvent(GiftEvent giftEvent);
    }
}
