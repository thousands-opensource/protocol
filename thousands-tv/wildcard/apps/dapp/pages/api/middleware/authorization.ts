import { NextApiRequest, NextApiResponse } from "next";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { verifyToken } from "@/utils/accountsUtil";
import {
    clearNextAuthSessionTokenCookie,
    clearWildcardAccountsCookie,
    getUserByProviderId,
} from "@/utils/backend/accountsBackendUtil";
import { UserRole } from "@repo/interfaces";

/**
 * Middleware to verify the access token and authorize the user.
 * @param handler The next handler function to execute if authorized.
 */
export const authorize =
    (handler: any, userRoles?: UserRole[]) =>
    async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            // Backwards compatibility for API calls made from the server side
            const authHeader = req.headers.authorization;
            let wildcardAccessToken = authHeader?.split(" ")[1];

            // If made from the client side, the token is in the cookies
            if (!wildcardAccessToken) {
                wildcardAccessToken =
                    req.cookies[COOKIES_ACCESS_TOKEN_WILDCARD];
            }

            if (!wildcardAccessToken) {
                console.warn("No token provided in authorization layer.");
                return res
                    .status(401)
                    .json({ success: false, message: "No token provided." });
            }

            const { valid, decodedToken, error } =
                verifyToken(wildcardAccessToken);

            if (!valid || !decodedToken) {
                console.warn(
                    "Invalid or no token found during authorization."
                );

                clearNextAuthSessionTokenCookie(res);
                clearWildcardAccountsCookie(res);

                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token.",
                });
            }

            const { id } = decodedToken;

            //@todo - add additional role base validation

            const user = await getUserByProviderId(id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found or token mismatch.",
                });
            }

            // Additional checks or updates can go here...

            // if user roles provided, make sure user has at least one of the provided roles
            if (userRoles && userRoles.length > 0) {
                if (!userRoles.some((role) => user.roles.includes(role))) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "User does not have permission to access this resource.",
                    });
                }
            }

            // Proceed with the original handler if everything is okay
            return handler(req, res, user);
        } catch (error: any) {
            console.error("Error in authorization middleware:", error);
            return res.status(500).json({
                message: "Internal Server Error",
                error: error?.toString(),
            });
        }
    };
