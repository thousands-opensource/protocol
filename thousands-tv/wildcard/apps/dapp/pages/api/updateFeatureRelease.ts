import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { updateOneUserDB } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { authorize } from "./middleware/authorization";
import { FilterQuery, UpdateQuery } from "mongoose";
import { FEATURE_RELEASE } from "@/constants/constants";

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

        if (!user || !user._id) {
            const errMsg = "User not found to update feature release";
            console.error(errMsg);
            return {
                success: false,
                err: errMsg,
            };
        }

        const update: UpdateQuery<IUser> = {
            latestFeatureRelease: FEATURE_RELEASE,
        };

        const query: FilterQuery<IUser> = {
            _id: user?._id,
        };
        const updatedUser = await updateOneUserDB(query, update);
        sendApiResponse(res, {
            success: true,
            data: { updatedUser },
        });
    } catch (e: any) {
        console.error("Error updating feature release", e);
        sendApiResponse(res, {
            success: false,
            err: `"Error updating feature release" ${e.message}`,
        });
    }
}

export default authorize(handler);
