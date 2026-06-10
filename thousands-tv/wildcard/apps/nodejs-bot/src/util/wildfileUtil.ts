import {
    GET_WILDFILE_ID_BATCH_SIZE,
    MINT_WILDFILE_BROADCAST_MESSAGE,
    VIEW_FUNCTION_MAX_RETRIES,
    VIEW_FUNCTION_RETRY_INTERVAL,
} from "@src/constants";
import { WILDFILE_CONTRACT } from "@src/contracts/Wildfile";
import { logError } from "@src/logger";
import { DiscordToUserIdMap } from "@src/types";
import {
    findUsersByQuery,
    findOneDiscordBroadcastMessageByQuery,
} from "@repo/schemas";

/**
 * Get the Wildfile ID for a given wallet address
 * @param walletAddress
 * @param retries Number of retries before giving up
 * @returns Wildfile ID or -1 if not found
 */
export async function getWildfileIdByAddress(
    walletAddress: string,
    maxRetries: number = VIEW_FUNCTION_MAX_RETRIES
): Promise<number> {
    if (!walletAddress) {
        return -1;
    }

    let retries = 0;
    while (retries <= maxRetries) {
        try {
            const wildfileId = await WILDFILE_CONTRACT.getWildfileId(
                walletAddress
            );
            return wildfileId;
        } catch (e) {
            if (retries < maxRetries) {
                // Log the retry attempt
                logError(
                    `Retry [${
                        retries + 1
                    }]: Error received when trying to get Wildfile ID for address ${walletAddress}. Retrying in ${
                        VIEW_FUNCTION_RETRY_INTERVAL / 1000
                    } second(s)...`,
                    e
                );
                await delay(VIEW_FUNCTION_RETRY_INTERVAL);
                retries++;
            } else {
                // Log the failure after exhausting retries
                logError(
                    `Failed to get Wildfile ID for address ${walletAddress} after ${retries} retries`,
                    e
                );
                return -1;
            }
        }
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function hasWildfileId(address: string): Promise<boolean> {
    return (await getWildfileIdByAddress(address)) > 0;
}

export async function getWildfileId(discordId: string): Promise<number> {
    const discordIdToWildfileId = await getDiscordToUserIdMap([discordId]);
    return discordIdToWildfileId[discordId] || -1;
}

export async function getWildfileIdsForAddresses(
    addresses: string[]
): Promise<number[]> {
    const wildfileIds: number[] = [];

    // Helper function to process each batch
    async function processBatch(batchAddresses: string[]): Promise<void> {
        const usersBatchPromises = batchAddresses.map((walletAddress) => {
            return getWildfileIdByAddress(walletAddress);
        });
        const results = await Promise.all(usersBatchPromises);
        wildfileIds.push(...results); // Collect results from each batch
    }

    // Create batches and process them sequentially
    for (let i = 0; i < addresses.length; i += GET_WILDFILE_ID_BATCH_SIZE) {
        const batch = addresses.slice(i, i + GET_WILDFILE_ID_BATCH_SIZE);
        await processBatch(batch); // Wait for each batch to complete before proceeding
    }

    return wildfileIds;
}

/**
 *
 * @param discordIds - Discord IDs to fetch User IDs for
 * @returns - Mapping of Discord ID to User ID
 */
export async function getDiscordToUserIdMap(
    discordIds: string[]
): Promise<DiscordToUserIdMap> {
    const BATCH_SIZE = 1000;
    const projectionFields = {
        "discordProvider.id": 1,
    };
    let result: DiscordToUserIdMap = {};

    for (let i = 0; i < discordIds.length; i += BATCH_SIZE) {
        const batchIds = discordIds.slice(i, i + BATCH_SIZE);
        const batchUsers = await findUsersByQuery(
            { "discordProvider.id": { $in: batchIds } },
            projectionFields
        );
        batchUsers.forEach((user) => {
            result[user.discordProvider.id] = user._id;
        });
    }

    return result;
}

export async function getMintWildfileEmbedLink(): Promise<string> {
    const query = { messageName: MINT_WILDFILE_BROADCAST_MESSAGE };
    const linkWalletMsgDoc = await findOneDiscordBroadcastMessageByQuery(query);
    const { guildId, channelId, messageId } = linkWalletMsgDoc ?? {};
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
