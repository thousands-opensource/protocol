import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import jwt from "jsonwebtoken";
import {
    getAccountSystemAdminAccessToken,
    getNextAuthSecret,
} from "@/utils/environmentUtilWCA";
import { UserRole } from "@repo/interfaces";
import { DecodedToken } from "@/utils/accountsUtil";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";

const NEXT_AUTH_SECRET = getNextAuthSecret();
const ADMIN_ACCESS_TOKEN = getAccountSystemAdminAccessToken();

// This function takes a NextApiHandler (the actual API logic) and returns a new handler that includes the middleware logic.
const validateAdminAccessTokenMiddleware =
    (handler: NextApiHandler) =>
    async (req: NextApiRequest, res: NextApiResponse) => {
        // Backwards compatibility for API calls made from the server side
        const authHeader = req.headers.authorization;
        let wildcardAccessToken = authHeader?.split(" ")[1];

        // If made from the client side, the token is in the cookies
        if (!wildcardAccessToken) {
            wildcardAccessToken = req.cookies[COOKIES_ACCESS_TOKEN_WILDCARD];
        }
        if (!wildcardAccessToken) {
            return res.status(401).json({ error: "No token provided" });
        }

        // If the token is the admin access token, proceed to the original handler
        if (wildcardAccessToken === ADMIN_ACCESS_TOKEN) {
            return handler(req, res);
        }

        try {
            // Verify the token
            const decodedToken = jwt.verify(
                wildcardAccessToken,
                NEXT_AUTH_SECRET
            ) as DecodedToken;

            if (
                !decodedToken.roles.some((roles: string) =>
                    Object.values(UserRole).includes(roles as UserRole)
                )
            ) {
                return res.status(403).json({
                    error: "Forbidden you do not have the correct role permissions",
                });
            }
            // Proceed to the original handler
            return handler(req, res);
        } catch (error) {
            return res.status(401).json({ error: "Invalid access token" });
        }
    };

export default validateAdminAccessTokenMiddleware;
