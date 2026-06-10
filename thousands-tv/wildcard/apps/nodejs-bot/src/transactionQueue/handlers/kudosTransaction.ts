import { TransactionDBParams, Transaction } from "@repo/interfaces";
import { ContractResult } from "@src/types";

/**
 * Processes a transaction intended to record a Kudos event on the blockchain
 * @param transaction The transaction containing the event
 * @param transactionDBParams Parameters to update a specific transaction in a transaction bundle in the database
 * @returns A promise resolving to the result of the contract execution
 */
export async function handleKudosTransaction(
    transaction: Transaction,
    transactionDBParams: TransactionDBParams
): Promise<ContractResult> {
    // Need a transaction to store Kudos Data
    return {
        success: true,
        data: "",
    };
}
