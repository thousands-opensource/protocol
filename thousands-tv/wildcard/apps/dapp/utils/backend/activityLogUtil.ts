import { ActivityLog, ActivityLogType, IUser } from "@repo/interfaces";
import {
    createActivityLogEntryDB,
    findActivityLogEntriesByQuery,
} from "@repo/schemas";

export async function createActivityLogEntry(
    userId: string | undefined,
    type: ActivityLogType,
    data: string
): Promise<ActivityLog | undefined> {
    if (!userId) {
        console.error(
            `Failed to create activity log entry for user [${userId}], type [${type}]`
        );
        return;
    }

    const date = new Date();
    const activityLog: ActivityLog = {
        userId,
        time: date,
        type,
        data,
    };
    const success = await createActivityLogEntryDB(activityLog);
    if (!success) {
        console.error(
            `Failed to create activity log entry for user [${userId}], type [${type}] at [${date}]`
        );
        return;
    }
    console.log(
        `Created activity log entry for user [${userId}], type [${type}] at [${date}]`
    );

    return activityLog;
}

export async function getSortedUserActivityLogEntries(
    user: IUser | null
): Promise<ActivityLog[]> {
    if (!user?._id) {
        console.error("Failed to get activity log entries for user:", user);
        return [];
    }
    return await findActivityLogEntriesByQuery({ userId: user._id.toString() });
}
