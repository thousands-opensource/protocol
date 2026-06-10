import { ILock, LockType } from "@repo/interfaces";
import { findOneLockByQuery, createLockDB } from "@repo/schemas";
import { logError, logInfo } from "@src/logger";

// don't need the actual wallet address, just need a unique string to identify the dapp's wallet vs. discord bot's wallet (b/c nonce is per wallet)
const WALLET_ADDRESSES: string[] = ["dapp"];

/**
 * Initializes the locks used to send transactions to the blockchain. Each wallet address gets its own lock
 */
export async function createBlockchainTxnLocksIfNecessary() {
    for (const walletAddress of WALLET_ADDRESSES) {
        await createLock(walletAddress);
    }
}

async function createLock(walletAddress: string) {
    const lockType: LockType = "sendBlockchainTxn";
    const query = {
        lockType,
        walletAddress,
    };

    const existingLock = await findOneLockByQuery(query);
    if (existingLock) {
        logInfo(
            `Blockchain txn lock already exists for wallet address '${walletAddress}'`
        );
        return;
    }

    try {
        // there's a unique index on lockType and walletAddress, so it won't create duplicates
        const blockchainTxnLock: ILock = {
            lockType,
            walletAddress,
            isLocked: false,
            timestamp: new Date(0),
            acquireUuid: "default",
            lockedBy: "system",
            lockReason: "n/a",
        };
        await createLockDB(blockchainTxnLock);
        logInfo(
            `Successfully created blockchain transaction lock for address '${walletAddress}'`
        );
    } catch (e) {
        logError(
            `Failed to create blockchain transaction lock for address '${walletAddress}'`,
            e
        );
    }
}
