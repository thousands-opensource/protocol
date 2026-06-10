import {
    IDiscordEvent,
    MONGO_POSTED_WILDEVENT,
    MONGO_REQUIRED_DATE,
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
    UpdateWithAggregationPipeline,
    UpdateQuery,
    QueryOptions,
} from "mongoose";
const DISCORD_STAGES_TABLE_NAME = "discordEvents";

// mongo schema
const discordEventSchema = new Schema<IDiscordEvent>({
    scheduledEventId: MONGO_REQUIRED_STRING,
    channelId: MONGO_REQUIRED_STRING,
    name: MONGO_REQUIRED_STRING,
    description: String,
    discordEventType: MONGO_REQUIRED_STRING,
    image: String,
    url: MONGO_REQUIRED_STRING,
    status: MONGO_REQUIRED_STRING,
    scheduledStartTime: MONGO_REQUIRED_DATE,
    actualStartTime: Date,
    endTime: Date,
    broadcastMessageId: String,
    discordEventThreadId: String,
    wildevent: MONGO_POSTED_WILDEVENT,
    sessionCode: String,
    channelEntrances: [
        {
            discordId: String,
            timestamp: Number,
        },
    ],
    channelExits: [
        {
            discordId: String,
            timestamp: Number,
        },
    ],
    userIdMinutesAttended: [
        {
            userId: Types.ObjectId,
            minutesAttended: Number,
        },
    ],
    discordEventAttendanceWildevents: [MONGO_POSTED_WILDEVENT],
    airdropEventWildevent: [MONGO_POSTED_WILDEVENT],
});

discordEventSchema.set(TIMESTAMPS, true);

const discordEventModel =
    (models[DISCORD_STAGES_TABLE_NAME] as Model<
        IDiscordEvent,
        {},
        {},
        {},
        any
    >) || model<IDiscordEvent>(DISCORD_STAGES_TABLE_NAME, discordEventSchema);

export type DiscordStageDoc = Document<unknown, any, IDiscordEvent> &
    IDiscordEvent &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Create a new discord event in the database.
 * @param iDiscordEvent - The event to create.
 * @returns The created event document.
 */
export async function createDiscordEventDB(iDiscordEvent: IDiscordEvent) {
    return await discordEventModel.create(iDiscordEvent);
}

/**
 * Deletes a discord event from the database based on the provided query.
 * @param query - The MongoDB query used to delete the discord event.
 * @returns The result of the delete operation.
 */
export async function deleteOneDiscordEventDB(
    query: FilterQuery<IDiscordEvent>
) {
    return await discordEventModel.deleteOne(query);
}

/**
 * Returns all discord event documents based on the provided query, sorted by the most recent end time.
 * @param query - The MongoDB query used to fetch discord events.
 * @returns An array of IDiscordEvents or an empty array if none are found.
 */
export async function findDiscordEventsByQuery(
    query: FilterQuery<IDiscordEvent>
) {
    return await discordEventModel.find(query).sort({ endTime: -1 });
}

/**
 * Returns a single IDiscordEvent document based on the provided query.
 * @param query - The MongoDB query used to fetch the discord event.
 * @returns The found IDiscordEvent document or null if none found.
 */
export async function findOneDiscordEventByQuery(
    query: FilterQuery<IDiscordEvent>
) {
    return await discordEventModel.findOne(query);
}

/**
 * Updates a discord event in the database based on the provided query.
 * @param query - The MongoDB query used to find the discord event to update.
 * @param updateObj - The object defining the update to apply.
 * @param options - Additional query options for the update operation.
 * @returns The updated discord event document.
 */
export async function updateOneDiscordEventDB(
    query: FilterQuery<IDiscordEvent>,
    updateObj: UpdateWithAggregationPipeline | UpdateQuery<IDiscordEvent>,
    options?: QueryOptions<IDiscordEvent>
): Promise<IDiscordEvent | null> {
    return await discordEventModel.findOneAndUpdate(query, updateObj, {
        returnDocument: "after",
        ...options,
    });
}
