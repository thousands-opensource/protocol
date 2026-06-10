import mongoose, {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
} from "mongoose";
import {
    IMatchResults,
    MONGO_REQUIRED_BOOLEAN,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

export const MATCH_RESULT_TABLE_NAME = "match_results";

const statusTracking = {
    knockbackStatusInflicted: MONGO_REQUIRED_STRING,
    knockbackStatusReceived: MONGO_REQUIRED_STRING,
    tauntStatusInflicted: MONGO_REQUIRED_STRING,
    tauntStatusReceived: MONGO_REQUIRED_STRING,
    hasteStatusInflicted: MONGO_REQUIRED_STRING,
    hasteStatusReceived: MONGO_REQUIRED_STRING,
    slowStatusInflicted: MONGO_REQUIRED_STRING,
    slowStatusReceived: MONGO_REQUIRED_STRING,
    hackStatusInflicted: MONGO_REQUIRED_STRING,
    hackStatusReceived: MONGO_REQUIRED_STRING,
};

const damageTracking = {
    physicalDamageInflicted: MONGO_REQUIRED_STRING,
    physicalDamageReceived: MONGO_REQUIRED_STRING,
    fireDamageInflicted: MONGO_REQUIRED_STRING,
    fireDamageReceived: MONGO_REQUIRED_STRING,
    poisonDamageInflicted: MONGO_REQUIRED_STRING,
    poisonDamageReceived: MONGO_REQUIRED_STRING,
    shockDamageInflicted: MONGO_REQUIRED_STRING,
    shockDamageReceived: MONGO_REQUIRED_STRING,
    sonicDamageInflicted: MONGO_REQUIRED_STRING,
    sonicDamageReceived: MONGO_REQUIRED_STRING,
};

const castCards = {
    _id: MONGO_REQUIRED_STRING,
    casts: MONGO_REQUIRED_NUMBER,
};

const loadout = {
    _id: MONGO_REQUIRED_STRING,
    championId: MONGO_REQUIRED_STRING,
    name: MONGO_REQUIRED_STRING,
    summonCardIds: [MONGO_REQUIRED_STRING],
    talentCardIds: [MONGO_REQUIRED_STRING],
    wildCardIds: [MONGO_REQUIRED_STRING],
    cosmeticCardIds: [MONGO_REQUIRED_STRING],
    equippedCosmetics: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
    },
    IsDefault: MONGO_REQUIRED_BOOLEAN,
};

const playerDatum = {
    gamerTag: MONGO_REQUIRED_STRING,
    teamId: MONGO_REQUIRED_NUMBER,
    loadout,
    castCards: [castCards],
    kos: MONGO_REQUIRED_NUMBER,
    totalDamageDone: MONGO_REQUIRED_NUMBER,
    totalDamageReceived: MONGO_REQUIRED_NUMBER,
    knockedouts: MONGO_REQUIRED_NUMBER,
    summonKOs: MONGO_REQUIRED_NUMBER,
    goalieKOs: MONGO_REQUIRED_NUMBER,
    sidekicksSpawned: MONGO_REQUIRED_NUMBER,
    healthCollected: MONGO_REQUIRED_STRING,
    manaCollected: MONGO_REQUIRED_STRING,
    damageTracking,
    statusTracking,
    totalWildcardsAcquired: MONGO_REQUIRED_STRING,
};

export const matchResultsSchema = new Schema<IMatchResults>({
    // matchResults: Schema.Types.Mixed,
    matchResults: {
        lobbyId: MONGO_REQUIRED_STRING,
        playerData: [playerDatum],
        winningTeamId: MONGO_REQUIRED_STRING,
        duration: MONGO_REQUIRED_NUMBER,
        eventId: MONGO_REQUIRED_STRING,
        matchId: MONGO_REQUIRED_STRING,
        gameTypeId: MONGO_REQUIRED_STRING,
        createdAt: { type: Date },
    },
});

matchResultsSchema.set(TIMESTAMPS, true);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const matchResultsModel =
    (models[MATCH_RESULT_TABLE_NAME] as Model<
        IMatchResults,
        {},
        {},
        {},
        any
    >) || model<IMatchResults>(MATCH_RESULT_TABLE_NAME, matchResultsSchema);

export type MatchResultsDoc = Document<unknown, any, IMatchResults> &
    IMatchResults &
    Required<{ _id: Types.ObjectId }>;

export function getMatchResultsModel(
    connection: mongoose.Connection
): Model<IMatchResults> {
    return (
        connection.models[MATCH_RESULT_TABLE_NAME] ||
        connection.model<IMatchResults>(
            MATCH_RESULT_TABLE_NAME,
            matchResultsSchema
        )
    );
}

export async function findMatchResultsByDateRange(
    matchResultsModel: Model<IMatchResults>,
    startDate: Date,
    endDate: Date,
    limit?: number,
    skip?: number
): Promise<IMatchResults[]> {
    return await matchResultsModel
        .find({
            "matchResults.createdAt": {
                $gte: startDate,
                $lte: endDate,
            },
        })
        .sort({ "matchResults.createdAt": 1 })
        .limit(limit)
        .skip(skip)
        .lean();
}
