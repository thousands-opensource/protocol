using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Events;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IStreamRepository
    {
        Task<EventStream?> GetStream(string streamId);
        Task<EventStream> GetStreamFromChannelArn(string channelArn);
        Task<EventStream> GetStreamFromStageArn(string stageArn);

        Task<Stage?> GetStage(string stageId);

        Task<List<StageAndEvent>?> GetEvents(string? eventStatus, DateTime? startTime, DateTime? endTime);
    }
}
