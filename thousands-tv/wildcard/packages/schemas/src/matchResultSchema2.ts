import mongoose, {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
} from "mongoose";
import {
    IMatchResults2,
    MONGO_REQUIRED_BOOLEAN,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

export const MATCH_RESULT_TABLE_NAME2 = "match_results";

const statusTracking = {
    kbi: MONGO_REQUIRED_STRING,
    kbr: MONGO_REQUIRED_STRING,
    ti: MONGO_REQUIRED_STRING,
    tr: MONGO_REQUIRED_STRING,
    hi: MONGO_REQUIRED_STRING,
    hr: MONGO_REQUIRED_STRING,
    si: MONGO_REQUIRED_STRING,
    sr: MONGO_REQUIRED_STRING,
    hai: MONGO_REQUIRED_STRING,
    har: MONGO_REQUIRED_STRING,
};

const damageTracking = {
    pdi: MONGO_REQUIRED_STRING,
    pdr: MONGO_REQUIRED_STRING,
    fdi: MONGO_REQUIRED_STRING,
    fdr: MONGO_REQUIRED_STRING,
    poisonDamageInflicted: String,
    poisonDamageReceived: String,
    kdi: MONGO_REQUIRED_STRING,
    kdr: MONGO_REQUIRED_STRING,
    sonicDamageInflicted: String,
    sonicDamageReceived: String,
};

const castCards = {
    _id: MONGO_REQUIRED_STRING,
    c: MONGO_REQUIRED_NUMBER,
};

const loadout = {
    _id: MONGO_REQUIRED_STRING,
    c: MONGO_REQUIRED_STRING,
    n: MONGO_REQUIRED_STRING,
    s: [MONGO_REQUIRED_STRING],
    t: [MONGO_REQUIRED_STRING],
    w: [MONGO_REQUIRED_STRING],
    cos: [MONGO_REQUIRED_STRING],
    eq: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
    },
    IsDefault: MONGO_REQUIRED_BOOLEAN,
};

const playerDatum = {
    gt: MONGO_REQUIRED_STRING,
    t: MONGO_REQUIRED_NUMBER,
    l: loadout,
    c: [castCards],
    kos: MONGO_REQUIRED_NUMBER,
    tdi: MONGO_REQUIRED_NUMBER,
    tdr: MONGO_REQUIRED_NUMBER,
    koi: MONGO_REQUIRED_NUMBER,
    sko: MONGO_REQUIRED_NUMBER,
    gko: MONGO_REQUIRED_NUMBER,
    ss: MONGO_REQUIRED_NUMBER,
    hs: MONGO_REQUIRED_STRING,
    mc: MONGO_REQUIRED_STRING,
    dt: damageTracking,
    st: statusTracking,
    totalWildcardsAcquired: MONGO_REQUIRED_STRING,
};

export const matchResultsSchema2 = new Schema<IMatchResults2>({
    // matchResults: Schema.Types.Mixed,
    matchResults: {
        lid: MONGO_REQUIRED_STRING,
        pd: [playerDatum],
        wt: MONGO_REQUIRED_STRING,
        d: MONGO_REQUIRED_NUMBER,
        eid: MONGO_REQUIRED_STRING,
        mid: MONGO_REQUIRED_STRING,
        gt: MONGO_REQUIRED_STRING,
        createdAt: { type: Date },
    },
});

matchResultsSchema2.set(TIMESTAMPS, true);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const matchResultsModel2 =
    (models[MATCH_RESULT_TABLE_NAME2] as Model<
        IMatchResults2,
        {},
        {},
        {},
        any
    >) || model<IMatchResults2>(MATCH_RESULT_TABLE_NAME2, matchResultsSchema2);

export type MatchResultsDoc2 = Document<unknown, any, IMatchResults2> &
    IMatchResults2 &
    Required<{ _id: Types.ObjectId }>;

export function getMatchResultsModel2(
    connection: mongoose.Connection
): Model<IMatchResults2> {
    return (
        connection.models[MATCH_RESULT_TABLE_NAME2] ||
        connection.model<IMatchResults2>(
            MATCH_RESULT_TABLE_NAME2,
            matchResultsSchema2
        )
    );
}

export async function findMatchResultsByDateRange2(
    matchResultsModel: Model<IMatchResults2>,
    startDate: Date,
    endDate: Date,
    limit?: number,
    skip?: number
): Promise<IMatchResults2[]> {
    return await matchResultsModel
        .find({
            "createdAt": {
                $gte: startDate,
                $lte: endDate,
            },
        })
        .sort({ "createdAt": 1 })
        .limit(limit)
        .skip(skip)
        .lean();
}
