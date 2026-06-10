import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken } from "@/backend/common";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { API_RESPONSE_STATUS_CODE_404_MESSAGE } from "@/utils/backend/apiUtil";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

async function updateAccounts(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "PUT") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { body } = req; // Data to update, e.g., { email: "newemail@example.com", ... }

    try {
        const accessToken = await getAdminAccessToken();

        const response = await axios.put(
            `${BEAM_API_URL}/basic/accounts/me`,
            body,
            {
                headers: {
                    accept: "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
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
                : "Error updating user information",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default updateAccounts;
