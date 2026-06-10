import mongoose, {
    Connection,
    Document,
    Model,
    Schema,
    Types,
} from "mongoose";
import { ITournament, TIMESTAMPS, TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION } from "@repo/interfaces";

export const TOURNAMENTS_TABLE_NAME = "tournaments";
const DEFAULT_WILDCARD_GAME_DB_NAME =
    "1676368290596864DE_1676368290596867_PurchaseStorage";

const rewardSchema = new Schema(
    {
        gt: { type: Number, required: true },
        s: { type: Number, required: true },
    },
    { _id: false }
);

const tournamentsSchema = new Schema<ITournament>({
    tid: { type: String, required: true },
    cid: { type: String },
    s: { type: Date },
    e: { type: Date },
    p: { type: Boolean },
    as: { type: Boolean },
    cd: { type: String },
    r: { type: [rewardSchema], default: [] },
    payoutSchedule: {
        type: Schema.Types.ObjectId,
        ref: TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION,
    },
});

tournamentsSchema.set(TIMESTAMPS, true);

declare global {
    // eslint-disable-next-line no-var
    var tournamentsConnection: Connection | undefined;
}

const buildWildcardGameConnectionUri = (): {
    uri: string;
    dbName: string;
} => {
    const explicitUri = process.env.WILDCARD_GAME_MONGODB_URI;
    const dbName =
        process.env.WILDCARD_GAME_MONGODB_NAME || DEFAULT_WILDCARD_GAME_DB_NAME;

    return { uri: explicitUri, dbName };
};

const getTournamentsConnection = (): Connection => {
    if (globalThis.tournamentsConnection) {
        return globalThis.tournamentsConnection;
    }

    const { uri, dbName } = buildWildcardGameConnectionUri();
    const connection = mongoose.createConnection(uri, {
        dbName,
        maxPoolSize: 5,
    });

    connection.on("error", (err) => {
        console.error("Wildcard Game MongoDB connection error", err);
    });

    globalThis.tournamentsConnection = connection;
    return connection;
};

const tournamentsConnection = getTournamentsConnection();

export const tournamentsModel =
    (tournamentsConnection.models[TOURNAMENTS_TABLE_NAME] as Model<
        ITournament,
        {},
        {},
        {},
        any
    >) ||
    tournamentsConnection.model<ITournament>(
        TOURNAMENTS_TABLE_NAME,
        tournamentsSchema
    );

export type TournamentDoc = Document<unknown, any, ITournament> &
    ITournament &
    Required<{ _id: Types.ObjectId }>;

