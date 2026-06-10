import { IUser } from "@repo/interfaces";
import { searchAllProviderIdQuery } from "@/utils/backend/accountsBackendUtil";
import { FilterQuery, UpdateQuery } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { updateOneUserDB } from "@repo/schemas";
import { API_RESPONSE_STATUS_CODE_404_MESSAGE } from "@/utils/backend/apiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { connectedUserDBProviderId } = req.body;

    try {
        // Disconnect the user's authenticator app

        const mongoQuery = searchAllProviderIdQuery(connectedUserDBProviderId);
        await disconnectUserAuthenticator(mongoQuery);

        // Respond with a success message
        res.json({
            success: true,

            message: "Authenticator app disconnected successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message ?? "Error disconnecting TOTP",
        });
    }
}

export default handler;

/**
 * Disconnect user's authenticator app in DB
 * @param {FilterQuery<IUser>} query - mongo query to find user to update
 */
export async function disconnectUserAuthenticator(query: FilterQuery<IUser>) {
    const update: UpdateQuery<IUser> = {
        $set: {
            "authenticator.appSecretKey": null,
            "authenticator.appEnabled": false,
        },
    };

    return await updateOneUserDB(query, update);
}
