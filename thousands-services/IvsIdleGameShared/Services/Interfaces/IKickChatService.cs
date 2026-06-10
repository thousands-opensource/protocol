using System.Threading;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IKickChatService
    {
        Task StartAsync(CancellationToken cancellationToken);
    }
}
