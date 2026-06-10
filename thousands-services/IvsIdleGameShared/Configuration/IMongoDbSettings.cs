using NetTopologySuite.Index.IntervalRTree;

namespace IvsIdleGameShared.Configuration
{
    public interface IMongoDbSettings
    {
        public string? ConnectionUri { get; set; }
        public string? DatabaseName { get; set; }
        public string? StreamsCollectionName { get; set; }
        public string? UsersCollectionName { get; set; }
        public string? EventsCollectionName { get; set; }
        public string? EventIdleEventsCollectionName { get; set; }
        public string? MarketTransactionsCollectionName { get; set; }
        public string? UserCoinsCollectionName { get; set; }
        public string? CreditTransactionCollectionName { get; set; }
        public string? CreditBalanceCollectionName { get; set; }
        public string? AccessCodesCollectionName { get; set; }
        public string? ClaimedTicketsCollectionName { get; set; }
        public string? ChatMessagesSegmentsCollectionName { get; set; }
        public string? ChatReactionsSegmentsCollectionName { get; set; }
        public string? BoostsSegmentsCollectionName { get; set; }
        public string? SkyboxesCollectionName { get; set; }
        public string? VoteHistoryCollectionName { get; set; }
        public string? GiftEventsCollectionName { get; set; }
        public string? ExternalStreamsCollectionName { get; set; }
        public string? ExternalStreamStatsCollectionName { get; set; }
        public string? CardPacksCollectionName { get; set; }
        public string? CardPackVaultsCollectionName { get; set; }
        public string? RallyPredictionCollectionName { get; set; }
        public string? UserRallyPredictionCollectionName { get; set; }
        public string? PredictionChartDataCollectionName { get; set; }
        public string? SponsoredEventsCollectionName { get; set; }
        public string? UserSponsoredEventsCollectionName { get; set; }
        public string? UserExternalStreamWatchMinutesCollectionName { get; set; }
    }
}
