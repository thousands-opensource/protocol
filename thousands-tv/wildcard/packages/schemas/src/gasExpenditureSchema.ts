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
    IGasExpenditure,
    MONGO_POSTED_WILDEVENT,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const GAS_EXPENDITURES = "gas-expenditures";

const gasExpenditureSchema = new Schema<IGasExpenditure>({
    userId: MONGO_REQUIRED_STRING,
    txnType: MONGO_REQUIRED_STRING,
    txnCost: MONGO_REQUIRED_NUMBER,
    wildevent: MONGO_POSTED_WILDEVENT,
});

gasExpenditureSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const gasExpendituresModel =
    (models[GAS_EXPENDITURES] as Model<IGasExpenditure, {}, {}, {}, any>) ||
    model<IGasExpenditure>(GAS_EXPENDITURES, gasExpenditureSchema);

export type GasExpenditureDoc = Document<unknown, any, IGasExpenditure> &
    IGasExpenditure &
    Required<{ _id: Types.ObjectId }>;

/**
 * Returns all gas expenditure documents based on the provided query, sorted by the most recent end time.
 * @param query - The MongoDB query used to fetch gas expenditures.
 * @returns A promise that resolves to a list of gas expenditures or an empty array if none are found.
 */
export async function findGasExpendituresByQuery(
    query: FilterQuery<IGasExpenditure>
): Promise<GasExpenditureDoc[]> {
    return await gasExpendituresModel.find(query).sort({ endTime: -1 });
}

/**
 * Inserts a new record of a gas expenditure into the database.
 * @param expenditure - The gas expenditure object to insert.
 * @returns The created gas expenditure document.
 */
export async function insertGasExpenditure(expenditure: IGasExpenditure) {
    return await gasExpendituresModel.create(expenditure);
}

/**
 * Updates a record of a gas expenditure in the database based on the provided query.
 * @param query - The MongoDB query used to find the gas expenditure to update.
 * @param updateObj - The object defining the update to apply.
 * @returns The updated gas expenditure document.
 */
export async function updateGasExpenditure(
    query: FilterQuery<IGasExpenditure>,
    updateObj: UpdateWithAggregationPipeline | UpdateQuery<IGasExpenditure>
) {
    return await gasExpendituresModel.findOneAndUpdate(query, updateObj, {
        new: true,
    });
}
