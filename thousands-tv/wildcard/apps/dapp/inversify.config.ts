import { Container } from "inversify";
import IServerRepository from "@/repositories/interfaces/iServerRepository";
import ServerRepository from "@/repositories/implementations/mongodb/serverRepository";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import StreamRepository from "@/repositories/implementations/mongodb/streamRepository";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import StageRepository from "@/repositories/implementations/mongodb/stageRepository";
import IIdleGameActionsRepository from "@/repositories/interfaces/iIdleGameActionsRepository";
import IdleGameActionsRepository from "@/repositories/implementations/mongodb/idleGameActionsRepository";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import UserRepository from "@/repositories/implementations/mongodb/userRepository";
import IFanVisibilityService from "@/services/interfaces/iFanVisibilityService";
import RedisFanVisibilityService from "@/services/implementations/redis/redisFanVisibilityService";
import IEventService from "@/services/interfaces/iEventService";
import BeamableEventService from "@/services/implementations/beamable/beamableEventService";
import ISeriesRepository from "./repositories/interfaces/iSeriesRepository";
import seriesRepository from "./repositories/implementations/mongodb/seriesRepository";
import IRecognitionProgramRepository from "./repositories/interfaces/IRecognitionProgramRepository";
import recognitionProgramRepository from "./repositories/implementations/mongodb/recognitionProgramRepository";
import IEventRepository from "./repositories/interfaces/iEventRepository";
import eventRepository from "./repositories/implementations/mongodb/eventRepository";
import ISponsoredEventRepository from "./repositories/interfaces/ISponsoredEventRepository";
import sponsoredEventsRepository from "./repositories/implementations/mongodb/sponsoredEventsRepository";
import IPlayerLinkingRepository from "./repositories/interfaces/IPlayerLinkingRepository";
import playerLinkingRepository from "./repositories/implementations/mongodb/playerLinkingRepository";
import IPlayerEarningsRepository from "./repositories/interfaces/IPlayerEarningsRepository";
import PlayerEarningsRepository from "./repositories/implementations/mongodb/playerEarningsRepository";
import ITournamentsRepository from "./repositories/interfaces/ITournamentsRepository";
import TournamentsRepository from "./repositories/implementations/mongodb/tournamentsRepository";
import IFranchiseTransactionsRepository from "./repositories/interfaces/IFranchiseTransactions";
import FranchiseTransactionsRepository from "./repositories/implementations/mongodb/franchiseTransactionsRepository";
import IFranchiseOffersRepository from "./repositories/interfaces/IFranchiseOffersRepository";
import FranchiseOffersRepository from "./repositories/implementations/mongodb/franchiseOffersRepository";
import IClaimedTicketRepository from "./repositories/interfaces/iClaimedTicketRepository";
import ClaimedTicketRepository from "./repositories/implementations/mongodb/claimedTicketRepository";
import IAccessCodeRepository from "./repositories/interfaces/iAccessCodeRepository";
import AccessCodeRepository from "./repositories/implementations/mongodb/accessCodeRepository";
import { TicketQueueRepository } from "./repositories/implementations/mongodb/ticketQueueRepository";
import { ITicketQueueRepository } from "./repositories/interfaces/iTicketQueueRepository";
import { IUserStatsRepository } from "./repositories/interfaces/iUserStatsRepository";
import UserStatsRepository from "./repositories/implementations/mongodb/userStatsRepository";
import ICreditTransactionRepository from "./repositories/interfaces/ICreditTransactionRepository";
import CreditTransactionRepository from "./repositories/implementations/mongodb/creditTransactionRepository";
import ICreditBalanceRepository from "./repositories/implementations/mongodb/ICreditBalanceRepository";
import CreditBalanceRepository from "./repositories/implementations/mongodb/creditBalanceRepository";
import IPointsRepository from "./repositories/interfaces/IPointsRepository";
import ThousandsPointsTransactionRepository from "./repositories/implementations/mongodb/thousandsPointsTransactionRepository";
import IChatRepository from "./repositories/interfaces/iChatRepository";
import ChatRepository from "./repositories/implementations/mongodb/chatRepository";
import IBoostBalanceRepository from "./repositories/implementations/mongodb/IBoostBalanceRepository";
import BoostBalanceRepository from "./repositories/implementations/mongodb/boostBalanceRepository";
import IBoostRepository from "./repositories/interfaces/iBoostRepository";
import BoostRepository from "./repositories/implementations/mongodb/boostRepository";
import IIdentityRepository from "./repositories/interfaces/IIdentityRepository";
import IdentityRepository from "./repositories/implementations/mongodb/identityRepository";
import { TokenDistributionLogRepository } from "./repositories/implementations/mongodb/tokenDistributionLogRepository";
import ITokenDistributionLogRepository from "./repositories/interfaces/ITokenDistributionLogRepository";
import INftAccessRepository from "./repositories/interfaces/iNftAccessRepository";
import NftAccessRepository from "./repositories/implementations/mongodb/nftAccessRepository";
import IBlacklistedAddressRepository from "./repositories/interfaces/iBlacklistedAddressRepository";
import BlacklistedAddressRepository from "./repositories/implementations/mongodb/blacklistedAddressRepository";
import UserSessionCacheRepository from "./repositories/implementations/redis/userSessionCacheRepository";
import IUserSessionCacheRepository from "./repositories/interfaces/IUserSessionCacheRepository";
import ClosedForecastStatsCacheRepository from "./repositories/implementations/redis/closedForecastStatsCacheRepository";
import IClosedForecastStatsCacheRepository from "./repositories/interfaces/IClosedForecastStatsCacheRepository";
import IRallyPredictionRepository from "./repositories/interfaces/IRallyPredictionRepository";
import RallyPredictionRepository from "./repositories/implementations/mongodb/rallyPredictionRepository";
import IUserRallyPredictionRepository from "./repositories/interfaces/IUserRallyPredictionRepository";
import UserRallyPredictionRepository from "./repositories/implementations/mongodb/userRallyPredictionRepository";
import IPredictionChartDataRepository from "./repositories/interfaces/IPredictionChartDataRepository";
import PredictionChartDataRepository from "./repositories/implementations/mongodb/predictionChartDataRepository";
import IUserInsightScoreRepository from "./repositories/interfaces/IUserInsightScoreRepository";
import UserInsightScoreRepository from "./repositories/implementations/mongodb/userInsightScoreRepository";
import IMetricRepository from "./repositories/interfaces/IMetricRepository";
import MetricRepository from "./repositories/implementations/mongodb/metricRepository";
import IRallyMetricsService from "./services/interfaces/IRallyMetricsService";
import RedisRallyMetricsService from "./services/implementations/redis/redisRallyMetricsService";
import ILeaderboardCacheService from "./services/interfaces/ILeaderboardCacheService";
import RedisLeaderboardCacheService from "./services/implementations/redis/redisLeaderboardCacheService";
import IPredictionSharedCacheService from "./services/interfaces/IPredictionSharedCacheService";
import RedisPredictionSharedCacheService from "./services/implementations/redis/redisPredictionSharedCacheService";
import { IUserInsightScoreService } from "./services/implementations/UserInsightScoreService";
import { UserInsightScoreService } from "./services/implementations/UserInsightScoreService";
import IMetricCacheRepository from "./repositories/interfaces/IMetricCacheRepository";
import MetricCacheRepository from "./repositories/implementations/redis/metricCacheRepository";
import IProRepository from "./repositories/interfaces/IProRepository";
import ProRepository from "./repositories/implementations/mongodb/proRepository";
import ITournamentCacheRepository from "./repositories/interfaces/ITournamentCacheRepository";
import TournamentCacheRepository from "./repositories/implementations/redis/tournamentCacheRepository";
import INftsToProcessRepository from "./repositories/interfaces/INftsToProcess";
import NftsToProcessRepository from "./repositories/implementations/mongodb/nftsToProcessRepository";
import IFranchiseCacheRepository from "./repositories/interfaces/IFranchiseCacheRepository";
import FranchiseCacheRepository from "./repositories/implementations/redis/franchiseCacheRepository";
import IUserSponsoredEventRepository from "./repositories/interfaces/IUserSponsoredEventRepository";
import UserSponsoredEventsRepository from "./repositories/implementations/mongodb/userSponsoredEventsRepository";

const diContainer = new Container();
//Setup repositories
diContainer.bind<IStreamRepository>("IStreamRepository").to(StreamRepository)
    .inSingletonScope;
diContainer.bind<IStageRepository>("IStageRepository").to(StageRepository)
    .inSingletonScope;
diContainer
    .bind<IIdleGameActionsRepository>("IIdleGameActionsRepository")
    .to(IdleGameActionsRepository).inSingletonScope;
diContainer.bind<IUserRepository>("IUserRepository").to(UserRepository)
    .inSingletonScope;
diContainer.bind<ISeriesRepository>("ISeriesRepository").to(seriesRepository)
    .inSingletonScope;
diContainer
    .bind<IRecognitionProgramRepository>("IRecognitionProgramRepository")
    .to(recognitionProgramRepository).inSingletonScope;
diContainer.bind<IEventRepository>("IEventRepository").to(eventRepository);
diContainer
    .bind<ISponsoredEventRepository>("ISponsoredEventRepository")
    .to(sponsoredEventsRepository);
diContainer
    .bind<IPlayerLinkingRepository>("IPlayerLinkingRepository")
    .to(playerLinkingRepository);
diContainer
    .bind<IClaimedTicketRepository>("IClaimedTicketRepository")
    .to(ClaimedTicketRepository);
diContainer
    .bind<IPlayerEarningsRepository>("IPlayerEarningsRepository")
    .to(PlayerEarningsRepository);
diContainer
    .bind<ITournamentsRepository>("ITournamentsRepository")
    .to(TournamentsRepository);
diContainer
    .bind<ITournamentCacheRepository>("ITournamentCacheRepository")
    .to(TournamentCacheRepository);    
diContainer
    .bind<INftsToProcessRepository>("INftsToProcessRepository")
    .to(NftsToProcessRepository);
diContainer
    .bind<IFranchiseTransactionsRepository>(
        "IFranchiseTransactionsRepository"
    )
    .to(FranchiseTransactionsRepository);
diContainer
    .bind<IFranchiseOffersRepository>("IFranchiseOffersRepository")
    .to(FranchiseOffersRepository);
diContainer
    .bind<IAccessCodeRepository>("IAccessCodeRepository")
    .to(AccessCodeRepository);
diContainer
    .bind<ITicketQueueRepository>("ITicketQueueRepository")
    .to(TicketQueueRepository);
diContainer
    .bind<IUserStatsRepository>("IUserStatsRepository")
    .to(UserStatsRepository);
diContainer.bind<IServerRepository>("IServerRepository").to(ServerRepository)
    .inSingletonScope;
diContainer
    .bind<ICreditTransactionRepository>("ICreditTransactionRepository")
    .to(CreditTransactionRepository);
diContainer
    .bind<ICreditBalanceRepository>("ICreditBalanceRepository")
    .to(CreditBalanceRepository);
diContainer
    .bind<IPointsRepository>("IPointsRepository")
    .to(ThousandsPointsTransactionRepository);
diContainer
    .bind<IIdentityRepository>("IIdentityRepository")
    .to(IdentityRepository);
diContainer
    .bind<INftAccessRepository>("INftAccessRepository")
    .to(NftAccessRepository);

diContainer.bind<IChatRepository>("IChatRepository").to(ChatRepository);
diContainer.bind<IBoostRepository>("IBoostRepository").to(BoostRepository);
diContainer
    .bind<IBlacklistedAddressRepository>("IBlacklistedAddressRepository")
    .to(BlacklistedAddressRepository);

diContainer
    .bind<IUserSessionCacheRepository>("IUserSessionCacheRepository")
    .to(UserSessionCacheRepository);
diContainer
    .bind<IFranchiseCacheRepository>("IFranchiseCacheRepository")
    .to(FranchiseCacheRepository);

diContainer
    .bind<IClosedForecastStatsCacheRepository>(
        "IClosedForecastStatsCacheRepository"
    )
    .to(ClosedForecastStatsCacheRepository);

diContainer
    .bind<IRallyPredictionRepository>("IRallyPredictionRepository")
    .to(RallyPredictionRepository);

diContainer
    .bind<IUserRallyPredictionRepository>("IUserRallyPredictionRepository")
    .to(UserRallyPredictionRepository);

diContainer
    .bind<IPredictionChartDataRepository>("IPredictionChartDataRepository")
    .to(PredictionChartDataRepository);

diContainer
    .bind<IUserInsightScoreRepository>("IUserInsightScoreRepository")
    .to(UserInsightScoreRepository);

diContainer
    .bind<ITokenDistributionLogRepository>("ITokenDistributionLogRepository")
    .to(TokenDistributionLogRepository);

diContainer.bind<IMetricRepository>("IMetricRepository").to(MetricRepository);

diContainer
    .bind<IMetricCacheRepository>("IMetricCacheRepository")
    .to(MetricCacheRepository);
diContainer.bind<IProRepository>("IProRepository").to(ProRepository);
diContainer
    .bind<IUserSponsoredEventRepository>("IUserSponsoredEventRepository")
    .to(UserSponsoredEventsRepository);

//Setup services
diContainer
    .bind<IFanVisibilityService>("IFanVisibilityService")
    .to(RedisFanVisibilityService).inSingletonScope;
diContainer.bind<IEventService>("IEventService").to(BeamableEventService)
    .inSingletonScope;
diContainer
    .bind<IRallyMetricsService>("IRallyMetricsService")
    .to(RedisRallyMetricsService).inSingletonScope;
diContainer
    .bind<ILeaderboardCacheService>("ILeaderboardCacheService")
    .to(RedisLeaderboardCacheService).inSingletonScope;
diContainer
    .bind<IPredictionSharedCacheService>("IPredictionSharedCacheService")
    .to(RedisPredictionSharedCacheService).inSingletonScope;
diContainer
    .bind<IUserInsightScoreService>("IUserInsightScoreService")
    .to(UserInsightScoreService).inSingletonScope;

export { diContainer };
