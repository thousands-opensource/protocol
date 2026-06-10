import mongoose, {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    connection,
} from "mongoose";
import {
    IMetric,
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

export const METRICS_TABLE_NAME = "metrics";

// The timeseries option in a Mongoose schema is a declarative hint, not the execution command itself
export const metricsSchema = new Schema<IMetric>(
    {
        timestamp: MONGO_REQUIRED_DATE,
        key: MONGO_REQUIRED_STRING,
        value: MONGO_REQUIRED_NUMBER,
        category: MONGO_REQUIRED_STRING, // kos, damageDone, damageReceived, summonKos, goalieKos, etc...
    },
    {
        timeseries: {
            timeField: "timestamp",
            metaField: "key",
            granularity: "hours",
        },
        collection: METRICS_TABLE_NAME,
    }
);

metricsSchema.set(TIMESTAMPS, true);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const metricsModel =
    (models[METRICS_TABLE_NAME] as Model<IMetric, {}, {}, {}, any>) ||
    model<IMetric>(METRICS_TABLE_NAME, metricsSchema);

export type MetricDoc = Document<unknown, any, IMetric> &
    IMetric &
    Required<{ _id: Types.ObjectId }>;

// todo: testing only
export async function dropMetricCollection() {
    try {
        await metricsModel.collection.drop();
        console.log(`Collection '${METRICS_TABLE_NAME}' dropped successfully.`);
    } catch (error) {
        if (error.code === 26) {
            console.log(
                `Collection '${METRICS_TABLE_NAME}' does not exist, skipping drop.`
            );
        } else {
            console.error("Error dropping collection:", error);
        }
    }
}
