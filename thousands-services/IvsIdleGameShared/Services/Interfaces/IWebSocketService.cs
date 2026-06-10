using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using PubnubApi;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IWebSocketService
    {
        Task<bool> SendEventToPlatformClient(string streamId, string userId, IdleEvent idleEvent);
        Task<bool> SendChatToPlatformClient(string eventAndChannel, string userId, ChatMessage chatMessage);
        Task<bool> SendSignalToStreamOverlay(SignalToStreamOverlay signalToStreamOverlay);
        Task<bool> SendSignalToPlatformClient(string channelName, string userId, string message);
        Task<bool> SendMessageSignalToPlatformClient(string channelName, string userId, string message);
        Task<bool> SendChatToPlatformClient(string channel, string userId, string message);
        Dictionary<string, PNTokenAuthValues> GetChannelPermissions(string stageId, List<string> channelIds);
        Task<bool> SetChannelMetadata(string userId, string channelId, string channelName);
        Task<bool> SetMemberships(string userId, List<PNMembership> channelIds);
        Task<bool> RemoveMembership(string userId, List<string> channelIds);
        Task<string> GrantToken(string userId, Dictionary<string, PNTokenAuthValues> channelPermissions, bool isModerator);

    }
}
