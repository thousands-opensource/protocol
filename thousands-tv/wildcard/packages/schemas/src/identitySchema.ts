import { Document, Schema, model, Model, models, Types } from "mongoose";
import { IIdentity, MONGO_REQUIRED_STRING, TIMESTAMPS } from "@repo/interfaces";

export const IDENTITY_TABLE_NAME = "identities";

// Seasons Schema
export const identitySchema = new Schema<IIdentity>(
    {
        identityName: MONGO_REQUIRED_STRING,
        identityPfpImageUrl: MONGO_REQUIRED_STRING,
        identityType: MONGO_REQUIRED_STRING,
        identityRole: MONGO_REQUIRED_STRING,
        showAsTalent: Boolean,
        supportTokenContractAddress: String,
        startDate: { type: Date },
        endDate: { type: Date },
    }
);

identitySchema.set(TIMESTAMPS, true);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const identityModel =
    (models[IDENTITY_TABLE_NAME] as Model<IIdentity, {}, {}, {}, any>) ||
    model<IIdentity>(IDENTITY_TABLE_NAME, identitySchema);

export type IdentityDoc = Document<unknown, any, IIdentity> &
    IIdentity &
    Required<{ _id: Types.ObjectId }>;

