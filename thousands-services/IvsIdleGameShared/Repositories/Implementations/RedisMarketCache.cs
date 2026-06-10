using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Interfaces;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisMarketCache : IMarketCache
    {
        private readonly ConfigurationOptions _redisConfigurationOptions;
        private ConnectionMultiplexer? _redis;

        public RedisMarketCache(IRedisSettings redisSettings)
        {
            _redisConfigurationOptions = new ConfigurationOptions()
            {
                EndPoints = { { redisSettings.EndPoint ?? "", redisSettings.Port } },
                Password = redisSettings.Password,
                User = redisSettings.User,
                Ssl = false,
                SslProtocols = System.Security.Authentication.SslProtocols.Tls12
            };
        }

        public IDatabase ConnectToRedis()
        {
            _redis = ConnectionMultiplexer.Connect(_redisConfigurationOptions);
            return _redis.GetDatabase();
        }

        private string GetSupplyKey(string coinName)
        {
            return $"market-supply-{coinName}";
        }

        private string GetStoredPriceQuoteKey(Guid priceQuoteGuid)
        {
            return $"market-price-quote-{priceQuoteGuid}";
        }

        private string GetCoinPricesKey()
        {
            return "coin-prices";
        }

        public async Task<int> GetSupply(string coinName)
        {
            string key = GetSupplyKey(coinName);

            var db = ConnectToRedis();

            RedisValue redisValue = await db.StringGetAsync(key);

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            if (redisValue.HasValue)
            {
                if (int.TryParse(redisValue, out int outputSupply))
                {
                    return outputSupply;
                }
            }

            return 0;
        }

        public async Task<int> IncrementSupply(string coinName, int incrementAmount)
        {
            string key = GetSupplyKey(coinName);

            var db = ConnectToRedis();

            int newSupply = (int)await db.StringIncrementAsync(key, incrementAmount);

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            return newSupply;
        }

        public async Task<PriceQuote> GetPriceQuote(Guid priceQuoteGuid)
        {
            string key = GetStoredPriceQuoteKey(priceQuoteGuid);

            var db = ConnectToRedis();

            RedisValue redisValue = await db.StringGetAsync(key);

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    PriceQuote? priceQuote = JsonSerializer.Deserialize<PriceQuote>(jsonString);

                    if (priceQuote != null)
                    {
                        return priceQuote;
                    }
                }
            }

            return new PriceQuote();
        }

        public async Task<bool> RemovePriceQuote(Guid priceQuoteGuid)
        {
            string key = GetStoredPriceQuoteKey(priceQuoteGuid);

            var db = ConnectToRedis();

            await db.KeyDeleteAsync(key);

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            return true;
        }

        public async Task<bool> StorePriceQuote(PriceQuote priceQuote)
        {
            string key = GetStoredPriceQuoteKey(priceQuote.PriceQuoteGuid);

            var db = ConnectToRedis();

            await db.StringSetAsync(key, JsonSerializer.Serialize(priceQuote), expiry: TimeSpan.FromSeconds(30));

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            return true;
        }

        public async Task<List<CoinPrice>> GetTopCoinPrices()
        {
            string key = GetCoinPricesKey();

            var db = ConnectToRedis();

            SortedSetEntry[] sortedSetEntries = await db.SortedSetRangeByRankWithScoresAsync(key, 0, 9, Order.Descending);

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            if (sortedSetEntries.Length < 1)
            {
                Console.WriteLine("GetTopCoinPrices found no entries!");
            }

            List<CoinPrice> coinPrices = new List<CoinPrice>();
            foreach (var sortedSetEntry in sortedSetEntries )
            {
                if (!string.IsNullOrEmpty(sortedSetEntry.Element) && !sortedSetEntry.Element.ToString().StartsWith("BUTTON_"))
                {
                    coinPrices.Add(new CoinPrice()
                    {
                        CoinName = sortedSetEntry.Element.ToString(),
                        Price = (decimal)sortedSetEntry.Score
                    });
                }
            }

            return coinPrices;
        }

        public async Task<bool> SetCoinPrice(CoinPrice coinPrice)
        {
            string key = GetCoinPricesKey();

            var db = ConnectToRedis();

            bool successfullyAdded = await db.SortedSetAddAsync(key, coinPrice.CoinName, (double)coinPrice.Price);

            if (_redis != null)
            {
                _ = _redis.DisposeAsync();
            }

            return successfullyAdded;
        }
    }
}
