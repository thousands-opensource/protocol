import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken } from "@/backend/common"; // Import your getAdminAccessToken function
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { authorize } from "../middleware/authorization";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { objectId, stats } = req.query;

    try {
        const accessToken = await getAdminAccessToken();

        const response = await axios.get(
            `${BEAM_API_URL}/object/stats/${objectId}/?stats=${stats}`,
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
                : "Error getting stats",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default authorize(handler);
