import { GasPriceNumeric } from "@src/db/interfaces/gasExpenditure";
import { Types } from "mongoose";

export const TRANSACTION_QUEUE_TABLE_NAME = "transaction-queues";

export enum BlockchainStatusEnum {
    NOT_SUBMITTED = "Not-Submitted",
    SUBMITTED_DONE = "Submitted-Done",
    SUBMITTED_WAITING = "Submitted-Waiting",
    SUBMITTED_MINED = "Submitted-Mined",
    FAILED = "Failed",
}

export type BlockchainStatus =
    | BlockchainStatusEnum.NOT_SUBMITTED
    | BlockchainStatusEnum.SUBMITTED_DONE
    | BlockchainStatusEnum.SUBMITTED_WAITING
    | BlockchainStatusEnum.SUBMITTED_MINED
    | BlockchainStatusEnum.FAILED;

export enum TransactionStatusEnum {
    READY = "Ready",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
    ERROR = "Error",
}

export type TransactionStatus =
    | TransactionStatusEnum.READY
    | TransactionStatusEnum.IN_PROGRESS
    | TransactionStatusEnum.COMPLETED
    | TransactionStatusEnum.ERROR;

export enum BundleTypeEnum {
    AIRDROP_MESSAGE = "airdropMessage",
    GIVE_KUDOS = "giveKudos",
    ARCHIVE_LEADERBOARD = "archiveLeaderboard",
}

export type BundleType =
    | BundleTypeEnum.AIRDROP_MESSAGE
    | BundleTypeEnum.GIVE_KUDOS
    | BundleTypeEnum.ARCHIVE_LEADERBOARD;

export enum TxnTypeEnum {
    AIRDROP = "airdrop",
    KUDOS = "kudos",
}

export type TxnType = TxnTypeEnum.AIRDROP | TxnTypeEnum.KUDOS;

export interface Transaction {
    type: TxnType;
    data: string; // json
    status: TransactionStatus;
    blockchainStatus: BlockchainStatus;
    resultData?: string; // json
    txnHash?: string;
    gasPrice?: GasPriceNumeric[];
    nonce?: number[];
    errMsg?: string;
}

export interface ITransactionQueue {
    txnBundle: Transaction[];
    bundleType?: BundleType;
    userId?: Types.ObjectId;
    onCompletionLog?: string;
    status: TransactionStatus;
    runNext: number;
    retries: number;
    errMsg?: string;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
