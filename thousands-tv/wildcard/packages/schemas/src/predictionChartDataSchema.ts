import { IPredictionChartData } from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    InferSchemaType,
} from "mongoose";

export const PREDICTION_CHART_DATA_TABLE_NAME = "prediction-chart-data";

const predictionChartDataSchema = new Schema<IPredictionChartData>(
    {
        rallyPredictionId: {
            type: Schema.Types.ObjectId,
            ref: "rally-predictions",
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    {
        timeseries: {
            timeField: 'timestamp',
            metaField: 'rallyPredictionId',
            granularity: 'seconds'
        },
        collection: PREDICTION_CHART_DATA_TABLE_NAME
    }
);

predictionChartDataSchema.index({ rallyPredictionId: 1, timestamp: 1 });

export const predictionChartDataModel =
    (models[PREDICTION_CHART_DATA_TABLE_NAME] as Model<any, {}, {}, {}, any>) ||
    model(PREDICTION_CHART_DATA_TABLE_NAME, predictionChartDataSchema);

export type PredictionChartDataDoc = Document<unknown, any, any> & {
    _id: Types.ObjectId;
} & {
    rallyPredictionId: Types.ObjectId;
    timestamp: Date;
    price: number;
};

export type PredictionChartDataInsert = InferSchemaType<
    typeof predictionChartDataSchema
>;
