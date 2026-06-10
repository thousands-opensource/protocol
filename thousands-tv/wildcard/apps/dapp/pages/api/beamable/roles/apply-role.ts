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

async function updateAccountRole(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "PUT") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { role, objectId } = req.body; // Get data from request body

    try {
        const accessToken = await getAdminAccessToken();

        const url = `${BEAM_API_URL}/object/accounts/${objectId}/role`;
        const response = await axios.put(
            `${url}`,
            { cid: BEAM_CID, realm: "Wildcard-Dev", role },
            {
                headers: {
                    accept: "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log("response.data", response, response.data);
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error updating account role",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default updateAccountRole;
