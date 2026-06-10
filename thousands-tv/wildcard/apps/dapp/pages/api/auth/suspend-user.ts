import { NextApiRequest, NextApiResponse } from "next";
import { AccountStatus, IUser } from "@repo/interfaces";
import { updateOneUserDB, UserDoc, usersModel } from "@repo/schemas";
import { FilterQuery, UpdateQuery } from "mongoose";
import { WildcardAccountsApiResponse } from "@/types";
import { authorize } from "../middleware/authorization";

/**
 * Suspends a user by setting the `isSuspended` flag, `suspendedUntil` date, updating the user's account status, and removing all roles.
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function suspendUserHandler(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const userId = user._id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await usersModel.findById(userId);
        if (!user || user?._id?.toString() !== userId) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status === AccountStatus.SUSPENDED) {
            return res
                .status(400)
                .json({ message: "User is already suspended" });
        }

        // suspend for 100 years
        const suspendedUntil = new Date();
        suspendedUntil.setFullYear(suspendedUntil.getFullYear() + 100);

        const updatedUser = await suspendUser(
            userId?.toString(),
            suspendedUntil
        );
        if (!updatedUser) {
            return res
                .status(500)
                .json({ success: false, message: "Failed to suspend user" });
        }

        const infoMsg = `User ${userId} is being suspended until ${suspendedUntil}`;
        const data: WildcardAccountsApiResponse = {
            success: true,
            message: infoMsg,
            data: updatedUser,
        };
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error suspending user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default authorize(suspendUserHandler);

/**
 * Suspends a user by setting the `isSuspended` flag, `suspendedUntil` date, updating the user's account status, and removing all roles.
 * @param userId - The ID of the user to suspend.
 * @param suspendedUntil - The date until the user is suspended. If not provided, the user is suspended indefinitely.
 * @returns A promise that resolves to the updated user document.
 */
export async function suspendUser(
    userId: string,
    suspendedUntil?: Date
): Promise<UserDoc | null> {
    const query: FilterQuery<IUser> = { _id: userId };
    const update: UpdateQuery<IUser> = {
        $set: {
            isSuspended: true,
            suspendedUntil: suspendedUntil || null,
            status: AccountStatus.SUSPENDED,
        },
        $unset: { roles: 1 },
    };

    try {
        const updatedUser = await updateOneUserDB(query, update);
        return updatedUser;
    } catch (error) {
        console.error("Error suspending user:", error);
        throw new Error("Failed to suspend user");
    }
}
