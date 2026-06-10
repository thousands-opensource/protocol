import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import {
    findOneUserByQuery,
    createNotification,
    NotificationDoc,
} from "@repo/schemas";
import { authorize } from "@/pages/api/middleware/authorization";
import { INotification, IUser } from "@repo/interfaces";
import { sanitizeInput } from "@/utils/backend/apiUtil";

/**
 * Handles the creation of a notification.
 *
 * @param {NextApiRequest} req - The API request object.
 * @param {NextApiResponse} res - The API response object.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 */
async function handleNotification(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    // Ensure the request method is POST
    if (req.method !== "POST") {
        return res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
    }

    // Sanitize input data
    const sanitizedBody = sanitizeInput(req.body);
    const { recipientUserId, subject, body, status, priority, sentAt } =
        sanitizedBody;

    try {
        await connectToDb();

        const recipient = await findOneUserByQuery({ _id: recipientUserId });
        if (!recipient) {
            return res
                .status(404)
                .json({ message: "Recipient user not found" });
        }

        // Create a new notification
        const newNotification: INotification = {
            recipientUserId,
            subject,
            body,
            status,
            priority,
            sentAt,
            isRead: false,
            isDeleted: false,
        };

        const savedNotification: NotificationDoc = await createNotification(
            newNotification
        );
        res.status(201).json(savedNotification);
    } catch (error: any) {
        res.status(500).json({
            status: "Internal Server Error",
            error: "Error creating notification",
            message: error.message,
        });
    }
}

export default authorize(handleNotification);
