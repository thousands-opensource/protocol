//@ts-nocheck
import { NextApiRequest, NextApiResponse } from "next";
import speakeasy from "speakeasy";
import { FilterQuery, UpdateQuery } from "mongoose";
import { findOneUserByQuery, updateOneUserDB } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import { searchAllProviderIdQuery } from "@/utils/backend/accountsBackendUtil";
import { API_RESPONSE_STATUS_CODE_404_MESSAGE } from "@/utils/backend/apiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { connectedUserDBProviderId, token } = req.body;

    try {
        // Get the user's secret from the database
        const mongoQuery = searchAllProviderIdQuery(connectedUserDBProviderId);
        const userDB = await findOneUserByQuery(mongoQuery);

        if (!userDB) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const secret = userDB?.authenticator?.appSecretKey;

        if (!secret) {
            res.status(404).json({ message: "User has not set up 2FA" });
            return;
        }

        // Verify the TOTP
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: "ascii",
            token: token,
        });

        const updateVerified = await updateUserAuthenticatorEnabled(
            mongoQuery,
            verified
        );

        if (!updateVerified) {
            res.status(404).json({
                message: "User not found - unable to update 2FA status",
            });
            return;
        }

        if (verified) {
            res.json({ status: "success", message: "Successfully signed in" });
        } else {
            res.status(400).json({ status: "error", message: "Invalid TOTP" });
        }
    } catch (error: any) {
        res.status(500).json({
            status: "Internal Server Error",
            service: "N/A",
            error: "Error verifying TOTP",
            message: error.message,
        });
    }
}

export default handler;

/**
 * Update user's authenticator app enabled status in DB
 * @param {FilterQuery<IUser>} query - mongo query to find user to update
 * @param {boolean} isEnabled - new enabled status to set
 */
export async function updateUserAuthenticatorEnabled(
    query: FilterQuery<IUser>,
    isEnabled: boolean
) {
    const update: UpdateQuery<IUser> = {
        $set: {
            "authenticator.appEnabled": isEnabled,
        },
    };

    return await updateOneUserDB(query, update);
}
