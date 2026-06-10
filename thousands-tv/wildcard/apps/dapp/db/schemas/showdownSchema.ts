import { PostedWildevent } from "@repo/interfaces";
import mongoose, { Schema, model, Document, Types } from "mongoose";

const SHOWDOWNS = "showdowns";

const TIMESTAMPS = "timestamps";
const MONGO_REQUIRED_STRING = {
    type: String,
    required: true,
};
const MONGO_REQUIRED_NUMBER = {
    type: Number,
    required: true,
};
const MONGO_REQUIRED_BOOLEAN = {
    type: Boolean,
    required: true,
};
const MONGO_REQUIRED_DATE = {
    type: Date,
    required: true,
};

const MONGO_POSTED_WILDEVENT = {
    wildeventId: Number,
    txnHash: String,
    wildfileIds: [Number],
    time: Date,
};

export interface IShowdown {
    active: true;
    title: string;
    team1: string;
    team1Points: number;
    team1ContractAddress: string;
    team2: string;
    team2Points: number;
    team2ContractAddress: string;
    events?: ShowdownEvent[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export type ShowdownEventStatus = "scheduled" | "active" | "completed";

export interface ShowdownEvent {
    scheduledEventId: string;
    channelId: string;
    name: string;
    description: string;
    image: string;
    url: string;
    status: ShowdownEventStatus;
    scheduledStartTime: Date;
    points: number;
    showdownEventThreadId?: string;
    selectTeamBroadcastMessageId?: string;
    wildevent?: PostedWildevent;
    team1Selections?: string[];
    team2Selections?: string[];
    team1SelectionWildevents?: PostedWildevent[];
    team2SelectionWildevents?: PostedWildevent[];
}

// mongo schema
const showdownSchema = new Schema<IShowdown>({
    active: MONGO_REQUIRED_BOOLEAN,
    title: MONGO_REQUIRED_STRING,
    team1: MONGO_REQUIRED_STRING,
    team1Points: MONGO_REQUIRED_NUMBER,
    team1ContractAddress: MONGO_REQUIRED_STRING,
    team2: MONGO_REQUIRED_STRING,
    team2Points: MONGO_REQUIRED_NUMBER,
    team2ContractAddress: MONGO_REQUIRED_STRING,
    events: [
        {
            scheduledEventId: MONGO_REQUIRED_STRING,
            channelId: MONGO_REQUIRED_STRING,
            name: MONGO_REQUIRED_STRING,
            description: MONGO_REQUIRED_STRING,
            image: MONGO_REQUIRED_STRING,
            url: MONGO_REQUIRED_STRING,
            status: MONGO_REQUIRED_STRING,
            scheduledStartTime: MONGO_REQUIRED_DATE,
            points: MONGO_REQUIRED_NUMBER,
            showdownEventThreadId: String,
            selectTeamBroadcastMessageId: String,
            wildevent: MONGO_POSTED_WILDEVENT,
            team1Selections: [String],
            team2Selections: [String],
            team1SelectionWildevents: [MONGO_POSTED_WILDEVENT],
            team2SelectionWildevents: [MONGO_POSTED_WILDEVENT],
        },
    ],
});

showdownSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const showdownModel =
    (mongoose.models[SHOWDOWNS] as mongoose.Model<
        IShowdown,
        {},
        {},
        {},
        any
    >) || model<IShowdown>(SHOWDOWNS, showdownSchema);

export type ShowdownDoc = Document<unknown, any, IShowdown> &
    IShowdown &
    Required<{
        _id: Types.ObjectId;
    }>;
