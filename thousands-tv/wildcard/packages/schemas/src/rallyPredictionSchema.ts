import { IRallyPrediction, MONGO_REQUIRED_STRING } from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    InferSchemaType,
} from "mongoose";

export const RALLY_PREDICTIONS_TABLE_NAME = "rally-predictions";

const rallyPredictionsSchema = new Schema<IRallyPrediction>(
    {
        title: {
            type: String,
            required: true,
        },
        subTitle: {
            type: String,
            required: true,
        },
        optionAText: {
            type: String,
            required: true,
        },
        optionBText: {
            type: String,
            required: true,
        },
        optionAButtonColor: {
            type: String,
            required: true,
        },
        optionBButtonColor: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        maxCreditSpend: {
            type: Number,
            required: true,
        },
        wcAmount: {
            type: Number,
            required: true,
        },
        imageUrl: {
            type: String,
            required: false,
        },
        resolvedChoice: {
            type: Boolean,
            required: false,
        },
        cmsId: {
            type: String,
            required: true,
            unique: true,
        },
        isVisible: {
            type: Boolean,
            required: false,
            default: true,
        },
        airdropComplete: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    {
        timestamps: true, // Automatically handles createdAt and updatedAt
    }
);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const rallyPredictionsModel =
    (models[RALLY_PREDICTIONS_TABLE_NAME] as Model<any, {}, {}, {}, any>) ||
    model(RALLY_PREDICTIONS_TABLE_NAME, rallyPredictionsSchema);

export type RallyPredictionDoc = Document<unknown, any, any> & {
    _id: Types.ObjectId;
} & {
    title: string;
    subTitle: string;
    optionAText: string;
    optionBText: string;
    optionAButtonColor: string;
    optionBButtonColor: string;
    startDate: Date;
    endDate: Date;
    maxCreditSpend: number;
    wcAmount: number;
    imageUrl?: string;
    resolvedChoice?: Boolean;
    cmsId: string;
    isVisible?: boolean;
};

export type RallyPredictionInsert = InferSchemaType<
    typeof rallyPredictionsSchema
>;
