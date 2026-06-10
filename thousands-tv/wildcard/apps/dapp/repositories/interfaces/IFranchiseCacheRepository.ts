export interface FranchiseIndexEntry {
    userId: string;
    rank: number;
    ladderIndex?: number | null;
    previousRank?: number | null;
}

export interface WcCheckpoint {
    lastBlock: number;
    balances: Record<string, string>; // bigint values serialized as decimal strings
    decimals: number;
}

export default interface IFranchiseCacheRepository {
    getFranchiseIndex(ladderIndex: number): Promise<FranchiseIndexEntry[]>;
    addFranchiseToIndex(
        userId: string,
        ladderIndex: number,
        rank: number
    ): Promise<boolean>;
    removeFranchiseFromIndex(
        userId: string,
        ladderIndex: number
    ): Promise<boolean>;
    getFranchiseRank(userId: string, ladderIndex: number): Promise<number | null>;
    setFranchise(userId: string, payload: string): Promise<void>;
    getFranchise(userId: string): Promise<string | null>;
    setProcessedNfts(payload: string): Promise<void>;
    getProcessedNfts(): Promise<string | null>;
    setProcessedWc(payload: string): Promise<void>;
    getProcessedWc(): Promise<string | null>;
    setProcessedSponsorships(payload: string): Promise<void>;
    getProcessedSponsorships(): Promise<string | null>;
    setProcessedFranchisePoints(payload: string): Promise<void>;
    getProcessedFranchisePoints(): Promise<string | null>;
    setProcessedThousandsXp(payload: string): Promise<void>;
    getProcessedThousandsXp(): Promise<string | null>;
    addProcessedRequestId(requestId: string): Promise<void>;
    getProcessedRequestId(requestId: string): Promise<boolean>;
    acquireProcessedRequestIdLock(
        requestId: string,
        ttlSeconds?: number
    ): Promise<boolean>;
    releaseProcessedRequestIdLock(requestId: string): Promise<void>;
    getUserNfts(ownerWalletAddress: string): Promise<string | null>;
    addUserNfts(ownerWalletAddress: string, payload: string): Promise<void>;
    addUserNftsBatch(
        entries: { ownerWalletAddress: string; payload: string }[]
    ): Promise<void>;
    getUserWc(ownerWalletAddress: string): Promise<string | null>
    addUserWc(ownerWalletAddress: string, balance: number): Promise<void>;
    addUserWcBatch(
        entries: { ownerWalletAddress: string; balance: number }[]
    ): Promise<void>;
    getWcCheckpoint(): Promise<WcCheckpoint | null>;
    setWcCheckpoint(checkpoint: WcCheckpoint): Promise<void>;
}
