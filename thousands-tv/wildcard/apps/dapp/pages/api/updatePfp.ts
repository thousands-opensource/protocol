import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";

import { IUser, PfpMetadata, WildcardApiResponse } from "@repo/interfaces";

import { updatePfp } from "@/utils/backend/accountsBackendUtil";
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";

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
        const war: WildcardApiResponse = await handleUpdatePfp(req, user);

        if (user._id) {
            // Invalidate User Session Cache
            console.log(`Invalidating user session for user [${user._id}]`);
            await removeUserSession(user._id.toString());
        }

        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to save pfp src", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to save pfp src ${e.message}`,
        });
    }
}

/**
 * Handles the update PFP request
 * @param req - The request object
 * @param user - The user object
 * @returns - The result of the API call
 */
async function handleUpdatePfp(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const pfp: PfpMetadata = req.body.pfp;
    if (!pfp) {
        const err = "Invalid pfp metadata";
        console.error(err);
        return {
            success: false,
            err,
        };
    }

    return await updatePfp(pfp, user);
}

export default authorize(handler);
