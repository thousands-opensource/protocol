import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    UpdateWithAggregationPipeline,
    UpdateQuery,
} from "mongoose";
import {
    IRippedTicket,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    TRANSACTION_QUEUE_TABLE_NAME,
    USERS,
} from "@repo/interfaces";

export const RIPPED_TICKETS = "ripped-tickets";

// Mongo schema
const rippedTicketSchema = new Schema<IRippedTicket>({
    tokenId: {
        type: Number,
        required: false,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    eventName: MONGO_REQUIRED_STRING,
    eventId: MONGO_REQUIRED_STRING,
    transactionQueueId: {
        type: Schema.Types.ObjectId,
        ref: TRANSACTION_QUEUE_TABLE_NAME,
        required: false,
    },
});

rippedTicketSchema.set(TIMESTAMPS, true);

const rippedTicketsModel =
    (models[RIPPED_TICKETS] as Model<IRippedTicket, {}, {}, {}, any>) ||
    model<IRippedTicket>(RIPPED_TICKETS, rippedTicketSchema);

export type RippedTicketsDoc = Document<unknown, any, IRippedTicket> &
    IRippedTicket &
    Required<{
        _id: Types.ObjectId;
    }>;
/**
 * Creates a new ripped ticket in the database.
 * @param rippedTicket - The ripped ticket object to create.
 * @returns A promise that resolves to the created ripped ticket document.
 */
export async function createRippedTicket(rippedTicket: IRippedTicket) {
    return await rippedTicketsModel.create(rippedTicket);
}

/**
 * Finds a single ripped ticket document based on the provided query.
 * @param query - The MongoDB query used to fetch the ripped ticket.
 * @returns A promise that resolves to the found ripped ticket document or null if none found.
 */
export async function findOneRippedTicketByQuery(
    query: FilterQuery<IRippedTicket>
) {
    return await rippedTicketsModel.findOne(query);
}

/**
 * Returns a list of ripped tickets based on the provided query.
 * @param query - The MongoDB query used to fetch ripped tickets.
 * @returns A promise that resolves to an array of ripped tickets or an empty array if none are found.
 */
export async function findRippedTicketsByQuery(
    query: FilterQuery<IRippedTicket>
) {
    return await rippedTicketsModel.find(query);
}

/**
 * Updates a ripped ticket in the database based on the provided query.
 * @param query - The MongoDB query used to find the ripped ticket to update.
 * @param update - The object defining the update to apply.
 * @returns A promise that resolves to the updated ripped ticket document.
 */
export async function updateOneRippedTicket(
    query: FilterQuery<IRippedTicket>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IRippedTicket>
) {
    return await rippedTicketsModel.findOneAndUpdate(query, update, {
        upsert: true,
        returnDocument: "after",
    });
}
