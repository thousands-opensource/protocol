import mongoose, {
    Document,
    FilterQuery,
    Types,
    ProjectionFields,
    QueryOptions,
} from "mongoose";
import {
    IStageIdleEvent,
    EVENTIDLEEVENTS,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const eventIdleEventsSchema = new mongoose.Schema<IStageIdleEvent>({
    userId: MONGO_REQUIRED_STRING,
    eventId: MONGO_REQUIRED_STRING,
});

eventIdleEventsSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const eventIdlestagesModel =
    (mongoose.models[EVENTIDLEEVENTS] as mongoose.Model<
        IStageIdleEvent,
        {},
        {},
        {},
        any
    >) ||
    mongoose.model<IStageIdleEvent>(EVENTIDLEEVENTS, eventIdleEventsSchema);

type EventIdleStageDoc = Document<unknown, any, IStageIdleEvent> &
    IStageIdleEvent &
    Required<{ _id: Types.ObjectId }>;

/**
 * Returns all event-idle-events documents based on the provided query, sorted by userId.
 * @param query - The MongoDB query used to fetch event-idle-events.
 * @param projectionFields - Fields to include or exclude in the returned documents.
 * @param queryOption - Additional options for the query.
 * @returns A promise that resolves to an array of event-idle-events or an empty array if none are found.
 */
export async function findManyEventIdleEventsByQuery(
    query: FilterQuery<IStageIdleEvent>,
    projectionFields?: ProjectionFields<IStageIdleEvent>,
    queryOption?: QueryOptions<IStageIdleEvent>
): Promise<IStageIdleEvent[]> {
    return await eventIdlestagesModel
        .find(query, projectionFields, queryOption)
        .sort({ userId: 1 });
}
