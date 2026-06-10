import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { authorize } from "@/pages/api/middleware/authorization";
import { findOneAndUpdateNotification } from "@repo/schemas";
import { sanitizeInput } from "@/utils/backend/apiUtil";

/**
 * Handles updating the read status of a notification.
 * @dev - only admin and the user are allowed to access this endpoint.
 *
 * @param {NextApiRequest} req - The API request object.
 * @param {NextApiResponse} res - The API response object.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 */
async function handleUpdateNotificationReadStatus(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const sanitizedBody = sanitizeInput(req.body);
    const { notificationId, isRead } = sanitizedBody;

    if (!notificationId || typeof isRead !== "boolean") {
        return res.status(400).json({
            message: "Notification ID and isRead status are required",
        });
    }

    try {
        await connectToDb();

        const notification = await findOneAndUpdateNotification(
            { _id: notificationId },
            { isRead, readAt: isRead ? new Date() : null }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({
            success: true,
            data: notification,
            message: `Notification marked as ${isRead ? "read" : "unread"}`,
        });
    } catch (error: any) {
        return res.status(500).json({
            status: "Internal Server Error",
            error: "Error updating notification read status",
            message: error.message,
        });
    }
}

export default authorize(handleUpdateNotificationReadStatus);
