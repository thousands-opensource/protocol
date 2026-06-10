namespace IvsIdleGameShared.Configuration
{
    public interface IRedisSettings
    {
        public string? EndPoint { get; set; }
        public int Port { get; set; }
        public string? Password { get; set; }
        public string? User { get; set; }
    }
}
