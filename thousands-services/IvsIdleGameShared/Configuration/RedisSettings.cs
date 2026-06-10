namespace IvsIdleGameShared.Configuration
{
    public class RedisSettings : IRedisSettings
    {
        public string? EndPoint { get; set; } = null;
        public int Port { get; set; } = 18063;
        public string? Password { get; set; } = null;
        public string? User { get; set; } = null;
    }
}
