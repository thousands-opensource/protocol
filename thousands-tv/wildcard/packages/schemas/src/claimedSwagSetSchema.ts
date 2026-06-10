import {
    ClaimedSwagSet,
    IClaimedSwagSets,
    MONGO_POSTED_WILDEVENT,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";
import { Document, Schema, model, Model, models, Types } from "mongoose";

const CLAIMED_SWAG_SETS = "claimed-swag-sets";

// mongo schema
const swagSetSchema = new Schema<IClaimedSwagSets>({
    userId: MONGO_REQUIRED_STRING,
    claimedSwagSets: [
        {
            title: MONGO_REQUIRED_STRING,
            tokenIds: [MONGO_REQUIRED_STRING],
            postedWildevent: MONGO_POSTED_WILDEVENT,
        },
    ],
});

swagSetSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const userClaimedSwagSetsModel =
    (models[CLAIMED_SWAG_SETS] as Model<IClaimedSwagSets, {}, {}, {}, any>) ||
    model<IClaimedSwagSets>(CLAIMED_SWAG_SETS, swagSetSchema);

export type UserClaimedSwagSetDoc = Document<unknown, any, IClaimedSwagSets> &
    IClaimedSwagSets &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Returns claimed Swag Sets by user ID.
 * @param userId - The ID of the user to search for.
 * @returns A promise that resolves to a list of claimed swag sets or an empty array if none are found.
 */
export async function findClaimedSwagSetsByWildfileId(
    userId: string
): Promise<ClaimedSwagSet[]> {
    const claimedSwagSetDoc: UserClaimedSwagSetDoc | null =
        await userClaimedSwagSetsModel.findOne({
            userId,
        });

    if (claimedSwagSetDoc) {
        return claimedSwagSetDoc.claimedSwagSets;
    }
    return [];
}
