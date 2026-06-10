import { EMPTY_TOKEN_METADATA } from "@src/types";
import {
    getWildcardSwagContractAddress,
    getAxiosRetryCount,
} from "@src/util/environmentUtil";
import axios from "axios";
import axiosRetry from "axios-retry";
import { logError } from "@src/logger";
import { BigNumber } from "ethers";
import { IUser } from "@repo/interfaces";
import { GasBudgetTxnType, TokenMetadata } from "@repo/interfaces";

// axios retry configs
const AXIOS_RETRY_COUNT = getAxiosRetryCount();
const RETRY_DELAY = 1000;

/**
 * Retry axios call upon a failed request / overload
 * Docs: https://www.npmjs.com/package/axios-retry
 */
axiosRetry(axios, {
    retries: AXIOS_RETRY_COUNT,
    retryCondition: () => true, // retry upon a failed request
    retryDelay: (retryCount) => {
        return retryCount * RETRY_DELAY; // time interval between retries
    },
    onRetry: (retryCount, err) => {
        logError(`Axios retry attempt, retry count: ${retryCount}`, err); // intermediary - capture retries
    },
});

export async function getTokenMetadata(
    tokenId: string
): Promise<TokenMetadata> {
    const contractAddress = getWildcardSwagContractAddress();
    const tokenIdHex = toHexString(tokenId);
    const tokenMetadataUrl = `https://api.opensea.io/api/v2/metadata/matic/${contractAddress}/${tokenIdHex}`;
    try {
        const response = await axios.get(tokenMetadataUrl);
        return response.data as TokenMetadata;
    } catch (e) {
        logError(`Failed to fetch token metadata for token Id: ${tokenId}`, e);
        return EMPTY_TOKEN_METADATA;
    }
}

export function toHexString(str: string) {
    return BigNumber.from(str).toHexString();
}

/**
 * Checks if the given airdrop duration is valid
 * @param airdropDurationHours - duration of an airdrop (in hours)
 * @returns true if the given duration is valid
 */
export function isValidAirdropDuration(airdropDurationHours: number): boolean {
    if (
        !airdropDurationHours ||
        airdropDurationHours <= 0 ||
        !Number.isInteger(airdropDurationHours)
    ) {
        return false;
    }

    return true;
}

/**
 * Adds the specified number of minutes to the current date and returns a new Date object representing the updated date.
 * @param {number} minutesAdded - The number of minutes to add to the current date.
 * @returns {Date} - A new Date object representing the updated date.
 */
export function addMinutesToDate(minutesAdded: number): Date {
    const newDate = new Date();
    newDate.setMinutes(newDate.getMinutes() + minutesAdded);
    return newDate;
}

/**
 * Get all wallet addresses we have associated with user
 * @param user - user from mongo
 * @returns a list of wallet addresses as strings
 */
export function getAllAssociatedWalletsForUser(user: IUser): string[] {
    if (
        user.walletProvider?.additionalWallets &&
        user.walletProvider?.additionalWallets.length !== 0
    ) {
        return [
            user.walletProvider?.address,
            ...user.walletProvider?.additionalWallets,
        ];
    }

    return [user.walletProvider?.address];
}

/**
 * Returns the current Unix timestamp in seconds.
 * @returns {number} The current Unix timestamp.
 */
export function getCurrentUnixTimestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

/**
 * Escapes a value for CSV
 * @param value value to escape
 * @returns escaped value
 */
export function escapeForCSV(value: string) {
    // If the value contains a double quote, replace each instance with two double quotes
    if (value.includes('"')) {
        value = value.replace(/"/g, '""');
    }

    // If the value contains a comma, newline, or double quote, wrap it in double quotes
    if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        value = `"${value}"`;
    }

    return value;
}

/**
 * Formats gas expenditure type to human readable string
 * @param gasExpenditureType - gas expenditure type tp reformat
 * @returns string
 */
export function formatGasExpenditureName(
    gasExpenditureType: GasBudgetTxnType
): string {
    if (gasExpenditureType === "linkedWallet") {
        return "Linked An Additional Wallet";
    } else if (gasExpenditureType === "unlinkedWallet") {
        return "Removed A Linked Wallet";
    } else if (gasExpenditureType === "setPfp") {
        return "Updated Profile Picture";
    } else if (gasExpenditureType === "completedSwagSet") {
        return "Completed Swag Set";
    }
    return gasExpenditureType;
}
