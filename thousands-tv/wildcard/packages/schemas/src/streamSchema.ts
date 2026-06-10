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
import {
    ChatApp,
    IStream,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";
import { STAGES_TABLE_NAME } from "./stageSchema";
import { SERVERS_TABLE_NAME } from "./serverSchema";

export const STREAMS = "streams";

const streamSchema = new Schema<IStream>({
    serverId: {
        type: Schema.Types.ObjectId,
        ref: SERVERS_TABLE_NAME,
        required: true,
    },
    stageId: {
        type: Schema.Types.ObjectId,
        ref: STAGES_TABLE_NAME,
        required: true,
    },
    vendorEventId: String,
    name: MONGO_REQUIRED_STRING,
    description: MONGO_REQUIRED_STRING,
    status: MONGO_REQUIRED_STRING,
    stageArn: String,
    channelArn: String,
    channelPlaybackUrl: String,
    chatRoomArn: String,
    cameraOperatorParticipantToken: String,
    streamKey: String,
    ingestEndpoint: String,
    chatApp: {
        type: String,
        enum: Object.values(ChatApp),
        required: true,
    },
});

streamSchema.set(TIMESTAMPS, true);

export const streamModel =
    (models.streams as Model<IStream, {}, {}, {}, any>) ||
    model<IStream>(STREAMS, streamSchema);

export type StreamDoc = Document<unknown, any, IStream> &
    IStream &
    Required<{ _id: Types.ObjectId }>;
