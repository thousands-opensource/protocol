//@ts-nocheck
import { findOneUserByQuery } from "@repo/schemas";
import { NextApiRequest, NextApiResponse } from "next";
import speakeasy from "speakeasy";
import { updateMFAStepCompleted } from "./update-mfa-step-completed";
import { serialize } from "cookie";
import {
    COOKIES_IS_OTP_SESSION_VALID,
    COOKIES_IS_OTP_SESSION_VALID_EXPIRY_SECONDS,
} from "@/utils/accountAPIUtil";
import { API_RESPONSE_STATUS_CODE_404_MESSAGE } from "@/utils/backend/apiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { email, token } = req.body;

    try {
        // Get the user's secret from the database
        const user = await findOneUserByQuery({ email });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const secret = user?.authenticator?.appSecretKey;

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

        // validate mfa session for a specific time
        const update = await updateMFAStepCompleted({ email }, true);

        if (!update) {
            res.status(404).json({
                message:
                    "User not found - unable to update MFA step completed status",
            });
            return;
        }

        const serializeOTPSessionValid = serialize(
            COOKIES_IS_OTP_SESSION_VALID,
            "true",
            {
                maxAge: COOKIES_IS_OTP_SESSION_VALID_EXPIRY_SECONDS,
                path: "/",
            }
        );

        // Set the cookie in the response header
        res.setHeader("Set-Cookie", [serializeOTPSessionValid]);

        console.log(`MFA step time session updated successfully for ${email}`);

        if (verified) {
            res.json({
                success: true,
                message: "MFA TOTP successfully validated",
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid TOTP" });
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
