import { NextApiRequest, NextApiResponse } from "next";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { FilterQuery, UpdateQuery } from "mongoose";
import { getWebAppName } from "@/utils/environmentUtilWCA";
import { IUser } from "@repo/interfaces";
import { searchAllProviderIdQuery } from "@/utils/backend/accountsBackendUtil";
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
        // Generate a secret for the user
        const secret = speakeasy.generateSecret({ length: 20 });

        // Generate a QR code for the user
        const otpauth_url = speakeasy.otpauthURL({
            secret: secret.ascii,
            label: getWebAppName(),
            issuer: getWebAppName(),
            encoding: "ascii",
        });

        const qr_code = await qrcode.toDataURL(otpauth_url);

        const mongoQuery = searchAllProviderIdQuery(connectedUserDBProviderId);
        await updateUserAuthenticatorSecretKey(mongoQuery, secret.ascii);

        // Respond with the QR code
        res.json({ qr_code });
    } catch (error: any) {
        res.status(500).json({
            status: "Internal Server Error",
            service: "N/A",
            error: "Error generating TOTP secret and QR code",
            message: error.message,
        });
    }
}

export default handler;

/**
 * Update user's authenticator app secret key in DB
 * @param {string} query - mongo query to find user to update
 * @param {string} secretKey - new secret key to set
 */
export async function updateUserAuthenticatorSecretKey(
    query: FilterQuery<IUser>,
    secretKey: string
) {
    const update: UpdateQuery<IUser> = {
        $set: {
            "authenticator.appSecretKey": secretKey,
        },
    };

    return await updateOneUserDB(query, update);
}
