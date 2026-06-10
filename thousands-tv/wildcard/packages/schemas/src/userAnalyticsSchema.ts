import { TIMESTAMPS } from "@repo/interfaces";
import { Schema, model, Model, models, Types } from "mongoose";

const USER_ANALYTICS = "user-analytics";

/**
 * User analytics schema for tracking user related analytics
 * @dev if user is signed in track discordId, else track track ipAddress
 */
const userAnalyticsSchema = new Schema<IUserAnalytics>({
    discordId: String,
    userId: String,
    ipAddress: String,
});

userAnalyticsSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const userAnalyticsModel =
    (models[USER_ANALYTICS] as Model<IUserAnalytics, {}, {}, {}, any>) ||
    model<IUserAnalytics>(USER_ANALYTICS, userAnalyticsSchema);

export interface IUserAnalytics {
    // user related analytics
    discordId?: string; // discordId of the user
    userId?: string;
    ipAddress: string; // list of timestamps of user's last login activity

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

/**
 * Update a user analytics log in DB or create a new log if it doesn't exist
 * @param analytics  - the analytics object to create the query for
 * @returns loggedUserDoc - the updated mongodb response of the user's latest login activity
 */
export async function createUserLoginAnalyticsDB(analytics: IUserAnalytics) {
    return await userAnalyticsModel.create({
        userId: analytics.userId,
        ipAddress: analytics.ipAddress,
    });
}
