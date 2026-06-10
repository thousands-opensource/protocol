import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { updateOneUserDB } from "@repo/schemas";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { WildcardApiResponse } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";
import { getUniqueIdentifierToLog } from "@/utils/util";

// TODO: Wrapped in authorize middleware to ensure user is authenticated
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
        const war: WildcardApiResponse = await updateLinkedSocials(req, user);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error updating linked socials privacy settings", e);
        sendApiResponse(res, {
            success: false,
            err: `Error updating linked socials privacy settings ${e.message}`,
        });
    }
}

async function updateLinkedSocials(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const { _id, showLinkedSocials } = req.body;

    // false is a valid value for showLinkedSocials
    if (showLinkedSocials === undefined) {
        return {
            success: false,
            err: "Invalid privacy disabled settings update body",
        };
    }

    if (!_id) {
        return {
            success: false,
            err: "Invalid user ID",
        };
    }

    const identifier = getUniqueIdentifierToLog(user);
    const identifierStr = JSON.stringify(identifier);
    console.log(
        `Updating privacy disabled settings for user '${identifierStr}' to '${showLinkedSocials}'`
    );

    const query = { _id: _id };
    const update = { "preferences.showLinkedSocials": showLinkedSocials };

    // Update user's linked socials privacy setting
    const updatedUser = await updateOneUserDB(query, update);

    const updatedShowLinkedSocials =
        updatedUser?.preferences?.showLinkedSocials;
    if (typeof updatedShowLinkedSocials === "undefined") {
        const err = `Failed to update privacy disabled settings for user '${identifierStr}' to '${showLinkedSocials}'`;
        console.log(err);
        return {
            success: false,
            err,
        };
    }

    const successMsg = `Successfully updated privacy disabled settings to '${showLinkedSocials}' for user ${identifierStr}`;
    console.log(successMsg);
    return {
        success: true,
        data: updatedUser,
    };
}

export default authorize(handler);
