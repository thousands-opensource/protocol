import { Types } from "mongoose";

export const TICKET_QUEUES_TABLE_NAME = "ticket-queues";

export interface ITicketQueue {
    userId: Types.ObjectId; // user id of the user in the queue
    seriesId: Types.ObjectId; // season id
    queuePoints: number; // accumulated queue points of the user

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
