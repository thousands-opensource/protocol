import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
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
 * Endpoint to register a new user account with Beamable
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
    const password = uuidv4().substring(0, 15);

    try {
        const accessToken = await getGuestAccessToken();

        console.log(`Creating a new beamable account for ${email}`);

        const response = await axios.post(
            `${BEAM_API_URL}/basic/accounts/register`,
            { email, password },
            {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

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

        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error registering user",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default handler;
