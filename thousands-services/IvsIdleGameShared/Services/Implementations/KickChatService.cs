using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Amazon.SQS;
using Amazon.SQS.Model;
using IvsIdleGameShared.Models.ExternalStreams;
using IvsIdleGameShared.Services.Interfaces;
using KickLib.Client.Interfaces;
using KickLib.Client.Models.Args;

namespace IvsIdleGameShared.Services.Implementations
{
    public class KickChatService : IKickChatService
    {
        private readonly IKickClient _kickClient;
        private readonly IAmazonSQS _sqsClient;
        private readonly int _kickChannelId;
        private readonly string _kickChatQueueUrl;

        public KickChatService(IKickClient kickClient, IAmazonSQS sqsClient, int kickChannelId, string kickChatQueueUrl)
        {
            _kickClient = kickClient ?? throw new ArgumentNullException(nameof(kickClient));
            _sqsClient = sqsClient ?? throw new ArgumentNullException(nameof(sqsClient));
            _kickChannelId = kickChannelId;
            _kickChatQueueUrl = string.IsNullOrWhiteSpace(kickChatQueueUrl)
                ? throw new ArgumentNullException(nameof(kickChatQueueUrl))
                : kickChatQueueUrl;

            _kickClient.OnMessage += OnMessageReceived;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await _kickClient.ListenToChatRoomAsync(_kickChannelId);
            await _kickClient.ConnectAsync();

            try
            {
                await Task.Delay(Timeout.Infinite, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                await _kickClient.DisconnectAsync();
            }
        }

        private async void OnMessageReceived(object? sender, ChatMessageEventArgs chatMessageEventArgs)
        {
            try
            {
                var chatData = chatMessageEventArgs.Data;
                if (chatData == null)
                {
                    return;
                }

                var payload = new KickChatMessageEvent
                {
                    KickChannelId = chatData.ChatroomId,
                    ChatMessageDateTime = chatData.CreatedAt,
                    UserId = chatData.Sender?.Id.ToString() ?? string.Empty,
                    MessageText = chatData.Content ?? string.Empty
                };

                var sendRequest = new SendMessageRequest
                {
                    QueueUrl = _kickChatQueueUrl,
                    MessageBody = JsonSerializer.Serialize(payload)
                };

                await _sqsClient.SendMessageAsync(sendRequest);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"KickChatService: Failed to send chat message to SQS. {ex}");
            }
        }
    }
}
