import { IUserRallyPrediction, MONGO_REQUIRED_STRING } from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    InferSchemaType,
} from "mongoose";

export const USER_RALLY_PREDICTIONS_TABLE_NAME = "user-rally-predictions";

const userRallyPredictionsSchema = new Schema<IUserRallyPrediction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rallyPredictionId: {
            type: Schema.Types.ObjectId,
            ref: "rally-predictions",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        forOrAgainst: {
            type: Boolean,
            required: true,
        },
        questionText: MONGO_REQUIRED_STRING,
        selectedOptionText: MONGO_REQUIRED_STRING,
        selectedOptionColor: MONGO_REQUIRED_STRING,
    },
    {
        timestamps: true, // Automatically handles createdAt and updatedAt
    }
);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const userRallyPredictionsModel =
    (models[USER_RALLY_PREDICTIONS_TABLE_NAME] as Model<
        any,
        {},
        {},
        {},
        any
    >) || model(USER_RALLY_PREDICTIONS_TABLE_NAME, userRallyPredictionsSchema);

export type UserRallyPredictionDoc = Document<unknown, any, any> & {
    _id: Types.ObjectId;
} & {
    userId: Types.ObjectId;
    rallyPredictionId: Types.ObjectId;
    amount: number;
    price: number;
    forOrAgainst: boolean;
    questionText: string;
    selectedOptionText: string;
    selectedOptionTextColor: string;
};

export type UserRallyPredictionInsert = InferSchemaType<
    typeof userRallyPredictionsSchema
>;
