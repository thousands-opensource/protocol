import connectToDb from "@/db/connectToDb";
import { updateOneUserDB } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import { WildcardApiResponse } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { FilterQuery, UpdateQuery } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await updateAvatarThemeColor(
            req,
            user
        );
        sendApiResponse(res, war);
    } catch (e: any) {
        const errMsg = `Error unable to select theme color`;
        console.error(errMsg, e);
        sendApiResponse(res, {
            success: false,
            err: `${errMsg} ${e.message}`,
        });
    }
}
/**
 * Update avatar theme color of user
 * @param req - request data via API Route
 * @returns updated user mongo doc
 */
async function updateAvatarThemeColor(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const { avatarThemeColor } = req.body;
    if (!avatarThemeColor) {
        const errMsg = "Invalid update avatar theme color body";
        console.error(errMsg);
        return {
            success: false,
            err: errMsg,
        };
    }

    if (!user || !user._id) {
        const errMsg = "User not found to update avatar theme color";
        console.error(errMsg);
        return {
            success: false,
            err: errMsg,
        };
    }

    const query: FilterQuery<IUser> = {
        _id: user?._id,
    };

    const update: UpdateQuery<IUser> = {
        $set: { "preferences.avatarThemeColor": avatarThemeColor },
    };

    const updatedUser = await updateOneUserDB(query, update);

    return {
        success: true,
        data: updatedUser,
    };
}

export default authorize(handler);
