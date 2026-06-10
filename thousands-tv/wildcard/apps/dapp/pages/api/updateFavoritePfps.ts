import connectToDb from "@/db/connectToDb";
import { updateOneUserDB } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import { WildcardApiResponse } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { FilterQuery, UpdateQuery } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import {
    MAX_FAVORITE_PFPS,
    TOO_MANY_FAVORITES_ERR,
} from "@/constants/constants";

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
        const war: WildcardApiResponse = await updateFavoritePfps(req, user);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to update favorite pfps", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to update favorite pfps ${e.message}`,
        });
    }
}

async function updateFavoritePfps(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const { pfps } = req.body;
    if (!pfps) {
        const err = "Invalid update favorite pfps body";
        console.error(err);
        return {
            success: false,
            err,
        };
    }

    if (!user || !user._id) {
        const errMsg = "User not found to update favorite pfps";
        console.error(errMsg);
        return {
            success: false,
            err: errMsg,
        };
    }

    let update: UpdateQuery<IUser> = {
        $set: { "walletProvider.favoritePfps": pfps },
    };
    if ((user?.walletProvider?.favoritePfps?.length || 0) > MAX_FAVORITE_PFPS) {
        console.error(TOO_MANY_FAVORITES_ERR);
        return {
            success: false,
            err: TOO_MANY_FAVORITES_ERR,
        };
    }

    const query: FilterQuery<IUser> = {
        _id: user?._id,
    };
    const updatedUser = await updateOneUserDB(query, update);

    return {
        success: true,
        data: updatedUser,
    };
}

export default authorize(handler);
