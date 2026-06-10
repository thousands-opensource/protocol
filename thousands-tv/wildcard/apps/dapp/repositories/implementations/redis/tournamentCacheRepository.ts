import { injectable } from "inversify";
import Redis from "ioredis";
import ITournamentCacheRepository from "@/repositories/interfaces/ITournamentCacheRepository";
import RedisClientManager, {
    RedisClientType,
} from "@/utils/backend/redis";

@injectable()
export default class TournamentCacheRepository
    implements ITournamentCacheRepository
{
    private readonly redisClient: Redis;
    private readonly processedTournamentsKey = "tournament-tids-processed";

    constructor() {
        this.redisClient = RedisClientManager.getClient(
            RedisClientType.TOURNAMENTS
        );
    }

    async addTournamentTidToSet(tid: string): Promise<void> {
        try {
            await this.redisClient.sadd(this.processedTournamentsKey, tid);
        } catch (error) {
            console.error(
                `Failed to add tournament tid ${tid} to Redis set`,
                error
            );
        }
    }

    async isTournamentTidInSet(tid: string): Promise<boolean> {
        try {
            const result = await this.redisClient.sismember(
                this.processedTournamentsKey,
                tid
            );
            return result === 1;
        } catch (error) {
            console.error(
                `Failed to check tournament tid ${tid} in Redis set`,
                error
            );
            return false;
        }
    }
}
