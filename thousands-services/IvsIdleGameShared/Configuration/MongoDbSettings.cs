namespace IvsIdleGameShared.Configuration
{
    public class MongoDbSettings : IMongoDbSettings
    {
        public string? ConnectionUri { get; set; } = null;
        public string? DatabaseName { get; set; } = null;
        public string? StreamsCollectionName { get; set; } = null;
        public string? UsersCollectionName { get; set; } = null;
        public string? EventsCollectionName { get; set; } = null;
        public string? EventIdleEventsCollectionName { get; set; } = null;
        public string? MarketTransactionsCollectionName { get; set; } = null;
        public string? UserCoinsCollectionName { get; set; } = null;
        public string? CreditTransactionCollectionName { get; set; } = null;
        public string? CreditBalanceCollectionName { get; set; } = null;
        public string? AccessCodesCollectionName { get; set; } = null;
        public string? ClaimedTicketsCollectionName { get; set; } = null;
        public string? ChatMessagesSegmentsCollectionName { get; set; } = null;
        public string? ChatReactionsSegmentsCollectionName { get; set; } = null;
        public string? BoostsSegmentsCollectionName { get; set; } = null;
        public string? SkyboxesCollectionName { get; set; } = null;
        public string? VoteHistoryCollectionName { get; set; } = null;
        public string? GiftEventsCollectionName { get; set; } = null;
        public string? ExternalStreamsCollectionName { get; set; } = null;
        public string? ExternalStreamStatsCollectionName { get; set; } = null;
        public string? CardPacksCollectionName { get; set; } = null;
        public string? CardPackVaultsCollectionName { get; set; } = null;
        public string? RallyPredictionCollectionName { get; set; } = null;
        public string? UserRallyPredictionCollectionName { get; set; } = null;
        public string? PredictionChartDataCollectionName { get; set; } = null;
        public string? SponsoredEventsCollectionName { get; set; } = null;
        public string? UserSponsoredEventsCollectionName { get; set; } = null;
        public string? UserExternalStreamWatchMinutesCollectionName { get; set; } = null;
    }
}
