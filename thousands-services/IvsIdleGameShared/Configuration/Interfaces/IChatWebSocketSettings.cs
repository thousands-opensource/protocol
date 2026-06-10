namespace IvsIdleGameShared.Configuration.Interfaces
{
    public interface IChatWebSocketSettings
    {
        public string? PublisherKey { get; set; }
        public string? SubscriberKey { get; set; }
        public string? SecretKey { get; set; }
    }
}
