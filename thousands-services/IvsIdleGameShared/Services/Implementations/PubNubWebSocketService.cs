using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Interfaces;
using PubnubApi;
using PubnubApi.EndPoint;
using PubnubApi.EventEngine.Subscribe.Common;

namespace IvsIdleGameShared.Services.Implementations
{

    public class PubNubWebSocketService : IWebSocketService
    {
        private Pubnub? _pubNub;
        private readonly string _pubNubPublisherKey;
        private readonly string _pubNubSubscriberKey;
        private readonly string _pubNubSecretKey;

        public PubNubWebSocketService(IChatWebSocketSettings iChatWebSocketSettings)
        {
            _pubNubPublisherKey = iChatWebSocketSettings.PublisherKey ?? "";
            _pubNubSubscriberKey = iChatWebSocketSettings.SubscriberKey ?? "";
            _pubNubSecretKey = iChatWebSocketSettings.SecretKey ?? "";
        }

        public void ConfigurePubNub(string userId)
        {
            PNConfiguration pnConfiguration = new PNConfiguration(new UserId(userId))
            {
                SubscribeKey = _pubNubSubscriberKey,
                PublishKey = _pubNubPublisherKey,
                SecretKey = _pubNubSecretKey,
            };
            _pubNub = new Pubnub(pnConfiguration);
        }

        public async Task<bool> SendEventToPlatformClient(string streamId, string userId, IdleEvent idleEvent)
        {
            Console.WriteLine("SendEventToPlatformClient Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            Console.WriteLine("SendEventToPlatformClient Publish");

            string idleEventJson = JsonSerializer.Serialize(idleEvent);

            PNResult<PNPublishResult> publishResponse = await _pubNub.Signal()
                .Message(idleEventJson)
                .Channel("Default")
                .ExecuteAsync();
            PNPublishResult publishResult = publishResponse.Result;
            PNStatus status = publishResponse.Status;
            Console.WriteLine("publishResponse : " + JsonSerializer.Serialize(publishResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());

            Console.WriteLine("SendEventToPlatformClient Complete");

            return true;
        }

        public async Task<bool> SendChatToPlatformClient(string eventAndChannel, string userId, ChatMessage chatMessage)
        {
            Console.WriteLine("SendChatToPlatformClient Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            string channel = "g." + eventAndChannel;

            PNResult<PNPublishResult> publishResponse = await _pubNub.Publish()
                .Message(chatMessage)
                .Channel(channel)
                .ExecuteAsync();
            PNPublishResult publishResult = publishResponse.Result;
            PNStatus status = publishResponse.Status;
            Console.WriteLine("publishResponse : " + JsonSerializer.Serialize(publishResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());
            Console.WriteLine("SendChatToPlatformClient Complete");

            return true;
        }

        public async Task<bool> SendSignalToStreamOverlay(SignalToStreamOverlay signalToStreamOverlay)
        {
            ConfigurePubNub("system-idle-game");

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            string signalToStreamOverlayJson = JsonSerializer.Serialize(signalToStreamOverlay);
            Console.WriteLine($"SendSignalToStreamOverlay: {signalToStreamOverlayJson}");

            PNResult<PNPublishResult> publishResponse = await _pubNub.Publish()
                .Message(signalToStreamOverlay)
                .Channel("stream-overlay")
                .ExecuteAsync();
            PNPublishResult publishResult = publishResponse.Result;
            PNStatus status = publishResponse.Status;
            Console.WriteLine("publishResponse : " + JsonSerializer.Serialize(publishResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());

            return true;
        }

        public async Task<bool> SendSignalToPlatformClient(string channelName, string userId, string message)
        {
            Console.WriteLine("SendEventToPlatformClient Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            Console.WriteLine("SendSignalToPlatformClient Signal");

            PNResult<PNPublishResult> publishResponse = await _pubNub.Signal()
                .Message(message)
                .Channel(channelName)
                .ExecuteAsync();
            PNPublishResult publishResult = publishResponse.Result;
            PNStatus status = publishResponse.Status;
            Console.WriteLine("publishResponse : " + JsonSerializer.Serialize(publishResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());

            Console.WriteLine("SendSignalToPlatformClient Complete");

            return true;
        }

        public async Task<bool> SendMessageSignalToPlatformClient(string channelName, string userId, string message)
        {
            Console.WriteLine("SendMessageSignalToPlatformClient Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("SendMessageSignalToPlatformClient - Error connecting to PubNub");
                return false;
            }

            Console.WriteLine("SendMessageSignalToPlatformClient Message");

            PNResult<PNPublishResult> publishResponse = await _pubNub.Publish()
                .Message(message)
                .Channel(channelName)
                .ExecuteAsync();
            PNPublishResult publishResult = publishResponse.Result;
            PNStatus status = publishResponse.Status;
            Console.WriteLine("SendMessageSignalToPlatformClient - publishResponse : " + JsonSerializer.Serialize(publishResponse));
            Console.WriteLine("SendMessageSignalToPlatformClient - pub status code : " + status.StatusCode.ToString());

            Console.WriteLine("SendMessageSignalToPlatformClient Complete");

            return true;
        }

        public async Task<bool> SendChatToPlatformClient(string channel, string userId, string message)
        {
            Console.WriteLine("SendChatToPlatformClient Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            PNResult<PNPublishResult> publishResponse = await _pubNub.Publish()
                .Message(message)
                .Channel(channel)
                .ExecuteAsync();
            PNPublishResult publishResult = publishResponse.Result;
            PNStatus status = publishResponse.Status;
            Console.WriteLine("publishResponse : " + JsonSerializer.Serialize(publishResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());
            Console.WriteLine("SendChatToPlatformClient Complete");

            return true;
        }

        public Dictionary<string, PNTokenAuthValues> GetChannelPermissions(string stageId, List<string> channelIds)
        {
            Console.WriteLine("GetChannelPermissions Started");

            Dictionary<string, PNTokenAuthValues> channelPermissions = new Dictionary<string, PNTokenAuthValues>();

            Console.WriteLine("Configuring channel permissions");
            // Add channel permissions for each channelId
            foreach (string channelId in channelIds)
            {
                channelPermissions.Add(channelId, new PNTokenAuthValues()
                {
                    Read = true,
                    Write = true,
                    Update = true,
                    Join = true,
                    Get = true,
                    Delete = true
                });
            }

            Console.WriteLine("Configuring system channel permissions");
            // Create a dictionary for system channels
            var systemChannelPermissions = new Dictionary<string, PNTokenAuthValues>
            {
                [$"group.{stageId}.system"] = new PNTokenAuthValues
                {
                    Read = true,
                    Get = true,
                    Join = true
                }
            };

            // Merge two dictionaries
            foreach (var kv in systemChannelPermissions)
            {
                channelPermissions[kv.Key] = kv.Value;
            }

            return channelPermissions;
        }

        public async Task<bool> SetChannelMetadata(string userId, string channelId, string channelName)
        {
            Console.WriteLine("SetChannelMetadata Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            PNResult<PNSetChannelMetadataResult> setChannelMetadataResponse = await _pubNub.SetChannelMetadata().Channel(channelId).Name(channelName).ExecuteAsync();
            PNSetChannelMetadataResult setChannelMetadataResult = setChannelMetadataResponse.Result;
            PNStatus status = setChannelMetadataResponse.Status;
            Console.WriteLine("setChannelMetadataResponse : " + JsonSerializer.Serialize(setChannelMetadataResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());
            if (status.StatusCode != 200)
            {
                Console.WriteLine($"Failed to set channel metadata for userId: {userId}");
                return false;
            }

            return true;
        }

        public async Task<bool> SetMemberships(string userId, List<PNMembership> channelIds)
        {
            Console.WriteLine("SetMemberships Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            PNResult<PNMembershipsResult> setMembershipsResponse = await _pubNub.SetMemberships().Uuid(userId).Channels(channelIds).ExecuteAsync();
            PNMembershipsResult setMembershipsResult = setMembershipsResponse.Result;
            PNStatus status = setMembershipsResponse.Status;
            Console.WriteLine("setMembershipsResponse : " + JsonSerializer.Serialize(setMembershipsResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());
            if (status.StatusCode != 200)
            {
                Console.WriteLine($"Failed to set memberships for userId: {userId}");
                return false;
            }

            return true;
        }

        public async Task<bool> RemoveMembership(string userId, List<string> channelIds)
        {
            Console.WriteLine("RemoveMembership Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return false;
            }

            PNResult<PNMembershipsResult> removeMembershipResponse = await _pubNub.RemoveMemberships().Uuid(userId).Channels(channelIds).ExecuteAsync();
            PNMembershipsResult removeMembershipResult = removeMembershipResponse.Result;
            PNStatus status = removeMembershipResponse.Status;
            Console.WriteLine("removeMembershipResponse : " + JsonSerializer.Serialize(removeMembershipResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());
            if (status.StatusCode != 200)
            {
                Console.WriteLine($"Failed to remove memberships for userId: {userId}");
                return false;
            }

            return true;
        }

        public async Task<string> GrantToken(string userId, Dictionary<string, PNTokenAuthValues> channelPermissions, bool isModerator)
        {
            Console.WriteLine("GrantToken Started");

            ConfigurePubNub(userId);

            if (_pubNub == null)
            {
                Console.WriteLine("Error connecting to PubNub");
                return string.Empty;
            }

            // Get the resources for the user
            var resources = new PNTokenResources()
            {
                Uuids = new Dictionary<string, PNTokenAuthValues> { {userId, new PNTokenAuthValues{
                    Update = true,
                    Delete = isModerator,
                    Get = true,

                }}},
                Channels = channelPermissions
            };

            // Get the patterns for the user
            var patterns = new PNTokenPatterns()
            {
                Uuids = new Dictionary<string, PNTokenAuthValues>()
                {
                    { ".*", new PNTokenAuthValues() { Get = true } }

                },
                Channels = new Dictionary<string, PNTokenAuthValues>()
                {
                    {
                        "PUBNUB_INTERNAL_.*", new PNTokenAuthValues() {
                            Read = true,
                            Write = true,
                            Update = true,
                            Join = true,
                            Get = true,
                            Delete = isModerator
                    }},
                    {
                        ".*", new PNTokenAuthValues() {
                            Read = true
                        }
                    }
                }
            };

            PNResult<PNAccessManagerTokenResult> tokenGrantResponse = await _pubNub.GrantToken().TTL(180).AuthorizedUuid(userId).Resources(resources).Patterns(patterns).ExecuteAsync();

            PNAccessManagerTokenResult tokenGrantResult = tokenGrantResponse.Result;
            PNStatus status = tokenGrantResponse.Status;
            Console.WriteLine("tokenGrantResponse : " + JsonSerializer.Serialize(tokenGrantResponse));
            Console.WriteLine("pub status code : " + status.StatusCode.ToString());
            if (status.StatusCode != 200)
            {
                Console.WriteLine($"Failed to grant token for userId: {userId}");
                return string.Empty;
            }

            return tokenGrantResult.Token;
        }

    }
}