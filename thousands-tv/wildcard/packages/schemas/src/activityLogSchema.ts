import {
    ActivityLog,
    MONGO_REQUIRED_DATE,
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
} from "mongoose";

const ACTIVITY_LOG = "activityLog";

// mongo schema
const activityLogSchema = new Schema<ActivityLog>({
    userId: MONGO_REQUIRED_STRING,
    time: MONGO_REQUIRED_DATE,
    type: MONGO_REQUIRED_STRING,
    data: MONGO_REQUIRED_STRING, // JSON string
});

activityLogSchema.set(TIMESTAMPS, true);

const activityLogModel =
    (models[ACTIVITY_LOG] as Model<ActivityLog, {}, {}, {}, any>) ||
    model<ActivityLog>(ACTIVITY_LOG, activityLogSchema);

export type ActivityLogDoc = Document<unknown, any, ActivityLog> &
    ActivityLog &
    Required<{ _id: Types.ObjectId }>;

export async function createActivityLogEntryDB(activityLog: ActivityLog) {
    return await activityLogModel.create(activityLog);
}

export async function findActivityLogEntriesByQuery(
    query: FilterQuery<ActivityLog>
): Promise<ActivityLog[]> {
    return await activityLogModel.find(query).sort({ time: -1 });
}
