import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken } from "@/backend/common";
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

    const { from, to, query, limit } = req.query;

    const fromString = req.query.from as string;
    const toString = req.query.to as string;
    const queryString = req.query.query as string;
    const limitString = req.query.limit as string;

    try {
        const accessToken = await getAdminAccessToken();

        let url = `${BEAM_API_URL}/basic/events/calendar`;
        let params = [];
        if (from) params.push(`from=${encodeURIComponent(fromString)}`);
        if (to) params.push(`to=${encodeURIComponent(toString)}`);
        if (query) params.push(`query=${encodeURIComponent(queryString)}`);
        if (limit) params.push(`limit=${encodeURIComponent(limitString)}`);
        if (params.length) url += "?" + params.join("&");

        const response = await axios.get(url, {
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "X-DE-SCOPE": BEAM_SCOPE,
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
                : "Error getting calendar data",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default authorize(handler);
