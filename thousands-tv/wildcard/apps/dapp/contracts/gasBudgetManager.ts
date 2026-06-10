import { findGasExpendituresByQuery } from "@repo/schemas";
import { GasBudgetTxnType, IGasExpenditure } from "@repo/interfaces";
import { FilterQuery } from "mongoose";

const ONE_HOUR_MS = 1000 * 60 * 60;
const MAX_SET_PFPS_PER_USER_PER_HOUR = 5;
const MAX_LINKED_WALLETS_USER_PER_HOUR = 5;
const MAX_COMPLETED_SWAG_SETS_PER_USER_PER_HOUR = 5;

/**
 * Returns true if posting the txn of the given type will exceed the user's gas budget
 * @param userid - user id the dapp is posting the txn on behalf of
 * @param txnType - type of txn (ex. Wildevent type)
 * @param gasConsumed - amount of gas this transaction is expected to consume
 * @returns true if the txn will exceed the user's gas consumption limit
 */
export async function willExceedGasBudget(
    userId: string,
    txnType: GasBudgetTxnType,
    txnCost: number // not currently used, but may be useful
): Promise<boolean> {
    const oneHourAgo = new Date(new Date().getTime() - ONE_HOUR_MS);
    let query: FilterQuery<IGasExpenditure> = {
        userId,
        txnType,
        createdAt: { $gte: oneHourAgo },
    };
    if (txnType === "linkedWallet" || txnType === "unlinkedWallet") {
        query = {
            userId,
            $or: [{ txnType: "linkedWallet" }, { txnType: "unlinkedWallet" }],
            createdAt: { $gte: oneHourAgo },
        };
    }

    const gasExpenditureDocs = await findGasExpendituresByQuery(query);
    let limitExceeded = true;
    switch (txnType) {
        case "setPfp":
            limitExceeded =
                gasExpenditureDocs.length >= MAX_SET_PFPS_PER_USER_PER_HOUR;
            break;
        case "linkedWallet":
        case "unlinkedWallet":
            limitExceeded =
                gasExpenditureDocs.length >= MAX_LINKED_WALLETS_USER_PER_HOUR;
            break;
        case "completedSwagSet":
            limitExceeded =
                gasExpenditureDocs.length >=
                MAX_COMPLETED_SWAG_SETS_PER_USER_PER_HOUR;
            break;
        default:
            console.error(
                `Unknown txn type when checking gas budget: ${txnType}`
            );
    }

    return limitExceeded;
}
