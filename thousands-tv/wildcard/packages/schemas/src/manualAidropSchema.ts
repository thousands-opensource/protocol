import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    IManualAirdrop,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const MANUAL_AIRDROP_TABLE_NAME = "manual-airdrops";

// mongo schema
const manualAirdropSchema = new Schema<IManualAirdrop>({
    address: MONGO_REQUIRED_STRING,
    txnHash: MONGO_REQUIRED_STRING,
    tokenId: MONGO_REQUIRED_NUMBER,
});

// Enable automatic management of createdAt and updatedAt fields
manualAirdropSchema.set(TIMESTAMPS, true);

// Create the model from the schema
const manualAirdropModel =
    (models[MANUAL_AIRDROP_TABLE_NAME] as Model<
        IManualAirdrop,
        {},
        {},
        {},
        any
    >) || model<IManualAirdrop>(MANUAL_AIRDROP_TABLE_NAME, manualAirdropSchema);

// Define a Mongoose Document type for ManualAirdrop
export type ManualAirdropDoc = Document<unknown, any, IManualAirdrop> &
    IManualAirdrop &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Inserts multiple new manual airdrops into the database.
 * @param airdrops - An array of airdrop details to insert.
 * @returns A promise that resolves when the airdrops have been successfully inserted.
 */
export async function insertManyManualAirdrops(airdrops: IManualAirdrop[]) {
    await manualAirdropModel.insertMany(airdrops);
}
