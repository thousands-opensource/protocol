import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { getAdminAccessToken } from "@/backend/common";
import { authorize } from "../middleware/authorization";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

async function searchUserQueryHandler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        res.status(405).json({ message: "Method Not Allowed" });
        return;
    }

    const { email } = req.query;

    if (!email) {
        res.status(400).json({ message: "Email query parameter is required" });
        return;
    }

    try {
        const accessToken = await getAdminAccessToken();
        const response = await axios.get(
            `${BEAM_API_URL}/basic/accounts/search`,
            {
                params: { query: email, page: 1, pagesize: 1 },
                headers: {
                    accept: "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json(response.data);
    } catch (error: any) {
        console.error("Error searching user:", error);
        res.status(500).json({
            status: "Internal Server Error",
            message: "Failed to search user",
            details: error.message,
        });
    }
}

export default authorize(searchUserQueryHandler);
