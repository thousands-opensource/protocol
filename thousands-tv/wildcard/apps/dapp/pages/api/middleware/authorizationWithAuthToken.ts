import { WildcardApiResponse } from "@repo/interfaces";
import { sendApiResponseWithStatusCode } from "@/utils/backend/apiUtil";
import { getAuthBearerTokenGameClient } from "@/utils/environmentUtil";
import { NextApiRequest, NextApiResponse } from "next";

const AUTH_BEARER_TOKEN = getAuthBearerTokenGameClient();

/**
 * Middleware to authorize with token for game client requests used specifically for game client requests.
 * @dev - This middleware is used for fetching user info by the game client. i.e FetchFanDetails
 * @param handler - NextApiRequest handler
 */
export const authorizeWithAuthToken = (
    handler: (req: NextApiRequest, res: NextApiResponse, user?: any) => void
) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            const allHeaders = JSON.stringify(req.headers);
            const authHeader = req.headers.authorization || "";
            const token = authHeader.split(" ")[1]; // Bearer <token>
            const xApiKey = req.headers["x-api-key"];

            if (!token && !xApiKey) {
                const errorResp: WildcardApiResponse = {
                    success: false,
                    err: "Missing authorization token: " + allHeaders,
                };
                return sendApiResponseWithStatusCode(res, errorResp, 403);
            }

            if (token !== AUTH_BEARER_TOKEN && xApiKey !== AUTH_BEARER_TOKEN) {
                const errorResp: WildcardApiResponse = {
                    success: false,
                    err: "Invalid Auth Bearer token",
                };
                return sendApiResponseWithStatusCode(res, errorResp, 403);
            }

            // Call the API route handler
            return handler(req, res);
        } catch (e) {
            console.log("Error in authorization middleware: ", e);
            // Return unauthorized if token is invalid or expired
            const errorResp: WildcardApiResponse = {
                success: false,
                err: "Unauthorized",
            };
            return res.status(401).json(errorResp);
        }
    };
};
