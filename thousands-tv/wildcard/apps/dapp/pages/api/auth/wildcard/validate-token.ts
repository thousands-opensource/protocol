import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { getNextAuthSecret } from "@/utils/environmentUtilWCA";
import { DecodedToken } from "@/utils/accountsUtil";

const NEXT_AUTH_SECRET = getNextAuthSecret();

// Debug endpoint helps to validate a wildcard access token
// verifies web3 session token and returns the decoded token
async function verify(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.split(" ")[1];

    if (!sessionToken) {
        return res
            .status(401)
            .json({ error: "Unauthorized no valid token provided" });
    }

    try {
        // Validate the session token
        const decodedToken = jwt.verify(
            sessionToken,
            NEXT_AUTH_SECRET
        ) as DecodedToken;

        return res.status(200).json({
            success: true,
            data: decodedToken,
            message: "Token is valid",
        });
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

export default verify;
