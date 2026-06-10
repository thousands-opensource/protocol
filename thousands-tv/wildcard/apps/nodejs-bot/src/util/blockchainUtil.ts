import { ContractResult, GasPrice } from "@src/types";
import {
    getWildcardDistributorContractAddress,
    isLocalEnvironment,
    isProdEnvironment,
    isConduitEnvironment,
} from "@src/util/environmentUtil";
import { logError, logInfo } from "@src/logger";
import axios from "axios";
import dotenv from "dotenv";
import { BigNumber, ethers } from "ethers";
import {
    DEFAULT_BLOCK_EXPLORER_URL,
    FALLBACK_GAS_STATION_URL,
    TEST_ENV_GAS_STATION_URLS,
    PROD_GAS_STATION_URLS,
} from "../constants";
import { WALLET } from "@src/util/contractConstructorUtil";
import { WILDCARD_DISTRIBUTOR_CONTRACT } from "@src/contracts/WildcardDistributor";
import { WILDCARD_SWAG_CONTRACT } from "@src/contracts/WildcardSwag";

dotenv.config();

/**
 * Return a link to the Block Explorer
 * @returns URL of the block explorer
 */
export function getBlockExplorerUrl() {
    return process.env.BLOCK_EXPLORER_URL || DEFAULT_BLOCK_EXPLORER_URL;
}

/**
 * Return a link to the Block Explorer for a specific transaction
 * @param txnHash hash of the transaction
 * @returns URL to that transaction on the block explorer
 */
export function getBlockExplorerTxUrl(txnHash: string) {
    const blockExplorerUrl = getBlockExplorerUrl();
    return `${blockExplorerUrl}/tx/${txnHash}`;
}

/**
 * Checks if the given address is valid (40 digits, 20 bytes, starts with 0x)
 * @param address
 * @returns
 */
export function isValidAddress(address: string): boolean {
    if (address.length === 42 && address.startsWith("0x")) {
        return true;
    }

    return false;
}

/**
 * @returns The discord bot's wallet address
 */
export function getDiscordBotWalletAddress(): string {
    return WALLET.address;
}

/**
 *
 * @returns The discord bot's MATIC balance
 */
export async function getDiscordBotWalletBalance(): Promise<number> {
    const balanceBN = await WALLET.getBalance();
    let balance;
    if (!balanceBN.isZero()) {
        balance = balanceBN.div(10 ** 9);
    }

    balance = balance.toNumber() / 10 ** 9;
    return balance;
}

/**
 * @returns The current gas price from the gas station API
 */
export async function getGasPrice(): Promise<GasPrice> {
    // default to 200/100 gwei
    const maxFeePerGas = BigNumber.from(200000000000);
    const maxPriorityFeePerGas = BigNumber.from(100000000000);

    // use the defaults for the local environment
    if (isLocalEnvironment() || isConduitEnvironment()) {
        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    }

    const gasStationUrls = isProdEnvironment()
        ? PROD_GAS_STATION_URLS
        : TEST_ENV_GAS_STATION_URLS;

    // go through the gas stations until we find one that works
    for (const gasStationUrl of gasStationUrls) {
        try {
            const { data } = await axios({
                method: "get",
                url: gasStationUrl,
            });

            // maxFeePerGas
            let mfpg;
            // maxPriorityFeePerGas
            let mpfpg;
            if (gasStationUrl === FALLBACK_GAS_STATION_URL) {
                // the fallback gas station has a different format for the response
                mfpg = Math.ceil(data.result.FastGasPrice);
                mpfpg = Math.ceil(
                    Number(data.result.FastGasPrice) -
                        Number(data.result.suggestBaseFee)
                );
            } else {
                mfpg = Math.ceil(data.fast.maxFee);
                mpfpg = Math.ceil(data.fast.maxPriorityFee);
            }

            if (Number.isNaN(mfpg) || Number.isNaN(mpfpg)) {
                logError(
                    `Failed to parse gas prices from URL: ${gasStationUrl}, maxFeePerGas: ${mfpg}, maxPriorityFeePerGas: ${mpfpg}`
                );
                continue;
            }

            // add 20% to the gas prices so our transactions are prioritized
            mfpg = Math.ceil(mfpg * 1.2);
            mpfpg = Math.ceil(mpfpg * 1.2);

            const mfpgBN = ethers.utils.parseUnits(`${mfpg}`, "gwei");
            const mpfpgBN = ethers.utils.parseUnits(`${mpfpg}`, "gwei");
            return {
                maxFeePerGas: mfpgBN,
                maxPriorityFeePerGas: mpfpgBN,
            };
        } catch (e) {
            logError(
                `Failed to fetch gas price from station '${gasStationUrl}'`,
                e
            );
        }
    }

    // return the defaults as a last fallback
    return {
        maxFeePerGas,
        maxPriorityFeePerGas,
    };
}

/**
 * Set approval for all on the Wildcard Swag contract for the Wildcard Distributor contract
 */
export async function wildcardDistributorSetApprovalForAllWildcardSwag(): Promise<void> {
    const botWalletAddress = getDiscordBotWalletAddress();
    // Set "approval for all" on the Wildcard Swag contract for the Wildcard Distributor contract
    const WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS =
        getWildcardDistributorContractAddress();
    const isApprovedForAll = await WILDCARD_SWAG_CONTRACT.isApprovedForAll(
        botWalletAddress,
        WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS
    );
    if (!isApprovedForAll) {
        logInfo(`setting approval for all`);
        await WILDCARD_SWAG_CONTRACT.setApprovalForAll(
            WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS,
            true
        );
    }
}

export async function distributeSwag(
    addresses: string[],
    tokenIds: BigNumber[]
): Promise<ContractResult> {
    // Distribute the tokens via the WildcardDistributor contract
    const amounts = new Array(addresses.length).fill(1);
    const distributionResult: ContractResult =
        await WILDCARD_DISTRIBUTOR_CONTRACT.distributeSwag(
            addresses,
            tokenIds,
            amounts
        );
    return distributionResult;
}
