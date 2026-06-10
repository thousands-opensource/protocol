import { NextApiRequest, NextApiResponse } from "next";
import { AccountStatus, IUser, UserRole } from "@repo/interfaces";
import { updateOneUserDB, UserDoc, usersModel } from "@repo/schemas";
import { FilterQuery, UpdateQuery } from "mongoose";
import { WildcardAccountsApiResponse } from "@/types";
import { authorize } from "../middleware/authorization";

/**
 * Unsuspends a user by clearing the suspension flags and restoring the user's account status and roles.
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function unsuspendUserHandler(
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

    console.log("Reversing suspension for userId:", userId);
    try {
        const user = await usersModel.findById(userId);
        if (!user || user?._id?.toString() !== userId) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status !== AccountStatus.SUSPENDED) {
            return res.status(400).json({ message: "User is not suspended" });
        }

        const updatedUser = await unsuspendUser(userId?.toString());
        if (!updatedUser) {
            return res
                .status(500)
                .json({ success: false, message: "Failed to unsuspend user" });
        }

        const infoMsg = `User ${userId} has been unsuspended and set to active status.`;
        const data: WildcardAccountsApiResponse = {
            success: true,
            message: infoMsg,
            data: updatedUser,
        };
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error unsuspending user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default authorize(unsuspendUserHandler);

/**
 * Unsuspend a user by clearing the suspension flags and restoring the user's account status and roles.
 * @param userId - The ID of the user to unsuspend.
 * @returns A promise that resolves to the updated user document.
 */
export async function unsuspendUser(userId: string): Promise<UserDoc | null> {
    const query: FilterQuery<IUser> = { _id: userId };
    const update: UpdateQuery<IUser> = {
        $set: {
            isSuspended: false,
            suspendedUntil: null,
            status: AccountStatus.ACTIVE,
            roles: [UserRole.SPECTATOR],
        },
    };

    try {
        const updatedUser = await updateOneUserDB(query, update);
        return updatedUser;
    } catch (error) {
        console.error("Error unsuspending user:", error);
        throw new Error("Failed to unsuspend user");
    }
}
