import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { paginateQuery } from "@/db/utils/paginateQuery";
import { notificationsModel } from "@repo/schemas";
import { INotificationResponses } from "@/types";
import { authorize } from "@/pages/api/middleware/authorization";
import { IUser } from "@repo/interfaces";
import { sanitizeInput } from "@/utils/backend/apiUtil";

/**
 * Handles the retrieval of notifications for a user with pagination.
 * @dev - only admin users can access this endpoint. The user ID is required.
 *
 * @param {NextApiRequest} req - The API request object.
 * @param {NextApiResponse} res - The API response object.
 * @param {IUser} user - The authenticated user object.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 *
 */
async function handleGetNotifications(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
): Promise<void> {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const sanitizedBody = sanitizeInput(req.body);
    const { userId, page = "1", limit = "10" } = sanitizedBody;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const authUserId = user?._id;

    if (authUserId !== userId) {
        return res.status(403).json({
            message: "Unauthorized action: User mismatch",
        });
    }

    try {
        await connectToDb();

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;

        const query = { recipientUserId: userId, isDeleted: false };
        const paginationResult = await paginateQuery(
            notificationsModel,
            query,
            { page: pageNum, limit: limitNum }
        );

        // Sort notifications with the most recent first
        const sortedNotifications = paginationResult.data.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        // Return the paginated and sorted notifications
        const notificationResponsePaginated: INotificationResponses = {
            success: true,
            data: sortedNotifications,
            pagination: {
                totalItems: paginationResult.totalItems,
                currentPage: paginationResult.currentPage,
                totalPages: paginationResult.totalPages,
                itemsPerPage: limitNum,
            },
            message: "Notifications retrieved successfully.",
        };

        return res.status(200).json(notificationResponsePaginated);
    } catch (error: any) {
        return res.status(500).json({
            status: "Internal Server Error",
            error: "Error retrieving notifications",
            message: error.message,
        });
    }
}

export default authorize(handleGetNotifications);
