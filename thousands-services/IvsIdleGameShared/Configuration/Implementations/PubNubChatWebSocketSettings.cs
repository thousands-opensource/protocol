using IvsIdleGameShared.Configuration.Interfaces;

namespace IvsIdleGameShared.Configuration.Implementations
{
    public class PubNubChatWebSocketSettings : IChatWebSocketSettings
    {
        public string? PublisherKey { get; set; } = null;
        public string? SubscriberKey { get; set; } = null;
        public string? SecretKey { get; set; } = null;
    }
}
