using IvsIdleGameShared.Models.ExternalStreams;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IUserExternalStreamWatchMinutesRepository
    {
        Task<bool> UpsertUserExternalStreamWatchMinutesTotal(UserExternalStreamWatchMinutes watchMinutes);
    }
}
