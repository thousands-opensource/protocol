import {
    IKudosEvent,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    QueryOptions,
    ProjectionFields,
} from "mongoose";
const KUDOS_STAGES_TABLE_NAME = "kudos-events";

// mongo schema
const kudosEventSchema = new Schema<IKudosEvent>({
    type: MONGO_REQUIRED_STRING,
    recipientUserId: { type: Schema.Types.ObjectId, required: true },
    awardedByUserId: { type: Schema.Types.ObjectId, required: true },
    airdropTokenId: MONGO_REQUIRED_STRING,
    airdropTxnHash: String,
    reason: String,
});

kudosEventSchema.set(TIMESTAMPS, true);

const kudosEventModel =
    (models[KUDOS_STAGES_TABLE_NAME] as Model<IKudosEvent, {}, {}, {}, any>) ||
    model<IKudosEvent>(KUDOS_STAGES_TABLE_NAME, kudosEventSchema);

export type kudosStageDoc = Document<unknown, any, IKudosEvent> &
    IKudosEvent &
    Required<{
        _id: Types.ObjectId;
    }>;
/**
 * Counts the number of kudos event documents that match the provided query.
 * @param query - The MongoDB query used to fetch kudos events.
 * @returns A promise that resolves to the number of matching documents.
 */
export async function countKudosDocument(query: FilterQuery<IKudosEvent>) {
    return await kudosEventModel.countDocuments(query);
}

/**
 * Creates a new kudos event document in the database.
 * @param kudosEvent - The kudos event object to create.
 * @returns The created kudos event document.
 */
export async function createKudosEvent(kudosEvent: IKudosEvent) {
    return await kudosEventModel.create(kudosEvent);
}

/**
 * Returns all kudos event documents based on the provided query.
 * @param query - The MongoDB query used to fetch kudos events.
 * @param projectionFields - Fields to include or exclude in the returned documents.
 * @param queryOption - Additional options for the query.
 * @returns A promise that resolves to an array of KudosEvent documents or an empty array if none are found.
 */
export async function findKudosByQuery(
    query: FilterQuery<IKudosEvent>,
    projectionFields?: ProjectionFields<IKudosEvent>,
    queryOption?: QueryOptions<IKudosEvent>
) {
    return await kudosEventModel.find(query, projectionFields, queryOption);
}
