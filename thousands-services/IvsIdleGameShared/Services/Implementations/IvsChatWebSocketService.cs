using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Interfaces;
using Amazon.Ivschat;
using Amazon.Ivschat.Model;
using PubnubApi;

namespace IvsIdleGameShared.Services.Implementations
{
    public class IvsChatWebSocketService : IWebSocketService
    {
        public Task<bool> SendChatToPlatformClient(string eventAndChannel, string userId, ChatMessage chatMessage)
        {
            throw new NotImplementedException();
        }

        public async Task<bool> SendEventToPlatformClient(string streamId, string userId, IdleEvent idleEvent)
        {
            //string roomIdentifier = $"chat-room-{streamId}";
            string roomIdentifier = "arn:aws:ivschat:us-west-2:";
            string idleEventJson = JsonSerializer.Serialize(idleEvent);

            AmazonIvschatClient client = new AmazonIvschatClient();
            SendEventRequest sendEventRequest = new SendEventRequest()
            {
                RoomIdentifier = roomIdentifier,
                EventName = "message",
                Attributes = new Dictionary<string, string>()
                {
                    {
                        "message_type",
                        "IDLEEVENT"
                    },
                    {
                        "event",
                        idleEventJson
                    }
                }
            };
            var response = await client.SendEventAsync(sendEventRequest);

            Console.WriteLine("IvsChatWebSocketService - SendEventAsync: " + response.ToString());

            return true;
        }

        public Task<bool> SendMessageSignalToPlatformClient(string channelName, string userId, string message)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SendSignalToPlatformClient(string channelName, string userId, string message)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SendSignalToStreamOverlay(float value)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SendSignalToStreamOverlay(SignalToStreamOverlay signalToStreamOverlay)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SendChatToPlatformClient(string eventAndChannel, string userId, string message)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SetChannelMetadata(string userId, string channelId, string channelName)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SetMemberships(string userId, List<PNMembership> channelIds)
        {
            throw new NotImplementedException();
        }

        public Task<string> GrantToken(string userId, Dictionary<string, PNTokenAuthValues> channelPermissions, bool isModerator)
        {
            throw new NotImplementedException();
        }

        public Dictionary<string, PNTokenAuthValues> GetChannelPermissions(string stageId, List<string> channelIds)
        {
            throw new NotImplementedException();
        }

        public Task<bool> RemoveMembership(string userId, List<string> channelIds)
        {
            throw new NotImplementedException();
        }
    }
}
