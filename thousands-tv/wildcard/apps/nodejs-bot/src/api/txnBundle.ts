import {
    BlockchainStatusEnum,
    BundleTypeEnum,
    Transaction,
    TransactionStatusEnum,
    TxnBundleRequest,
    TxnRequest,
    TxnTypeEnum,
    WildcardApiResponse,
} from "@repo/interfaces";
import { getTxnTypeEnum, isTxnTypeEnum } from "@src/api/apiUtil";

import {
    findOneTransactionQueueByQuery,
    findTransactionQueuesByQuery,
} from "@repo/schemas";
import { logError, logInfo } from "@src/logger";
import { writeTransactionQueue } from "@src/transactionQueue/transactionQueueService";
import { getDappApiKey } from "@src/util/environmentUtil";
import { HttpStatusCode } from "axios";
import express from "express";
import { Request, Response } from "express";
import { Types, isValidObjectId } from "mongoose";

const txnBundleRouter = express.Router();

// POST a txn bundle
txnBundleRouter.post(
    "/",
    async (
        req: Request<TxnBundleRequest>,
        res: Response<WildcardApiResponse>
    ) => {
        const {
            bundle: bundleReq,
            bundleType,
            userId,
        } = req.body as TxnBundleRequest;
        logInfo(`Received txn bundle request for [${bundleType}]: ${userId}`);
        const apiKey = req.headers["x-api-key"] as string;
        const isAuthorized = canSubmitTxnBundles(apiKey);
        if (!isAuthorized) {
            res.status(HttpStatusCode.Unauthorized).send({
                success: false,
                err: "Unauthorized",
            });
            return;
        }

        let userDBId: Types.ObjectId;
        if (userId) {
            if (!isValidObjectId(userId)) {
                logInfo(`Invalid userId: ${userId}`);
                res.status(HttpStatusCode.BadRequest).send({
                    success: false,
                    err: "Invalid userId",
                });
                return;
            }
            logInfo(`Submitting txn bundle for user: ${userId}`);
            userDBId = new Types.ObjectId(userId);
        }

        if (bundleType) {
            if (!Object.values(BundleTypeEnum).includes(bundleType)) {
                logError(`Invalid bundle type: ${bundleType}`);
                res.status(HttpStatusCode.BadRequest).send({
                    success: false,
                    err: `Invalid bundle type: ${bundleType}`,
                });
                return;
            }
        }

        let bundle: Transaction[];
        try {
            bundle = parseBundle(bundleReq);
        } catch (e) {
            logInfo(`Invalid txn bundle request: ${e.message}`);
            res.status(HttpStatusCode.BadRequest).send({
                success: false,
                err: "Error parsing txn bundle: " + e.message,
            });
            return;
        }

        const txnQueueId = await writeTransactionQueue(
            bundle,
            bundleType,
            userDBId
        );
        if (!txnQueueId) {
            logError("Error writing txn bundle to transaction queue");
            res.status(HttpStatusCode.InternalServerError).send({
                success: false,
                err: "Error writing txn bundle to transaction queue",
            });
            return;
        }

        logInfo(`Txn bundle written to transaction queue: ${txnQueueId}`);
        res.status(HttpStatusCode.Ok).send({
            success: true,
            data: { txnQueueId },
        });
    }
);

// GET the status of a txn bundle
txnBundleRouter.get(
    "/:id",
    async (
        req: Request<{ id: string }>,
        res: Response<WildcardApiResponse>
    ) => {
        const { id } = req.params;
        logInfo(`Fetching status of txn bundle with id: ${id}`);
        if (!isValidObjectId(id)) {
            logInfo(`Invalid txn bundle id: ${id}`);
            res.status(HttpStatusCode.BadRequest).send({
                success: false,
                err: "Invalid txn bundle id",
            });
            return;
        }

        const bundle = await findOneTransactionQueueByQuery({ _id: id });
        if (!bundle) {
            logInfo(`Txn bundle not found: ${id}`);
            res.status(HttpStatusCode.Ok).send({
                success: false,
                err: "Txn bundle not found",
            });
            return;
        }

        logInfo(`Txn bundle found: ${id}, status: ${bundle.status}`);

        res.status(HttpStatusCode.Ok).send({
            success: true,
            data: bundle,
        });
    }
);

// Find in-progress txn bundles for the user
txnBundleRouter.get(
    "/user/:id",
    async (
        req: Request<{ id: string }>,
        res: Response<WildcardApiResponse>
    ) => {
        const { id } = req.params as { id: string };
        logInfo(`Fetching in-progress txn bundles for user: ${id}`);
        const bundles = await findTransactionQueuesByQuery({
            userId: id,
            status: {
                $in: [
                    TransactionStatusEnum.IN_PROGRESS,
                    TransactionStatusEnum.READY,
                ],
            },
        });
        res.status(HttpStatusCode.Ok).send({
            success: true,
            data: { bundles },
        });
    }
);

// Check if the request is authorized to submit txn bundles
function canSubmitTxnBundles(apiKey: string) {
    if (!apiKey) {
        logInfo("Cannot submit txn bundles. No API key provided");
        return false;
    }

    const expectedDappApiKey = getDappApiKey();
    if (!expectedDappApiKey) {
        logError("Cannot submit txn bundles. No Dapp API key set");
        return false;
    }

    if (apiKey !== expectedDappApiKey) {
        logInfo(`Cannot submit txn bundles. Invalid API key: ${apiKey}`);
        return false;
    }

    return true;
}

function parseBundle(bundleReq: TxnRequest[]): Transaction[] {
    const txnBundle: Transaction[] = [];
    bundleReq.forEach((req) => {
        // Ensure the transaction type is valid
        if (!isTxnTypeEnum(req.type)) {
            throw new Error(`Invalid transaction type: ${req.type}`);
        }

        const txnType: TxnTypeEnum = getTxnTypeEnum(req.type);

        let parsedData;
        try {
            parsedData = JSON.parse(req.data);
        } catch (e) {
            throw new Error(`Invalid JSON for transaction type ${req.type}`);
        }

        // Create and return the transaction object
        const txnData: Transaction = {
            type: txnType,
            data: JSON.stringify(parsedData),
            status: TransactionStatusEnum.READY,
            blockchainStatus: BlockchainStatusEnum.NOT_SUBMITTED,
        };

        txnBundle.push(txnData);
    });

    return txnBundle;
}

export default txnBundleRouter;
