import { NextApiRequest, NextApiResponse } from "next";
import { getTxnBundle, sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { WildcardApiResponse } from "@repo/interfaces";
import { ContractResult } from "@/types";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();

        const war: WildcardApiResponse = await queryTransaction(req, res);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error querying transaction", e);
        sendApiResponse(res, {
            success: false,
            err: `Error querying transaction ${e.message}`,
        });
    }
}

/**
 * Queries the API for the status of a transaction.
 * @param txBundleId - The ID of the transaction bundle to query.
 * @param txnType - The type of the transaction.
 * @returns The result of the API call.
 */
async function queryTransaction(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<ContractResult> {
    const txBundleId = req.query.id as string;

    return await getTxnBundle(`/api/txn_bundle/${txBundleId}`);
}

export default handler;
