import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
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

async function fetchAccounts(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const accessToken = req.headers.authorization; // Assuming the token is sent in the Authorization header by the client

    try {
        const response = await axios.get(`${BEAM_API_URL}/basic/accounts/me`, {
            headers: {
                accept: "application/json",
                "X-DE-SCOPE": BEAM_SCOPE,
                Authorization: accessToken,
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
                : "Error fetching user information",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default authorize(fetchAccounts);
