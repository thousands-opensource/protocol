import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getGuestAccessToken } from "@/backend/common";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

/**
 * Handler for the password rest during account confirmation.
 * When a user creates a beamable account, they are sent a confirmation email (via password reset) to confirm their account.
 * @dev - This endpoint is used to reset a user's password. (given this is for users who are not logged in, we use the guest access token + no authorize middleware)
 * @param req
 * @param res
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { email } = req.body;

    try {
        const accessToken = await getGuestAccessToken();

        const passwordResetResponse = await axios.post(
            `${BEAM_API_URL}/basic/accounts/password-update/init`,
            { email, codeType: "pin" },
            {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json(passwordResetResponse.data);
    } catch (error: any) {
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error resetting password",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default handler;
