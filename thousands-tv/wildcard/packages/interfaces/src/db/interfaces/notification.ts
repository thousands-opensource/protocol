import { Types } from "mongoose";

// Enum for Notification Status
export enum NotificationStatusEnum {
    SENT = "sent",
    FAILED = "failed",
    PENDING = "pending",
}

// Enum for Notification Priority
export enum NotificationPriorityEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

// Interface for Notification
export interface INotification {
    _id?: string;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;

    recipientUserId: Types.ObjectId; // Reference to User Object

    subject: string;
    body: string;
    status?: NotificationStatusEnum;

    sentAt?: Date;
    priority?: NotificationPriorityEnum;

    isRead: boolean;
    readAt?: Date;

    isDeleted?: boolean;
}
