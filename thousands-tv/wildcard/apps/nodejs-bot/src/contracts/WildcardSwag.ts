import {
    BigNumber,
    Contract,
    Wallet,
    ContractReceipt,
    ContractTransaction,
} from "ethers";
import {
    getDiscordBotWalletAddress,
    getGasPrice,
} from "../util/blockchainUtil";
import WildcardSwagABI from "./abi/WildcardSwagABI.json";
import { WALLET } from "@src/util/contractConstructorUtil";
import { ContractResult } from "../types";
import { getWildcardSwagContractAddress } from "@src/util/environmentUtil";
import { TXN_MUTEX } from "@src/util/mutexUtil";
import { logError, logInfo } from "@src/logger";

// address of the contract onchain
const WILDCARD_SWAG_CONTRACT_ADDRESS = getWildcardSwagContractAddress();
if (!WILDCARD_SWAG_CONTRACT_ADDRESS) {
    console.warn(
        "Address of WildcardSwag contract not found. Set WILDCARD_SWAG_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    logInfo(
        `Using WildcardSwag contract with address ${WILDCARD_SWAG_CONTRACT_ADDRESS}`
    );
}

/**
 * Class to interact with the WildcardSwag smart contract
 */
class WildcardSwagContract {
    contract: Contract;

    constructor(wallet: Wallet) {
        this.contract = new Contract(
            WILDCARD_SWAG_CONTRACT_ADDRESS,
            WildcardSwagABI,
            wallet
        );
    }

    async tokenBalanceOf(
        address: string,
        tokenId: BigNumber
    ): Promise<BigNumber> {
        try {
            return await this.contract.balanceOf(address, tokenId);
        } catch (e) {
            logError(
                `Failed to retrieve token ID '${tokenId}' balance for address '${address}'`,
                e
            );
            return BigNumber.from("-1");
        }
    }

    /**
     * Airdrop a token to a user
     * @param to The address to airdrop the token to
     * @param tokenId The ID of the token to airdrop
     * @param gasPrice The gas price to use for the transaction
     * @returns A promise resolving to the result of the contract execution
     */
    async airdropToken(
        to: string,
        tokenId: BigNumber,
        gasPrice?: any
    ): Promise<ContractResult> {
        try {
            // TODO: Remove once other scripts call this are updated to use executeBlockchainTransaction
            if (!gasPrice) {
                gasPrice = await getGasPrice();
                const maxFeeGwei = gasPrice.maxFeePerGas.toNumber() / 10 ** 9;
                const maxPriorityFeeGwei =
                    gasPrice.maxPriorityFeePerGas.toNumber() / 10 ** 9;
                logInfo(
                    `Using gas price for airdrop: maxFeePerGas ${maxFeeGwei} gwei, maxPriorityFeePerGas ${maxPriorityFeeGwei} gwei`
                );
            }

            const discordBotWalletAddress = getDiscordBotWalletAddress();
            const tx: ContractTransaction =
                await this.contract.safeTransferFrom(
                    discordBotWalletAddress,
                    to,
                    tokenId,
                    1,
                    [],
                    gasPrice
                );
            return {
                success: true,
                data: tx,
            };
        } catch (e) {
            logError(`Failed to airdrop token ${tokenId} to '${to}'`, e);
            return {
                success: false,
                err: e.message,
            };
        }
    }

    /**
     * Function to handle the result of an airdrop transaction
     * @param receipt The receipt of the transaction
     * @returns The result of the contract execution
     */
    handleAirdropResult(receipt: ContractReceipt): ContractResult {
        const event = receipt.events.find(
            (event) => event.event === "TransferSingle"
        );

        if (!event) {
            const errMsg = "TransferSingle event not found in receipt";
            logError(errMsg);
            return {
                success: false,
                err: errMsg,
            };
        }

        const [operator, from, to, id, value] = event.args;
        logInfo(
            `Airdropped token ID ${id} to address ${to} with value ${value} from ${from} by ${operator}`
        );

        return {
            success: true,
            data: {
                operator,
                from,
                to,
                id: id.toNumber(),
                value: value.toNumber(),
            },
            txHash: receipt.transactionHash,
        };
    }

    // get chainId from the current network
    async getChainId(): Promise<number> {
        try {
            return await this.contract.signer.getChainId();
        } catch (e) {
            logError(
                `Failed to get chain ID for contract address: ${WILDCARD_SWAG_CONTRACT_ADDRESS}`,
                e
            );
            return -1;
        }
    }

    // set approval for all
    async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
        try {
            return await this.contract.isApprovedForAll(owner, operator);
        } catch (e) {
            logError(
                `Failed to get approval status for all: ${WILDCARD_SWAG_CONTRACT_ADDRESS}`,
                e
            );
            return false;
        }
    }

    // set approval for all
    async setApprovalForAll(
        operator: string,
        approved: boolean
    ): Promise<void> {
        const release = await TXN_MUTEX.acquire();
        try {
            const gasPrice = await getGasPrice();
            const maxFeeGwei = gasPrice.maxFeePerGas.toNumber() / 10 ** 9;
            const maxPriorityFeeGwei =
                gasPrice.maxPriorityFeePerGas.toNumber() / 10 ** 9;
            logInfo(
                `Using gas price for airdrop: maxFeePerGas ${maxFeeGwei} gwei, maxPriorityFeePerGas ${maxPriorityFeeGwei} gwei`
            );
            const tx = await this.contract.setApprovalForAll(
                operator,
                approved,
                gasPrice
            );
            await tx.wait();
            logInfo(
                `Set approval for all operator ${operator} with approved ${approved}`
            );
        } catch (e) {
            logError(
                `Failed to set approval for all operator ${operator} with approved ${approved}`,
                e
            );
        } finally {
            // release the mutex
            release();
        }
    }
}

export const WILDCARD_SWAG_CONTRACT: WildcardSwagContract =
    new WildcardSwagContract(WALLET);
