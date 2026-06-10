import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    IRecognitionProgram,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
} from "@repo/interfaces";

export const RECOGNITION_PROGRAMS_TABLE_NAME = "recognition-programs";


const POINT_ITEM_SCHEMA = new Schema({
    networkId: MONGO_REQUIRED_STRING,
    contractAddress: MONGO_REQUIRED_STRING,
    name: MONGO_REQUIRED_STRING,
    points: MONGO_REQUIRED_NUMBER,
    itemImageUrl: MONGO_REQUIRED_STRING,
    tokenId: { type: String },
    metadataAttributes: {
        type: [
            {
                traitType: MONGO_REQUIRED_STRING,
                value: MONGO_REQUIRED_STRING,
            },
        ],
        required: false,
    },
});

const POINT_ITEM_COLLECTION_SCHEMA = new Schema({
    name: MONGO_REQUIRED_STRING,
    bonusPoints: MONGO_REQUIRED_NUMBER,
    completeSetImageUrl: { type: String },
    backgroundImageUrl: { type: String },
    pointItems: { type: [POINT_ITEM_SCHEMA], required: true },
});

const POINT_ITEM_CATEGORY_SCHEMA = new Schema({
    name: MONGO_REQUIRED_STRING,
    recognitionComponent: MONGO_REQUIRED_STRING,
    pointItemCollections: {
        type: [POINT_ITEM_COLLECTION_SCHEMA],
        required: true,
    },
});


// Recognition Program Schema
export const recognitionProgramSchema = new Schema<IRecognitionProgram>(
    {
        name: MONGO_REQUIRED_STRING,
        pointConfiguration: {
            type: [POINT_ITEM_CATEGORY_SCHEMA],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const recognitionProgramModel =
    (models[RECOGNITION_PROGRAMS_TABLE_NAME] as Model<IRecognitionProgram, {}, {}, {}, any>) ||
    model<IRecognitionProgram>(RECOGNITION_PROGRAMS_TABLE_NAME, recognitionProgramSchema);

export type RecognitionProgramDoc = Document<unknown, any, IRecognitionProgram> &
    IRecognitionProgram &
    Required<{ _id: Types.ObjectId }>;

