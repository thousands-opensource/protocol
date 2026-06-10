import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { authorize } from "@/pages/api/middleware/authorization";
import { countNotifications } from "@repo/schemas";
import { IUser } from "@repo/interfaces";

/**
 * Handles the retrieval of the count of unread notifications.
 * @dev - only admin and the user are allowed to access this endpoint.
 *
 * @param {NextApiRequest} req - The API request object.
 * @param {NextApiResponse} res - The API response object.
 * @param {IUser} user - The authenticated user object.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 */
async function handleGetUnreadNotificationsCount(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
): Promise<void> {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const userId = user?._id?.toString();

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        await connectToDb();

        const count = await countNotifications({
            recipientUserId: userId,
            isDeleted: false,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            count,
            message: "Unread notifications count retrieved successfully.",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: "Internal Server Error",
            error: "Error retrieving unread notifications count",
            message: error.message,
        });
    }
}

export default authorize(handleGetUnreadNotificationsCount);
