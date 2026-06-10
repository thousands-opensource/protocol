import { WILDCARD_SWAG_CONTRACT } from "@src/contracts/WildcardSwag";
import {
    BlockchainStatusEnum,
    BlockchainTxnUpdates,
    GasPrice,
    GasPriceNumeric,
} from "@repo/interfaces";
import { WILDCARD_DISTRIBUTOR_CONTRACT } from "@src/contracts/WildcardDistributor";
import { WILDEVENT_REGISTRY_CONTRACT } from "@src/contracts/wildevents/WildeventRegistry";
import {
    findOneTransactionQueueByQuery,
    updateTransactionInTxnBundleDB,
} from "@repo/schemas";
import { logError, logInfo } from "@src/logger";
import { TransactionDBParams } from "@repo/interfaces";
import { ContractResult } from "@src/types";
import { getGasPrice } from "@src/util/blockchainUtil";
import { TXN_MUTEX } from "@src/util/mutexUtil";
import {
    BigNumber,
    ContractReceipt,
    ContractTransaction,
    Contract,
    ethers,
    Event,
} from "ethers";
import { TransactionReceipt } from "alchemy-sdk";
import { PROVIDER, WALLET } from "@src/util/contractConstructorUtil";
import { LogDescription } from "ethers/lib/utils";
import { WILDCARD_TICKET_BOOTH_CONTRACT } from "@src/contracts/WildcardTicketBooth";

/**
 * Execute the given blockchain transaction while handling gas prices, mutexes, and error handling.
 * Optionally updates the database with transaction statuses.
 * @param blockchainFunc The function to execute on the blockchain, bound to the contract object and arguments
 * @param transactionDBParams The parameters needed to update the transaction in the database: transactionQueueId, transaction, transactionIndex
 * @param resultHandler The function to handle the result of the blockchain transaction
 * @param transactionWait Whether to wait for the transaction to be mined
 * @returns The result of the contract execution
 */
export async function executeBlockchainTransaction(
    blockchainFunc: (...args: any[]) => Promise<ContractResult>,
    transactionDBParams: TransactionDBParams,
    resultHandler: (receipt: ContractReceipt) => ContractResult,
    transactionWait: boolean,
    contract: Contract
): Promise<ContractResult> {
    const release = await TXN_MUTEX.acquire();
    let blockchainTransaction: ContractTransaction | undefined;
    const { transactionQueueId, transactionIndex } = transactionDBParams;
    const implementsBlockchainFeatures = !!transactionDBParams; // Backwards compatibility for calls not coming from the transaction queue
    const blockchainTxnDBUpdates: BlockchainTxnUpdates = {};

    logInfo(`Starting execution of blockchain transaction...`);

    console.time("TxnQueue: TotalExecutionTime");

    try {
        // Do blockchain transaction reconciliation & check for existing transaction hash and its status
        const currentGasPrice: GasPrice = await getGasPrice();
        if (implementsBlockchainFeatures) {
            console.time("TxnQueue: TransactionReconciliationTime");

            const transactionQueueObj = await findOneTransactionQueueByQuery({
                _id: transactionQueueId,
            });
            const { txnHash, blockchainStatus, gasPrice, nonce } =
                transactionQueueObj.txnBundle[transactionIndex];

            // If the transaction has already been sent, get the data if mined or error if hanging
            if (
                txnHash &&
                blockchainStatus !== BlockchainStatusEnum.NOT_SUBMITTED
            ) {
                logInfo(
                    `Transaction [${transactionIndex}] in transaction queue [${transactionQueueId}] already has a transaction hash: ${txnHash}`
                );

                // If the transaction has been sent and we don't need data from the receipt, finish
                if (blockchainStatus === BlockchainStatusEnum.SUBMITTED_DONE) {
                    logInfo(
                        `Transaction [${transactionIndex}] in transaction queue [${transactionQueueId}] is already ${BlockchainStatusEnum.SUBMITTED_DONE}, exiting the function...`
                    );
                    return {
                        success: true,
                        txHash: txnHash,
                    };
                }

                const minedTransactionReceipt: ContractReceipt | null =
                    await findMinedTransaction(contract, txnHash);

                // If it's not mined and we are waiting, go into error state & check again later
                if (
                    !(
                        minedTransactionReceipt &&
                        minedTransactionReceipt.blockNumber
                    ) &&
                    blockchainStatus === BlockchainStatusEnum.SUBMITTED_WAITING
                ) {
                    const errMsg = `Transaction [${transactionIndex}] in transaction queue [${transactionQueueId}] was left hanging. It is already submitted but not mined.`;
                    logError(errMsg);
                    return {
                        success: false,
                        data: txnHash,
                        err: errMsg,
                    };
                }

                // If it's mined, update the transaction status in the database & parse the receipt
                await updateTransactionInTxnBundleDB(
                    transactionQueueId,
                    {
                        blockchainStatus: BlockchainStatusEnum.SUBMITTED_MINED,
                    },
                    transactionIndex
                );
                logInfo(
                    `Transaction [${transactionIndex}] in transaction queue [${transactionQueueId}] is already mined, returning the relevant data from the receipt`
                );
                return resultHandler(minedTransactionReceipt);
            }

            // Annotate gasPrice and nonce
            const maxFeeGwei =
                currentGasPrice.maxFeePerGas.toNumber() / 10 ** 9;
            const maxPriorityFeeGwei =
                currentGasPrice.maxPriorityFeePerGas.toNumber() / 10 ** 9;

            const currentGasPriceNumeric: GasPriceNumeric = {
                maxFeePerGas: maxFeeGwei,
                maxPriorityFeePerGas: maxPriorityFeeGwei,
            };

            logInfo(
                `Using gas prices: maxFeePerGas ${maxFeeGwei} gwei, maxPriorityFeePerGas ${maxPriorityFeeGwei} gwei`
            );

            // Get the current nonce
            const nonceValue = await getNonceValue();
            logInfo(`Using nonce: ${nonceValue}`);

            // Initialize or update gasPrice array
            let gasPriceArray: GasPriceNumeric[] = gasPrice || [];
            gasPriceArray.push(currentGasPriceNumeric);

            // Initialize or update nonce array
            let nonceArray = nonce || [];
            nonceArray.push(nonceValue);

            // Update the transaction in the database
            await updateTransactionInTxnBundleDB(
                transactionQueueId,
                {
                    gasPrice: gasPriceArray,
                    nonce: nonceArray,
                },
                transactionIndex
            );
            console.timeEnd("TxnQueue: TransactionReconciliationTime");
        }

        console.time("TxnQueue: BlockchainFunctionExecutionTime");
        const blockchainTransactionResult: ContractResult =
            await blockchainFunc(currentGasPrice);
        console.timeEnd("TxnQueue: BlockchainFunctionExecutionTime");

        if (!blockchainTransactionResult.success) {
            logError(
                `Blockchain function execution failed: ${blockchainTransactionResult.err}`
            );
            return blockchainTransactionResult;
        }

        // Get the blockchain contract transaction object & update the transaction hash in the database
        blockchainTransaction = blockchainTransactionResult.data;
        logInfo(`Blockchain transaction hash: ${blockchainTransaction.hash}`);
        blockchainTxnDBUpdates.txnHash = blockchainTransaction.hash;

        // If we do not need to wait for the transaction to be mined, return the transaction hash immediately
        if (!transactionWait) {
            blockchainTxnDBUpdates.blockchainStatus =
                BlockchainStatusEnum.SUBMITTED_DONE;
            await updateTransactionInTxnBundleDB(
                transactionQueueId,
                blockchainTxnDBUpdates,
                transactionIndex
            );

            logInfo(
                `Transaction [${blockchainTransaction.hash}] submitted successfully without waiting for mining.`
            );
            console.timeEnd("TxnQueue: TotalExecutionTime");
            return {
                success: true,
                txHash: blockchainTransaction.hash,
            };
        }

        // Update the transaction status to "Submitted-Waiting" while the transaction is pending
        blockchainTxnDBUpdates.blockchainStatus =
            BlockchainStatusEnum.SUBMITTED_WAITING;
        await updateTransactionInTxnBundleDB(
            transactionQueueId,
            blockchainTxnDBUpdates,
            transactionIndex
        );

        logInfo(
            `Waiting for transaction [${blockchainTransaction.hash}] to be mined...`
        );
        console.time("TxnQueue: TransactionMiningTime");
        const receipt = await blockchainTransaction.wait();
        console.timeEnd("TxnQueue: TransactionMiningTime");

        const currentBlockNumber = await PROVIDER.getBlockNumber();
        const blocksWaited = currentBlockNumber - receipt.blockNumber;
        logInfo(
            `Transaction [${blockchainTransaction.hash}] mined successfully in ${blocksWaited} blocks.`
        );

        // Update the transaction status to "Submitted-Mined" after the transaction is mined
        blockchainTxnDBUpdates.blockchainStatus =
            BlockchainStatusEnum.SUBMITTED_MINED;
        await updateTransactionInTxnBundleDB(
            transactionQueueId,
            blockchainTxnDBUpdates,
            transactionIndex
        );

        console.timeEnd("TxnQueue: TotalExecutionTime");
        return resultHandler(receipt);
    } catch (e) {
        logError("Blockchain transaction failed:", e);
        await updateTransactionInTxnBundleDB(
            transactionQueueId,
            {
                blockchainStatus: BlockchainStatusEnum.FAILED,
            },
            transactionIndex
        );

        console.timeEnd("TxnQueue: TotalExecutionTime");
        return {
            success: false,
            data: blockchainTransaction?.hash,
            err: e.message,
        };
    } finally {
        release();
        logInfo(`Transaction execution completed, resources released.`);
    }
}

/**
 * Mint Wildfiles for a list of users
 * @param recipients the addresses of the users to mint Wildfiles for
 * @param transactionDBParams the parameters needed to update the transaction in the database: transactionQueueId, transaction, transactionIndex
 * @param transactionWait whether to wait for the transaction to be mined
 * @returns
 */
export async function bulkMintWildfiles(
    recipients: string[],
    transactionDBParams: TransactionDBParams,
    transactionWait: boolean
): Promise<ContractResult> {
    // Bulk mint Wildfiles for the users
    try {
        // Format parameters for the bulkMintWildfiles function
        const bulkMintWildfilesFunction =
            WILDCARD_DISTRIBUTOR_CONTRACT.bulkMintWildfiles.bind(
                WILDCARD_DISTRIBUTOR_CONTRACT,
                recipients
            );
        const bulkMintWildfilestHandler =
            WILDCARD_DISTRIBUTOR_CONTRACT.handleBulkMintWildfilesResult.bind(
                WILDCARD_DISTRIBUTOR_CONTRACT
            );
        // Execute the transaction specified by the postWildevent function
        const blockchainResult: ContractResult =
            await executeBlockchainTransaction(
                bulkMintWildfilesFunction,
                transactionDBParams,
                bulkMintWildfilestHandler,
                transactionWait,
                WILDCARD_DISTRIBUTOR_CONTRACT.contract
            );
        logInfo(
            `Bulk-Mint Wildfile transaction hash: ${blockchainResult.txHash}`
        );
        return blockchainResult;
    } catch (e) {
        logError("Error bulk minting wildfiles for users on the blockchain", e);
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Airdrop a token to a user
 * @param to the address of the user to airdrop the token to
 * @param tokenId the ID of the token to be airdropped
 * @param transactionDBParams the parameters needed to update the transaction in the database: transactionQueueId, transaction, transactionIndex
 * @param transactionWait whether to wait for the transaction to be mined
 * @returns the result of the airdrop transaction
 */
export async function airdropTokenToUser(
    to: string,
    tokenId: BigNumber,
    transactionDBParams: TransactionDBParams,
    transactionWait: boolean
): Promise<ContractResult> {
    try {
        // Format parameters for the airdropToken function
        const airdropTokenFunction = WILDCARD_SWAG_CONTRACT.airdropToken.bind(
            WILDCARD_SWAG_CONTRACT,
            to,
            tokenId
        );

        // Handler for the airdrop result
        const airdropResultHandler =
            WILDCARD_SWAG_CONTRACT.handleAirdropResult.bind(
                WILDCARD_SWAG_CONTRACT
            );

        // Execute the transaction specified by the airdropToken function
        const blockchainResult: ContractResult =
            await executeBlockchainTransaction(
                airdropTokenFunction,
                transactionDBParams,
                airdropResultHandler,
                transactionWait,
                WILDCARD_SWAG_CONTRACT.contract
            );

        logInfo(`Airdrop token transaction hash: ${blockchainResult.txHash}`);
        return blockchainResult;
    } catch (e) {
        logError(`Error airdropping token ${tokenId} to user ${to}`, e);
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Mint an event ticket for a user
 * @param recipient the address of the user to mint a ticket for
 * @param transactionDBParams the parameters needed to update the transaction in the database: transactionQueueId, transaction, transactionIndex
 * @param transactionWait whether to wait for the transaction to be mined
 * @returns A promise resolving to the result of the contract execution
 */
export async function mintEventTicket(
    recipient: string,
    transactionDBParams: TransactionDBParams,
    transactionWait: boolean
): Promise<ContractResult> {
    try {
        // Format parameters for the mintTicket function
        const mintTicketFunction =
            WILDCARD_TICKET_BOOTH_CONTRACT.mintTicket.bind(
                WILDCARD_TICKET_BOOTH_CONTRACT,
                recipient
            );

        // Handler for the airdrop result
        const mintTicketResultHandler =
            WILDCARD_TICKET_BOOTH_CONTRACT.handleMintTicketResult.bind(
                WILDCARD_SWAG_CONTRACT
            );

        // Execute the transaction specified by the mintTicket function
        const blockchainResult: ContractResult =
            await executeBlockchainTransaction(
                mintTicketFunction,
                transactionDBParams,
                mintTicketResultHandler,
                transactionWait,
                WILDCARD_TICKET_BOOTH_CONTRACT.contract
            );

        logInfo(
            `Mint Event Ticket transaction hash: ${blockchainResult.txHash} for recipient: ${recipient}`
        );
        return blockchainResult;
    } catch (e) {
        logError(
            `Error minting event ticket for user ${recipient} on the blockchain`,
            e
        );
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Rip an event ticket for a user
 * @param eventName The name of the event
 * @param ticketId The ID of the ticket to be ripped
 * @param transactionDBParams The parameters needed to update the transaction in the database: transactionQueueId, transaction, transactionIndex
 * @param transactionWait Whether to wait for the transaction to be mined
 * @returns A promise resolving to the result of the contract execution
 */
export async function ripEventTicket(
    eventName: string,
    ticketId: number,
    transactionDBParams: TransactionDBParams,
    transactionWait: boolean
): Promise<ContractResult> {
    try {
        // Format parameters for the ripTicket function
        const ripTicketFunction = WILDCARD_TICKET_BOOTH_CONTRACT.ripTicket.bind(
            WILDCARD_TICKET_BOOTH_CONTRACT,
            eventName,
            ticketId
        );

        // Handler for the rip ticket result
        const ripTicketResultHandler =
            WILDCARD_TICKET_BOOTH_CONTRACT.handleRipTicketResult.bind(
                WILDCARD_TICKET_BOOTH_CONTRACT
            );

        // Execute the transaction specified by the ripTicket function
        const blockchainResult: ContractResult =
            await executeBlockchainTransaction(
                ripTicketFunction,
                transactionDBParams,
                ripTicketResultHandler,
                transactionWait,
                WILDCARD_TICKET_BOOTH_CONTRACT.contract
            );

        logInfo(
            `Rip Event Ticket transaction hash: ${blockchainResult.txHash} for ticket ID: ${ticketId}`
        );
        return blockchainResult;
    } catch (e) {
        logError(
            `Error ripping event ticket ID ${ticketId} for event ${eventName} on the blockchain`,
            e
        );
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Check if a transaction has been mined, if so, parse the logs using the contract's interface
 * @param txnHash the hash of the transaction to check
 * @returns a transaction receipt if the transaction has been mined, null otherwise
 */
const findMinedTransaction = async (
    contract: Contract,
    txnHash: string
): Promise<ContractReceipt | null> => {
    const txReceipt: TransactionReceipt = await PROVIDER.getTransactionReceipt(
        txnHash
    );

    if (txReceipt && txReceipt.blockNumber) {
        // Parse the logs using the contract's interface
        const parsedLogs = txReceipt.logs
            .map((log) => {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    return convertLogToEvent(log, parsedLog, PROVIDER);
                } catch (e) {
                    logError(
                        `Failed to parse log of the mined transaction [${txnHash}]`,
                        e
                    );
                    return null;
                }
            })
            .filter((log) => log !== null) as Event[];

        // Manually add the parsed events to the receipt
        const contractReceipt: ContractReceipt = {
            ...txReceipt,
            events: parsedLogs,
        };
        return contractReceipt;
    }
    return null;
};

/**
 * Format the log into an event object
 * @param log
 * @param parsedLog
 * @param provider
 * @returns an event object for the provided log
 */
const convertLogToEvent = (
    log: ethers.providers.Log,
    parsedLog: LogDescription,
    provider: ethers.providers.Provider
): Event => {
    return {
        ...log,
        event: parsedLog.name,
        eventSignature: parsedLog.signature,
        args: parsedLog.args,
        // Mocking the functions that are not present in LogDescription
        removeListener: () => {},
        getBlock: async () => provider.getBlock(log.blockHash),
        getTransaction: async () =>
            provider.getTransaction(log.transactionHash),
        getTransactionReceipt: async () =>
            provider.getTransactionReceipt(log.transactionHash),
    };
};

async function getNonceValue(): Promise<number> {
    // Get the nonce for the next transaction you are about to submit
    const nonceValue = await PROVIDER.getTransactionCount(
        WALLET.getAddress(),
        "pending"
    );
    return nonceValue;
}
