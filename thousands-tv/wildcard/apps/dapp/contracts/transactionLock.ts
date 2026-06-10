import { ContractResult } from "@/types";
import {
    FarcasterMintInterface,
    FarcasterStatusEnum,
    LockReason,
    LockType,
} from "@repo/interfaces";
import { updateOneLockDB } from "@repo/schemas";
import { v4 } from "uuid";

const TXN_LOCK_EXPIRATION_MS = 10 * 1000; // lock expires after 10 seconds, and can then be locked by other users
const LOCK_ACQUIRE_WAIT_SECONDS = 2; // TODO: update back to 20 after farcaster push wait up to 2 seconds to acquire the lock
const LOCK_RETRY_INTERVAL_MS = 300; // try to acquire the lock every 300ms
const NUM_LOCK_ACQUIRE_RETRY_ATTEMPTS =
    (LOCK_ACQUIRE_WAIT_SECONDS * 1000) / LOCK_RETRY_INTERVAL_MS; // total number of retry attempts to acquire the lock

const WALLET_ADDRESS = "dapp"; // don't need the actual wallet address, just need a unique string to identify the dapp's wallet vs. discord bot's wallet (b/c nonce is per wallet)

/**
 * Executes the given function with the blockchain transaction lock. This MUST be used for any function that sends a blockchain transaction.
 * Otherwise there's a race condition with the account nonce and transactions with duplicate nonces will be sent and rejected.
 * @param lockedBy discordTag of the user who is trying to acquire the lock
 * @param lockReason reason the lock is being acquired
 * @param func function to execute with the lock (should be sending a blockchain transaction)
 * @returns ContractResult of executing the function
 */
export async function executeWithTxnLock(
    lockedBy: string,
    lockReason: LockReason,
    func: () => Promise<ContractResult>
): Promise<ContractResult> {
    const acquireUuid = await acquireTxnLock(lockedBy, lockReason);
    if (!acquireUuid) {
        return {
            success: false,
            err: `System currently busy, please try again`,
        };
    }

    try {
        return await func();
    } finally {
        await releaseTxnLock(acquireUuid);
    }
}

/**
 * Executes the given function with the blockchain transaction lock. This MUST be used for any function that sends a blockchain transaction.
 * Otherwise there's a race condition with the account nonce and transactions with duplicate nonces will be sent and rejected.
 * @param lockedBy discordTag of the user who is trying to acquire the lock
 * @param lockReason reason the lock is being acquired
 * @param func function to execute with the lock (should be sending a blockchain transaction)
 * @returns ContractResult of executing the function
 */
export async function executeWithTxnLockFarcaster(
    lockedBy: string,
    lockReason: LockReason,
    func: () => Promise<FarcasterMintInterface>
): Promise<FarcasterMintInterface> {
    const acquireUuid = await acquireTxnLock(lockedBy, lockReason);
    if (!acquireUuid) {
        return { farcasterResp: FarcasterStatusEnum.ERROR, tokenId: -1 };
    }

    try {
        return await func();
    } finally {
        await releaseTxnLock(acquireUuid);
    }
}

/**
 * @returns uuid of the lock acquisition if the mutex was successfully acquired, otherwise returns null
 */
async function acquireTxnLock(
    lockedBy: string,
    lockReason: LockReason
): Promise<string | null> {
    const lockType: LockType = "sendBlockchainTxn";
    const acquireUuid = v4(); // generate a unique identifier for this lock acquisition attempt

    for (let i = 0; i < NUM_LOCK_ACQUIRE_RETRY_ATTEMPTS; i += 1) {
        const attemptNum = i + 1;
        // query for lock available or timed out
        const now = new Date();
        const expirationTime = new Date(now.getTime() - TXN_LOCK_EXPIRATION_MS);
        const query = {
            lockType,
            walletAddress: WALLET_ADDRESS,
            $or: [
                { isLocked: false }, // lock is available
                {
                    timestamp: { $lt: expirationTime }, // lock has timed out and is stale
                },
            ],
        };

        // update status to locked by current user
        const update = {
            isLocked: true,
            timestamp: now,
            acquireUuid,
            lockedBy,
            lockReason,
        };
        const result = await updateOneLockDB(query, update);

        // check if this request was able to successfully update the lock (uuid matches)
        if (result && result.acquireUuid === acquireUuid) {
            // lock acquired successfully
            console.log(
                `${lockedBy} successfully acquired blockchain transaction lock to perform action: ${lockReason} (attempt ${attemptNum} acquireUuid: ${acquireUuid})`
            );
            return acquireUuid;
        }

        const randomDelay =
            LOCK_RETRY_INTERVAL_MS + Math.floor(Math.random() * 100) - 50; // randomize +-50ms
        console.log(
            `Waiting to acquire blockchain transaction lock to perform action: ${lockReason} (attempt ${attemptNum}, randomDelay: ${randomDelay}ms, acquireUuid: ${acquireUuid})`
        );
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
    }

    console.log(
        `${lockedBy} failed to acquire blockchain transaction lock for action ${lockReason}, giving up`
    );
    return null;
}

/**
 * Release the blockchain transaction lock. Only call this if you have successfully acquired the lock.
 */
async function releaseTxnLock(acquireUuid: string) {
    const lockType: LockType = "sendBlockchainTxn";
    const query = {
        lockType,
        walletAddress: WALLET_ADDRESS,
        acquireUuid,
    };
    const update = {
        isLocked: false,
        timestamp: new Date(),
        acquireUuid: "",
        lockedBy: "",
        lockReason: "",
    };
    const result = await updateOneLockDB(query, update);
    if (result) {
        console.log(
            `Successfully released blockchain transaction lock with acquireUuid ${acquireUuid}`
        );
    } else {
        console.error(
            `Failed to release blockchain transaction lock with acquireUuid ${acquireUuid}. It may have expired and been acquired by another user`
        );
    }
}
