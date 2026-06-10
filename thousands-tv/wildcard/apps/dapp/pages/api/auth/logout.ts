import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import {
    COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
    COOKIES_ACCESS_TOKEN_WILDCARD,
    COOKIES_EMAIL,
    COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
    COOKIES_IS_LINKING_OUTH_WALLET,
    COOKIES_IS_LOGIN,
    COOKIES_IS_SIGN_UP,
} from "@/utils/accountAPIUtil";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        return;
    }

    try {
        // Define a helper function to serialize and clear cookies
        const clearCookie = (name: string) =>
            serialize(name, "", {
                expires: new Date(0), // Set to expire immediately
                path: "/",
            });

        // Clear all cookies
        const cookiesToClear = [
            COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
            COOKIES_ACCESS_TOKEN_WILDCARD,
            COOKIES_EMAIL,
            COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
            COOKIES_IS_LINKING_OUTH_WALLET,
            COOKIES_IS_LOGIN,
            COOKIES_IS_SIGN_UP,
        ].map(clearCookie);

        // Set the cookie in the response header
        res.setHeader("Set-Cookie", cookiesToClear);

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
        console.error("Error during logout", error);
        res.status(500).json({
            error: `Error during logout: ${error.message}`,
        });
    }
}
