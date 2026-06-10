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
    ClientSession,
} from "mongoose";
import {
    IStage,
    MONGO_REQUIRED_STRING,
    USERS,
    IDENTITIES,
    TIMESTAMPS,
    MONGO_REQUIRED_NUMBER,
} from "@repo/interfaces";
import { SERVERS_TABLE_NAME } from "./serverSchema";
import { SERIES_TABLE_NAME } from "./seriesSchema";
import { EVENTS_TABLE_NAME } from "./eventSchema";

export const STAGES_TABLE_NAME = "stages";

// User Group Schema
export const stagesSchema = new Schema<IStage>({
    serverId: {
        type: Schema.Types.ObjectId,
        ref: SERVERS_TABLE_NAME,
        required: true,
    },
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: SERIES_TABLE_NAME,
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: EVENTS_TABLE_NAME,
    },
    beamableEventId: String,
    name: MONGO_REQUIRED_STRING,
    description: MONGO_REQUIRED_STRING,
    startDate: { type: Date },
    users: [{ type: Types.ObjectId, ref: USERS, required: true }],
    identities: [{ type: Types.ObjectId, ref: IDENTITIES, required: true }],
    channels: [{ name: MONGO_REQUIRED_STRING, src: MONGO_REQUIRED_STRING }],
    status: String,
    endDate: { type: Date },
    eventType: String,
    cameraOperator: String,
    currentSegment: MONGO_REQUIRED_NUMBER,
    gameMode: String,
    numberOfSkyboxes: Number,
});

stagesSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const stagesModel =
    (models[STAGES_TABLE_NAME] as Model<IStage, {}, {}, {}, any>) ||
    model<IStage>(STAGES_TABLE_NAME, stagesSchema);

export type StageDoc = Document<unknown, any, IStage> &
    IStage &
    Required<{ _id: Types.ObjectId }>;

/**
 * Checks if a user exists in an event based on the provided query.
 * @param query - The MongoDB query used to check for the user's existence in the event.
 * @returns A promise that resolves to an object containing the _id of the document if found, or null if not found.
 */
export async function doesUserExistInEvent(
    query: FilterQuery<IStage>
): Promise<{
    _id: Types.ObjectId | undefined;
} | null> {
    return await stagesModel.exists(query);
}

/**
 * Creates a new event record in the database.
 * @param event - The event object to create.
 * @returns The created event document.
 */
/*
export async function createEvent(stage: IStage): Promise<StageDoc> {
    return await stagesModel.create(stage);
}
*/

/**
 * Returns a list of events based on the provided query.
 * @param query - The MongoDB query used to fetch events.
 * @returns A promise that resolves to an array of events or an empty array if none are found.
 */
export async function findStagesByQuery(
    query: FilterQuery<IStage>,
    sort?: Record<string, 1 | -1>
): Promise<StageDoc[]> {
    return (await stagesModel
        .find(query)
        .populate("eventId")
        .sort(sort)
        .exec()) as StageDoc[];
}

/**
 * Returns a single event document based on the provided query.
 * @param query - The MongoDB query used to fetch the event.
 * @returns A promise that resolves to the found event document or null if none found.
 */
export async function findOneEventByQuery(
    query: FilterQuery<IStage>
): Promise<StageDoc | null> {
    return await stagesModel
        .findOne(query)
        .populate({
            path: USERS,
            select: "_id beamableProvider walletProvider.address preferences.displayName",
        })
        .exec();
}

/**
 * Updates a single event record in the database based on the provided query.
 * @param query - The MongoDB query used to find the event to update.
 * @param update - The object defining the update to make.
 * @returns A promise that resolves to the updated event document or null if none found.
 */
export async function updateOneEvent(
    query: FilterQuery<IStage>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IStage>
): Promise<StageDoc | null> {
    return await stagesModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
        upsert: true,
    });
}

/**
 * Updates an entire event document in the database.
 * @param event - The event document to update.
 * @returns A promise that resolves to the updated event document or null if none found.
 */
export async function updateEntireStage(
    stage: IStage,
    session?: ClientSession
): Promise<StageDoc | null> {
    const { _id, ...updateData } = stage;
    return await stagesModel.findByIdAndUpdate(stage._id, updateData, {
        returnDocument: "after",
        upsert: true,
        session,
    });
}
