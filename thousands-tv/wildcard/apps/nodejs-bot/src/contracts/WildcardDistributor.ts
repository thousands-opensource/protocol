import {
    BigNumber,
    Contract,
    ContractReceipt,
    ContractTransaction,
} from "ethers";
import WildcardDistributor from "./abi/WildcardDistributor.json";
import { WALLET } from "@src/util/contractConstructorUtil";
import { ContractResult, GasPrice } from "../types";
import { getWildcardDistributorContractAddress } from "@src/util/environmentUtil";
import { logError, logInfo } from "@src/logger";
import { getGasPrice } from "@src/util/blockchainUtil";
import { TXN_MUTEX } from "@src/util/mutexUtil";
import { WILDFILE_ADDRESS } from "@src/contracts/Wildfile";

// address of the contract onchain
const WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS =
    getWildcardDistributorContractAddress();
if (!WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS) {
    console.warn(
        "Address of WildcardDistributor contract not found. Set WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    logInfo(
        `Using WildcardDistributor contract with address ${WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS}`
    );
}

/**
 * Class to interact with the WildcardDistributor smart contract
 */
class WildcardDistributorContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS,
            WildcardDistributor.abi,
            WALLET
        );
    }

    /**
     * Distributes swag to a list of recipients
     * @param recipients List of recipient addresses
     * @param tokenIds List of token IDs to distribute
     * @param amounts List of token amounts to distribute
     * @returns A promise resolving to the result of the contract execution
     */
    async distributeSwag(
        recipients: string[],
        tokenIds: BigNumber[],
        amounts: BigNumber[]
    ): Promise<ContractResult> {
        const release = await TXN_MUTEX.acquire();
        try {
            const gasPrice = await getGasPrice();
            const maxFeeGwei = gasPrice.maxFeePerGas.toNumber() / 10 ** 9;
            const maxPriorityFeeGwei =
                gasPrice.maxPriorityFeePerGas.toNumber() / 10 ** 9;
            logInfo(
                `Using gas price for airdrop: maxFeePerGas ${maxFeeGwei} gwei, maxPriorityFeePerGas ${maxPriorityFeeGwei} gwei`
            );
            const tx = await this.contract.distributeSwag(
                recipients,
                tokenIds,
                amounts,
                gasPrice
            );
            return {
                success: true,
                txHash: tx.hash,
            };
        } catch (e) {
            logError("Failed to distribute tokens:", e);
            return {
                success: false,
                err: e.message,
            };
        } finally {
            // release the mutex
            release();
        }
    }

    /**
     * Mint Wildfiles for a list of recipients
     * @param recipients List of recipient addresses
     * @param gasPrice Gas price to use for the transaction
     * @returns A promise resolving to the result of the contract execution
     */
    async bulkMintWildfiles(
        recipients: string[],
        gasPrice: GasPrice
    ): Promise<ContractResult> {
        try {
            const tx: ContractTransaction =
                await this.contract.bulkMintWildfiles(recipients, gasPrice);

            return {
                success: true,
                data: tx,
            };
        } catch (e) {
            logError("Failed to mint Wildfiles:", e);
            return {
                success: false,
                err: e.message,
            };
        }
    }

    /**
     * Parse the result of a bulk mint Wildfiles transaction to extract the minted Wildfile IDs
     * @param receipt The receipt of the transaction
     * @returns The result of the contract execution
     */
    handleBulkMintWildfilesResult(receipt: ContractReceipt): ContractResult {
        const events = receipt.events;
        let wildfileIds: number[] = [];

        wildfileIds = events
            .filter(
                (event) =>
                    event.address?.toLowerCase() ===
                    WILDFILE_ADDRESS?.toLowerCase()
            ) // Only look at events from the Wildfile contract
            .map((event) => {
                try {
                    const hexId = event.topics[3];
                    return parseInt(hexId, 16);
                } catch (e) {
                    logError(`Failed to parse a wildfileId`, e);
                    return null;
                }
            });

        return {
            success: true,
            data: wildfileIds,
            txHash: receipt.transactionHash,
        };
    }
}

export const WILDCARD_DISTRIBUTOR_CONTRACT: WildcardDistributorContract =
    new WildcardDistributorContract();
