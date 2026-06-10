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
    IDiscordBroadcastMessage,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const DISCORD_BROADCAST_MESSAGES_TABLE_NAME = "discord-broadcast-messages";

const discordBroadcastMessagesSchema = new Schema<IDiscordBroadcastMessage>({
    messageName: MONGO_REQUIRED_STRING,
    guildId: MONGO_REQUIRED_STRING,
    channelId: MONGO_REQUIRED_STRING,
    messageId: MONGO_REQUIRED_STRING,
});

discordBroadcastMessagesSchema.set(TIMESTAMPS, true);

export const discordBroadcastMessagesModel =
    (models[DISCORD_BROADCAST_MESSAGES_TABLE_NAME] as Model<
        IDiscordBroadcastMessage,
        {},
        {},
        {},
        any
    >) ||
    model<IDiscordBroadcastMessage>(
        DISCORD_BROADCAST_MESSAGES_TABLE_NAME,
        discordBroadcastMessagesSchema
    );

export type DiscordBroadcastMessagesDoc = Document<
    unknown,
    any,
    IDiscordBroadcastMessage
> &
    IDiscordBroadcastMessage &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Returns DiscordBroadcastMessage document based on the provided query.
 * @param query - The MongoDB query used to fetch the DiscordBroadcastMessage.
 * @returns The found DiscordBroadcastMessage document or null if none found.
 */
export async function findOneDiscordBroadcastMessageByQuery(
    query: FilterQuery<IDiscordBroadcastMessage>
) {
    return await discordBroadcastMessagesModel.findOne(query);
}

/**
 * Upserts a DiscordBroadcastMessage in the database.
 * If the message does not exist, it will be created. If it exists, it will be updated.
 * @param messageName - The name of the message to upsert.
 * @param updateObj - The object defining the update to make.
 * @returns The upserted or updated DiscordBroadcastMessage document.
 */
export async function upsertDiscordBroadcastMessageDB(
    messageName: string,
    updateObj:
        | UpdateWithAggregationPipeline
        | UpdateQuery<IDiscordBroadcastMessage>
) {
    const query = { messageName };
    const options = {
        upsert: true,
        new: true,
    };
    return await discordBroadcastMessagesModel.findOneAndUpdate(
        query,
        updateObj,
        options
    );
}
