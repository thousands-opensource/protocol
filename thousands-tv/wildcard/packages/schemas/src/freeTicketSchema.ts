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
    IFreeTicket,
    TIMESTAMPS,
    TRANSACTION_QUEUE_TABLE_NAME,
    USERS,
} from "@repo/interfaces";

export const FREE_TICKETS = "free-tickets";

//mongo schema
const freeTicketSchema = new Schema<IFreeTicket>({
    owner: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    sponsor: String,
    transactionQueueId: {
        type: Schema.Types.ObjectId,
        ref: TRANSACTION_QUEUE_TABLE_NAME,
        required: false,
    },
    ticketId: Number,
});

freeTicketSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const freeTicketsModel =
    (models[FREE_TICKETS] as Model<IFreeTicket, {}, {}, {}, any>) ||
    model<IFreeTicket>(FREE_TICKETS, freeTicketSchema);

export type FreeTicketsDoc = Document<unknown, any, IFreeTicket> &
    IFreeTicket &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Creates a new free ticket in the database.
 * @param freeTicket - The free ticket object to create.
 * @returns The created free ticket document.
 */
export async function createFreeTicket(freeTicket: IFreeTicket) {
    return await freeTicketsModel.create(freeTicket);
}

/**
 * Returns a list of free tickets based on the provided query.
 * @param query - The MongoDB query used to fetch free tickets.
 * @returns A promise that resolves to an array of free tickets or an empty array if none are found.
 */
export async function findFreeTicketsByQuery(query: FilterQuery<IFreeTicket>) {
    return await freeTicketsModel.find(query);
}

/**
 * Returns a free ticket document based on the provided query.
 * @param query - The MongoDB query used to fetch the free ticket.
 * @returns The found free ticket document or null if none found.
 */
export async function findOneFreeTicketByQuery(
    query: FilterQuery<IFreeTicket>
) {
    return await freeTicketsModel.findOne(query);
}

/**
 * Updates a free ticket in the database based on the provided query.
 * @param query - The MongoDB query used to find the free ticket to update.
 * @param update - The object defining the update to make.
 * @returns A promise that resolves to the updated free ticket document.
 */
export async function updateOneFreeTicket(
    query: FilterQuery<IFreeTicket>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IFreeTicket>
) {
    return await freeTicketsModel.findOneAndUpdate(query, update, {
        upsert: true,
        returnDocument: "after",
    });
}

/**
 * Updates a free ticket in the database based on the provided query.
 * @param query - The MongoDB query used to find the free ticket to update.
 * @param update - The object defining the update to make.
 * @returns A promise that resolves to the updated free ticket document.
 */
export async function updateOneFreeTicketByQuery(
    query: FilterQuery<IFreeTicket>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IFreeTicket>
) {
    const options = {
        upsert: true,
    };
    return await freeTicketsModel.findOneAndUpdate(query, update, options);
}
