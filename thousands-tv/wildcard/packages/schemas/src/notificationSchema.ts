import {
    INotification,
    NotificationPriorityEnum,
    NotificationStatusEnum,
    USERS,
} from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    UpdateWithAggregationPipeline,
    UpdateQuery,
    QueryOptions,
} from "mongoose";
const NOTIFICATIONS = "notifications";

// Notification Schema
const notificationSchema = new Schema<INotification>(
    {
        recipientUserId: {
            type: Schema.Types.ObjectId,
            ref: USERS,
            required: true,
        },
        subject: { type: String, required: true },
        body: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
        status: {
            type: String,
            enum: Object.values(NotificationStatusEnum),
            default: NotificationStatusEnum.PENDING,
        },
        isDeleted: { type: Boolean, default: false },
        sentAt: { type: Date },
        priority: {
            type: String,
            enum: Object.values(NotificationPriorityEnum),
            default: NotificationPriorityEnum.MEDIUM,
        },
    },
    { timestamps: true }
);

// Indexes for Performance
notificationSchema.index({ recipientUserId: 1, isRead: 1 });

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const notificationsModel =
    models.notifications ||
    model<INotification>(NOTIFICATIONS, notificationSchema);

export type NotificationDoc = Document<unknown, any, INotification> &
    INotification &
    Required<{ _id: Types.ObjectId }>;

/**
 * Counts the number of notification documents that match the provided query.
 * @param query - The MongoDB query used to fetch notifications.
 * @returns A promise that resolves to the number of matching documents.
 */
export async function countNotifications(
    query: FilterQuery<INotification>
): Promise<number> {
    return await notificationsModel.countDocuments(query);
}

/**
 * Creates a new notification document in the database.
 * @param notificationData - The notification object to create.
 * @returns A promise that resolves to the created notification document.
 */
export async function createNotification(
    notificationData: INotification
): Promise<NotificationDoc> {
    const newNotification = new notificationsModel(notificationData);
    return await newNotification.save();
}

/**
 * Finds a single notification document based on the provided query.
 * @param query - The MongoDB query used to fetch the notification.
 * @returns A promise that resolves to the found notification document or null if none found.
 */
export async function findNotificationByQuery(
    query: FilterQuery<INotification>
): Promise<NotificationDoc | null> {
    return await notificationsModel.findOne(query);
}

/**
 * Finds and updates a single notification document based on the provided query.
 * @param query - The MongoDB query used to find the notification to update.
 * @param update - The object defining the update to make.
 * @param options - Additional query options for the update operation.
 * @returns A promise that resolves to the updated notification document or null if none found.
 */
export async function findOneAndUpdateNotification(
    query: FilterQuery<INotification>,
    update: UpdateQuery<INotification>,
    options?: QueryOptions<INotification>
): Promise<NotificationDoc | null> {
    return await notificationsModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
        ...options,
    });
}
