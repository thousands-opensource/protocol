import { Types } from "mongoose";

export interface IRippedTicket {
    tokenId: number;
    userId: Types.ObjectId;
    eventName: string;
    eventId: string;
    transactionQueueId?: Types.ObjectId;
    // TODO: implement in a future PR transactionQueueStat: string;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
