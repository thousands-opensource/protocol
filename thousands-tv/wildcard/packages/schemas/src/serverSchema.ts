import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
} from "mongoose";
import { 
    IServer, 
    MONGO_REQUIRED_STRING, 
    TIMESTAMPS, 
    IDENTITIES 
} from "@repo/interfaces";
import { seriesSchema } from "./seriesSchema";
import { eventsSchema } from "./eventSchema";

//Servers collection in MongoDB
export const SERVERS_TABLE_NAME = "servers";

const serverSchema = new Schema<IServer>({
    serverCode: MONGO_REQUIRED_STRING,
    serverName: MONGO_REQUIRED_STRING,
    description: MONGO_REQUIRED_STRING,
    status: MONGO_REQUIRED_STRING,
    serverPrimaryLogoUrl: MONGO_REQUIRED_STRING,
    stages: [{
        _id: Schema.Types.ObjectId,
        serverId: Schema.Types.ObjectId,
        seriesId: Schema.Types.ObjectId,
        eventId: Schema.Types.ObjectId,
        name: MONGO_REQUIRED_STRING,
        description: MONGO_REQUIRED_STRING,
        status: MONGO_REQUIRED_STRING,
        startDate: Date,
        endDate: Date,
        eventType: MONGO_REQUIRED_STRING,
    }],
    series: [seriesSchema],
    events: [eventsSchema],
    identities: [{type: Types.ObjectId, ref: IDENTITIES, required: true }],
});

serverSchema.set(TIMESTAMPS, true);

export const serverModel =
    (models[SERVERS_TABLE_NAME] as Model<IServer, {}, {}, {}, any>) ||
    model<IServer>(SERVERS_TABLE_NAME, serverSchema);

export type ServerDoc = Document<unknown, any, IServer> &
    IServer &
    Required<{ _id: Types.ObjectId }>;

/**
 * Returns a single server document based on the provided query.
 * @param query - The MongoDB query used to fetch the server.
 * @returns A promise that resolves to the found server document or null if none found.
 */
export async function findOneServerByQuery(
    query: FilterQuery<IServer>
): Promise<ServerDoc | null> {
    return await serverModel.findOne(query).exec();
}
