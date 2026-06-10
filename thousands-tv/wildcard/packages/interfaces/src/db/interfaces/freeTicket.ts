import { Types } from "mongoose";

export interface IFreeTicket {
    owner: Types.ObjectId; // Would this make more sense to be a wallet address since it needs to be associated with one?
    sponsor?: string; // TODO should be IOrganization._id once it's integrated
    transactionQueueId?: Types.ObjectId;
    ticketId?: number;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
