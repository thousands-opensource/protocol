import { FranchiseTransactionDoc } from "@repo/schemas";
import { Types } from "mongoose";

export default interface IFranchiseTransactionsRepository {
    getFranchiseTransactionsByDate(
        startDate: Date,
        endDate: Date
    ): Promise<FranchiseTransactionDoc[]>;

    getFranchiseTransactionsByUser(
        userId: string | Types.ObjectId
    ): Promise<FranchiseTransactionDoc[]>;

    addFranchiseTransaction(
        transaction: Partial<FranchiseTransactionDoc>
    ): Promise<FranchiseTransactionDoc | null>;
}

