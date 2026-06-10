import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { authorize } from "@/pages/api/middleware/authorization";
import { findNotificationByQuery } from "@repo/schemas";
import { sanitizeInput } from "@/utils/backend/apiUtil";

/**
 * Handles marking a notification as deleted.
 * @dev - only admin and the user are allowed to access this endpoint.
 *
 * @param {NextApiRequest} req - The API request object.
 * @param {NextApiResponse} res - The API response object.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 */
async function handleDeleteNotification(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const sanitizedBody = sanitizeInput(req.body);
    const { notificationId } = sanitizedBody;

    if (!notificationId) {
        return res.status(400).json({ message: "Notification ID is required" });
    }

    try {
        await connectToDb();

        const notification = await findNotificationByQuery({
            _id: notificationId,
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.isDeleted = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            data: notification,
            message: "Notification marked as deleted",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: "Internal Server Error",
            error: "Error marking notification as deleted",
            message: error.message,
        });
    }
}

export default authorize(handleDeleteNotification);
