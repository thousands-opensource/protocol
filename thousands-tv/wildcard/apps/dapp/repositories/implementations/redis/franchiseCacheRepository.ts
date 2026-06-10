import { injectable } from "inversify";
import IFranchiseCacheRepository, {
    FranchiseIndexEntry,
    WcCheckpoint,
} from "@/repositories/interfaces/IFranchiseCacheRepository";
import RedisClientManager, {
    RedisClientType,
} from "@/utils/backend/redis";
import Redis from "ioredis";

@injectable()
export default class FranchiseCacheRepository
    implements IFranchiseCacheRepository
{
    private readonly redisClient: Redis;
    private readonly indexKey = "franchise:index";
    private readonly processedNftsKey = "franchise:processed:nfts";
    private readonly processedWcKey = "franchise:processed:wc";
    private readonly processedSponsorshipsKey =
        "franchise:processed:sponsorships";
    private readonly processedFranchisePointsKey =
        "franchise:processed:franchise-points";
    private readonly processedThousandsXpKey =
        "franchise:processed:thousands-xp";
    private readonly processedRequestIdsKey =
        "franchise:processed:request-ids";
    private readonly processedRequestLockPrefix =
        "franchise:processed:request-lock";
    private readonly processedRequestLockTtlSeconds = 60 * 5;
    private readonly userKeyPrefix = "franchise:user";
    private readonly userNftsKeyPrefix = "franchise:user:nfts";
    private readonly userWcKeyPrefix = "franchise:user:wc";
    private readonly wcCheckpointKey = "franchise:processed:wc:checkpoint";

    constructor() {
        this.redisClient = RedisClientManager.getClient(
            RedisClientType.FRANCHISE
        );
    }

    private getFranchiseIndexKey(ladderIndex: number) {
        return `${this.indexKey}:${ladderIndex}`;
    }

    private getUserKey(userId: string) {
        return `${this.userKeyPrefix}:${userId}`;
    }

    private getUserNftsKey(ownerWalletAddress: string) {
        return `${this.userNftsKeyPrefix}:${ownerWalletAddress}`;
    }

    private getUserWcKey(ownerWalletAddress: string) {
        return `${this.userWcKeyPrefix}:${ownerWalletAddress}`;
    }

    async getFranchiseIndex(ladderIndex: number): Promise<FranchiseIndexEntry[]> {
        try {
            const result = await this.redisClient.zrange(
                this.getFranchiseIndexKey(ladderIndex),
                0,
                -1,
                "WITHSCORES"
            );

            const entries: FranchiseIndexEntry[] = [];
            for (let i = 0; i < result.length; i += 2) {
                entries.push({
                    userId: result[i],
                    rank: Number(result[i + 1]),
                });
            }
            return entries;
        } catch (error) {
            console.error("Failed to fetch franchise index from Redis", error);
            return [];
        }
    }

    async addFranchiseToIndex(
        userId: string,
        ladderIndex: number,
        rank: number
    ): Promise<boolean> {
        try {
            await this.redisClient.zadd(this.getFranchiseIndexKey(ladderIndex), rank, userId);
            return true;
        } catch (error) {
            console.error(
                `Failed to add franchise ${userId} to Redis index`,
                error
            );
            return false;
        }
    }

    async removeFranchiseFromIndex(
        userId: string,
        ladderIndex: number
    ): Promise<boolean> {
        try {
            await this.redisClient.zrem(
                this.getFranchiseIndexKey(ladderIndex),
                userId
            );
            return true;
        } catch (error) {
            console.error(
                `Failed to remove franchise ${userId} from Redis index`,
                error
            );
            return false;
        }
    }

    async getFranchiseRank(userId: string, ladderIndex: number): Promise<number | null> {
        try {
            const score = await this.redisClient.zscore(
                this.getFranchiseIndexKey(ladderIndex),
                userId
            );
            return score !== null ? Number(score) : null;
        } catch (error) {
            console.error(
                `Failed to fetch rank for franchise ${userId}`,
                error
            );
            return null;
        }
    }

    async setFranchise(userId: string, payload: string): Promise<void> {
        await this.setJsonValue(this.getUserKey(userId), payload);
    }

    async getFranchise(userId: string): Promise<string | null> {
        return this.getJsonValue(this.getUserKey(userId));
    }

    async setProcessedNfts(payload: string): Promise<void> {
        await this.setJsonValue(this.processedNftsKey, payload);
    }

    async getProcessedNfts(): Promise<string | null> {
        return this.getJsonValue(this.processedNftsKey);
    }

    async setProcessedWc(payload: string): Promise<void> {
        await this.setJsonValue(this.processedWcKey, payload);
    }

    async getProcessedWc(): Promise<string | null> {
        return this.getJsonValue(this.processedWcKey);
    }

    async setProcessedSponsorships(payload: string): Promise<void> {
        await this.setJsonValue(this.processedSponsorshipsKey, payload);
    }

    async getProcessedSponsorships(): Promise<string | null> {
        return this.getJsonValue(this.processedSponsorshipsKey);
    }

    async setProcessedFranchisePoints(payload: string): Promise<void> {
        await this.setJsonValue(this.processedFranchisePointsKey, payload);
    }

    async getProcessedFranchisePoints(): Promise<string | null> {
        return this.getJsonValue(this.processedFranchisePointsKey);
    }

    async setProcessedThousandsXp(payload: string): Promise<void> {
        await this.setJsonValue(this.processedThousandsXpKey, payload);
    }

    async getProcessedThousandsXp(): Promise<string | null> {
        return this.getJsonValue(this.processedThousandsXpKey);
    }

    async addProcessedRequestId(requestId: string): Promise<void> {
        try {
            await this.redisClient.sadd(
                this.processedRequestIdsKey,
                requestId
            );
        } catch (error) {
            console.error(
                `Failed to add processed requestId ${requestId}`,
                error
            );
            throw error;
        }
    }

    async getProcessedRequestId(requestId: string): Promise<boolean> {
        try {
            const exists = await this.redisClient.sismember(
                this.processedRequestIdsKey,
                requestId
            );
            return exists === 1;
        } catch (error) {
            console.error(
                `Failed to check processed requestId ${requestId}`,
                error
            );
            throw error;
        }
    }

    async acquireProcessedRequestIdLock(
        requestId: string,
        ttlSeconds: number = this.processedRequestLockTtlSeconds
    ): Promise<boolean> {
        try {
            const key = `${this.processedRequestLockPrefix}:${requestId}`;
            const result = await this.redisClient.set(
                key,
                "1",
                "EX",
                ttlSeconds,
                "NX"
            );
            return result === "OK";
        } catch (error) {
            console.error(
                `Failed to acquire requestId lock ${requestId}`,
                error
            );
            throw error;
        }
    }

    async releaseProcessedRequestIdLock(requestId: string): Promise<void> {
        try {
            const key = `${this.processedRequestLockPrefix}:${requestId}`;
            await this.redisClient.del(key);
        } catch (error) {
            console.error(
                `Failed to release requestId lock ${requestId}`,
                error
            );
            throw error;
        }
    }

    async getUserNfts(ownerWalletAddress: string): Promise<string | null> {
        const key = this.getUserNftsKey(ownerWalletAddress);
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            console.error(
                `Failed to get user NFTs for ${ownerWalletAddress}`,
                error
            );
            throw error;
        }
    }

    async addUserNfts(
        ownerWalletAddress: string,
        payload: string
    ): Promise<void> {
        const key = this.getUserNftsKey(ownerWalletAddress);
        try {
            await this.redisClient.set(key, payload);
        } catch (error) {
            console.error(
                `Failed to set user NFTs for ${ownerWalletAddress}`,
                error
            );
            throw error;
        }
    }

    async addUserNftsBatch(
        entries: { ownerWalletAddress: string; payload: string }[]
    ): Promise<void> {
        if (!entries.length) {
            return;
        }

        const pipeline = this.redisClient.pipeline();
        for (const entry of entries) {
            const key = this.getUserNftsKey(entry.ownerWalletAddress);
            pipeline.set(key, entry.payload);
        }

        try {
            const results = await pipeline.exec();
            if (!results) {
                throw new Error(
                    "Redis pipeline exec returned null (connection dropped)"
                );
            }

            const failedIndex = results.findIndex(([error]) => error);
            if (failedIndex !== -1) {
                const [error] = results[failedIndex];
                console.error("Redis pipeline failed at index", failedIndex, {
                    error,
                    entry: entries[failedIndex],
                });
                throw error;
            }
        } catch (error) {
            console.error("Failed to batch set user NFTs", error);
            throw error;
        }
    }

    async getUserWc(ownerWalletAddress: string): Promise<string | null> {
        const key = this.getUserWcKey(ownerWalletAddress);
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            console.error(
                `Failed to get user WC for ${ownerWalletAddress}`,
                error
            );
            throw error;
        }
    }

    async addUserWc(
        ownerWalletAddress: string,
        balance: number
    ): Promise<void> {
        const key = this.getUserWcKey(ownerWalletAddress);
        try {
            await this.redisClient.set(key, balance);
        } catch (error) {
            console.error(
                `Failed to set user WC for ${ownerWalletAddress}`,
                error
            );
            throw error;
        }
    }

    async addUserWcBatch(
        entries: { ownerWalletAddress: string; balance: number }[]
    ): Promise<void> {
        if (!entries.length) {
            return;
        }

        const pipeline = this.redisClient.pipeline();
        for (const entry of entries) {
            if (!Number.isFinite(entry.balance)) {
                console.error("Skipping invalid balance", entry);
                continue;
            }
            const key = this.getUserWcKey(entry.ownerWalletAddress);
            pipeline.set(key, entry.balance.toString());
        }

        try {
            const results = await pipeline.exec();
            if (!results) {
                throw new Error(
                    "Redis pipeline exec returned null (connection dropped)"
                );
            }

            const failedIndex = results.findIndex(([error]) => error);
            if (failedIndex !== -1) {
                const [error] = results[failedIndex];
                console.error("Redis pipeline failed at index", failedIndex, {
                    error,
                    entry: entries[failedIndex],
                });
                throw error;
            }
        } catch (error) {
            console.error("Failed to batch set user WC balances", error);
            throw error;
        }
    }

    async getWcCheckpoint(): Promise<WcCheckpoint | null> {
        const raw = await this.getJsonValue(this.wcCheckpointKey);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as WcCheckpoint;
        } catch {
            return null;
        }
    }

    async setWcCheckpoint(checkpoint: WcCheckpoint): Promise<void> {
        await this.setJsonValue(this.wcCheckpointKey, JSON.stringify(checkpoint));
    }

    private async setJsonValue(key: string, payload: string): Promise<void> {
        try {
            await this.redisClient.set(key, payload);
        } catch (error) {
            console.error(`Failed to set cache value for ${key}`, error);
        }
    }

    private async getJsonValue(key: string): Promise<string | null> {
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            console.error(`Failed to get cache value for ${key}`, error);
            return null;
        }
    }
}
