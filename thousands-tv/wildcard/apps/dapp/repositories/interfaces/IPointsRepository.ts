import { Types } from "mongoose";

export default interface IPointsRepository {
    addThousandsPointsTransaction(
        userId: string | Types.ObjectId,
        transactionId: string,
        amount: number
    ): Promise<boolean>;
}
