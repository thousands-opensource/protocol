import {
    AccountProviderType,
    IGiftEvent,
    IUser,
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    TIMESTAMPS,
    USERS,
} from "@repo/interfaces";
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
    SortOrder,
} from "mongoose";

const GIFT_EVENTS_NAME = "gift-events";

// mongo schema
const giftEventSchema = new Schema<IGiftEvent>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    platformId: { type: String, enum: AccountProviderType, required: true },
    platformUserName: { type: String },
    completedOn: { type: Date },
    numberOfSubs: MONGO_REQUIRED_NUMBER,
});

giftEventSchema.set(TIMESTAMPS, true);

const giftEventModel =
    (models[GIFT_EVENTS_NAME] as Model<IGiftEvent, {}, {}, {}, any>) ||
    model<IGiftEvent>(GIFT_EVENTS_NAME, giftEventSchema);

export type GiftEventsDoc = Document<unknown, any, IGiftEvent> &
    IGiftEvent &
    Required<{ _id: Types.ObjectId }>;

/**
 * Retrieves a list of gift events based on the provided query.
 * @param query - The MongoDB query object used to fetch the gift events.
 * @returns A promise that resolves to an array of gift events, or an empty array if no gift event are found.
 */
export async function fetchGiftEvents(
    query: FilterQuery<IGiftEvent>
): Promise<IGiftEvent[]> {
    return await giftEventModel.find(query).sort({ userId: 1, createdAt: 1 });
}

export async function completeGiftEvent(
    query: FilterQuery<IGiftEvent>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IGiftEvent>
): Promise<IGiftEvent> {
    return await giftEventModel.findOneAndUpdate(query, update, {
        upsert: true,
    });
}
