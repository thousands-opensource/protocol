using System;
using System.Threading;
using System.Threading.Tasks;
using Amazon.SQS;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using KickLib.Client;
using KickLib.Client.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace KickListener
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var kickChannelIdEnvironmentVar = Environment.GetEnvironmentVariable("KICK_CHANNEL_ID");
            var kickChatQueueUrlEnvironmentVar = Environment.GetEnvironmentVariable("KICK_CHAT_QUEUE_URL");

            if (!int.TryParse(kickChannelIdEnvironmentVar, out var kickChannelId))
            {
                Console.WriteLine("KICK_CHANNEL_ID environment variable is missing or invalid.");
                return;
            }

            if (string.IsNullOrWhiteSpace(kickChatQueueUrlEnvironmentVar))
            {
                Console.WriteLine("KICK_CHAT_QUEUE_URL environment variable is missing or invalid.");
                return;
            }

            var services = new ServiceCollection();
            services.AddSingleton<IKickClient, KickClient>();
            services.AddSingleton<IAmazonSQS, AmazonSQSClient>();
            services.AddSingleton<IKickChatService>(sp =>
                new KickChatService(
                    sp.GetRequiredService<IKickClient>(),
                    sp.GetRequiredService<IAmazonSQS>(),
                    kickChannelId,
                    kickChatQueueUrlEnvironmentVar));

            using var provider = services.BuildServiceProvider();
            var kickChatService = provider.GetRequiredService<IKickChatService>();
            using var cancellationTokenSource = new CancellationTokenSource();

            Console.CancelKeyPress += (_, eventArgs) =>
            {
                eventArgs.Cancel = true;
                cancellationTokenSource.Cancel();
            };

            Console.WriteLine($"KickListener started. Listening to Kick channel {kickChannelId}.");

            await kickChatService.StartAsync(cancellationTokenSource.Token);
        }
    }
}
