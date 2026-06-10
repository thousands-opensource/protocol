import { BlockchainStatus, BundleType } from "../db/interfaces/txnQueue";
import { KudosType } from "../db/interfaces/leaderboard";
import { Types } from "mongoose";
import { PostedWildevent } from "../db/dbShared";

// Interfaces for transaction bundle request
export interface TxnBundleRequest {
    bundle: TxnRequest[];
    bundleType?: BundleType;
    userId?: Types.ObjectId;
}

export interface TxnRequest {
    type: string;
    data: string; // JSON string
}

//------- Transaction data interfaces -------

export interface TransactionDBParams {
    transactionQueueId: Types.ObjectId;
    transactionIndex: number;
}

export interface BlockchainTxnUpdates {
    blockchainStatus?: BlockchainStatus;
    txnHash?: string;
}

export interface AirdropTransactionData {
    recipientDBId: Types.ObjectId;
    tokenIdStr: string;
}

export interface ArchiveLeaderboardBatchTransactionData {
    leaderboardId: string;
    pageNumber: number;
    wildfileIds: number[];
    scores: number[];
}

export interface KudosTransactionData {
    recipientDBId: Types.ObjectId;
    adminDBId: Types.ObjectId;
    kudosType: KudosType;
    kudosReason: string;
}

export interface LinkUnlinkWalletTransactionData {
    userId: Types.ObjectId;
    isLinking: boolean;
    targetWalletAddress: `0x${string}`;
    linkWalletDBId?: Types.ObjectId;
    gasExpenditureId: Types.ObjectId;
}

export interface MintEventTicketTransactionData {
    recipientDBId: Types.ObjectId;
    freeTicketDBId: Types.ObjectId;
}

export interface PfpTransactionData {
    userId: Types.ObjectId;
    tokenId: number;
    contractAddress: string;
    chainId: number;
    name: string;
    imageUrl: string;
    gasExpenditureId?: Types.ObjectId;
}

export interface RipTicketTransactionData {
    userId: Types.ObjectId;
    rippedTicketId: Types.ObjectId;
    rippedTicketTokenId: number;
}

export interface WildfileTransactionData {
    userIds: Types.ObjectId[];
    walletAddresses: string[];
}

//------- Transaction result data interfaces -------

export interface AirdropResultData {
    success: boolean;
    txnHash: string;
    airdropTokenId: string;
    airdropErrorMsg: string;
}

export interface ArchiveLeaderboardBatchResultData {
    wildeventId: number;
    txnHash: string;
    pageNumber: number;
    pageCompleted: boolean;
    wildfileIds: number[];
}
export interface LinkUnlinkWalletResultData {
    wildeventId: number;
    txnHash: string;
    gasCost: number;
}

export interface MintEventTicketResultData {
    success: boolean;
    txnHash: string;
    ticketId: string;
}

export interface PfpResultData {
    userWildfileId: number;
    wildeventId: number;
    success: boolean;
    txnHash: string;
    gasCost: number;
}

export interface RipTicketResultData {
    success: boolean;
    txnHash: string;
}

export interface WildfileResultData {
    batchSize: number;
    mintedWildfileCount: number;
    mintedWildfiles: number[];
    mintingAddresses: string[];
}

//------- Transaction bundle completion data interfaces -------

export interface ArchiveLeaderboardCompletionData {}

export interface GiveKudosCompletionData {
    kudosEventId: Types.ObjectId;
    broadcasted: boolean;
}

export interface LinkUnlinkWalletCompletionData {
    postedWildevent: PostedWildevent;
    userId?: Types.ObjectId;
}

export interface PfpCompletionData {
    postedWildevent: PostedWildevent;
    userId?: Types.ObjectId;
}
