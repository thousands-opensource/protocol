import {
    IMintFrameUsers,
    IValidateSpordUsers,
    MONGO_REQUIRED_NUMBER,
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
} from "mongoose";

const MINT_FRAME_USERS_TABLE_NAME = "mint-frame-users";
const VALIDATE_SPORD_USERS_TABLE_NAME = "validate-spord-users";

// mongo schema
const mintFrameUsersSchema = new Schema<IMintFrameUsers>({
    mintId: MONGO_REQUIRED_STRING,
    mintFrameUsers: [
        {
            address: MONGO_REQUIRED_STRING,
            tokenId: MONGO_REQUIRED_NUMBER,
        },
    ],
});

mintFrameUsersSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const mintFrameUsersModel =
    (models[MINT_FRAME_USERS_TABLE_NAME] as Model<
        IMintFrameUsers,
        {},
        {},
        {},
        any
    >) ||
    model<IMintFrameUsers>(MINT_FRAME_USERS_TABLE_NAME, mintFrameUsersSchema);

export type MintFrameUsersDoc = Document<unknown, any, IMintFrameUsers> &
    IMintFrameUsers &
    Required<{
        _id: Types.ObjectId;
    }>;

// mongo schema
const validateSpordUsersSchema = new Schema<IValidateSpordUsers>({
    address: MONGO_REQUIRED_STRING,
    castTime: MONGO_REQUIRED_NUMBER,
    fid: MONGO_REQUIRED_STRING,
    txnHash: String,
    tokenId: Number,
});

validateSpordUsersSchema.set(TIMESTAMPS, true);

export const validateSpordUsersModel =
    (models[VALIDATE_SPORD_USERS_TABLE_NAME] as Model<
        IValidateSpordUsers,
        {},
        {},
        {},
        any
    >) ||
    model<IValidateSpordUsers>(
        VALIDATE_SPORD_USERS_TABLE_NAME,
        validateSpordUsersSchema
    );

export type ValidateSpordUsersDoc = Document<
    unknown,
    any,
    IValidateSpordUsers
> &
    IValidateSpordUsers &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Returns mint frame users based on the provided query.
 * @param query - The MongoDB query used to fetch mint frame users.
 * @returns A promise that resolves to the found mint frame users document or null if none found.
 */
export async function findMintFrameUsersByQuery(
    query: FilterQuery<IMintFrameUsers>
): Promise<IMintFrameUsers | null> {
    return await mintFrameUsersModel.findOne(query);
}

/**
 * Returns validate spord users based on the provided query.
 * @param query - The MongoDB query used to fetch validate spord users.
 * @returns A promise that resolves to the found validate spord users document or null if none found.
 */
export async function findValidateSpordUsersByQuery(
    query: FilterQuery<IValidateSpordUsers>
): Promise<IValidateSpordUsers | null> {
    return await validateSpordUsersModel.findOne(query);
}

/**
 * Updates mint frame users in the database based on the provided query.
 * @param query - The MongoDB query used to find IMintFrameUsers to update.
 * @param update - The object defining the update to apply.
 * @returns A promise that resolves to the updated mint frame users document.
 */
export async function updateOneMintFrameUsersDB(
    query: FilterQuery<IMintFrameUsers>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IMintFrameUsers>
) {
    const options = {
        upsert: true,
    };
    return await mintFrameUsersModel.findOneAndUpdate(query, update, options);
}

/**
 * Updates validate spord users in the database based on the provided query.
 * @param query - The MongoDB query used to find IValidateSpordUsers to update.
 * @param update - The object defining the update to apply.
 * @returns A promise that resolves to the updated validate spord users document.
 */
export async function updateOneValidateSpordUsersDB(
    query: FilterQuery<IValidateSpordUsers>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IValidateSpordUsers>
) {
    const options = {
        upsert: true,
    };
    return await validateSpordUsersModel.findOneAndUpdate(
        query,
        update,
        options
    );
}
