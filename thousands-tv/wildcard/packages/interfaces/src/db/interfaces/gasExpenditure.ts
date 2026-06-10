import { Types } from "mongoose";
import { BigNumber } from "ethers";
import { PostedWildevent } from "../dbShared";

export type GasBudgetTxnType =
    | "setPfp"
    | "linkedWallet"
    | "unlinkedWallet"
    | "completedSwagSet";

export interface IGasExpenditure {
    userId: string;
    txnType: GasBudgetTxnType;
    txnCost: number;
    wildevent?: PostedWildevent;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface ActivityItem {
    name: string;
    time: Date;
    txnHash: string;
}

export interface GasPrice {
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
}

export type GasPriceNumeric = {
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
};
