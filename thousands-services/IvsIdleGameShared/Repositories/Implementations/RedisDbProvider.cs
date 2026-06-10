using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Interfaces;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisDbProvider : IRedisDbProvider
    {
        private readonly Lazy<ConnectionMultiplexer> _lazyConnection;
        private bool _disposed = false;

        public RedisDbProvider(IRedisSettings redisSettings)
        {
            ConfigurationOptions redisConfigurationOptions = new ConfigurationOptions()
            {
                EndPoints = { { redisSettings.EndPoint ?? "", redisSettings.Port } },
                Password = redisSettings.Password,
                User = redisSettings.User,
                Ssl = false,
                SslProtocols = System.Security.Authentication.SslProtocols.Tls12,
                ConnectTimeout = 10000,       // ms to connect
                SyncTimeout = 10000,          // ms for operations
                AsyncTimeout = 10000         // if using newer versions
            };

            _lazyConnection = new Lazy<ConnectionMultiplexer>(() => ConnectionMultiplexer.Connect(redisConfigurationOptions));
        }

        public IDatabase database => _lazyConnection.Value.GetDatabase();

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
                return;

            if (disposing)
            {
                if (_lazyConnection.IsValueCreated)
                {
                    _lazyConnection.Value.Dispose();
                }
            }

            _disposed = true;
        }
    }
}
