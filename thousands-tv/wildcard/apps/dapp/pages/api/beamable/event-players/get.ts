import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken } from "@/backend/common";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { authorize } from "@/pages/api/middleware/authorization";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

async function getEventPlayers(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { objectId } = req.query; // Get objectId from query parameters

    try {
        const accessToken = await getAdminAccessToken();

        const url = `${BEAM_API_URL}/object/event-players/${objectId}`;

        const response = await axios.get(url, {
            headers: {
                accept: "application/json",
                "X-DE-SCOPE": BEAM_SCOPE,
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error retrieving event players",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default authorize(getEventPlayers);
