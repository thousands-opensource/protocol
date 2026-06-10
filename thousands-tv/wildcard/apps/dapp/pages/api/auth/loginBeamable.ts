import { authenticateUser } from "@/backend/common";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtil";
import axios from "axios";
import { AccountProviderType } from "@repo/interfaces";
import {
    COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
    COOKIES_ACCESS_TOKEN_WILDCARD,
} from "@/utils/accountAPIUtil";
import {
    handleProviderUserAssociation,
    searchAllProviderIdQuery,
    validateAndCreateWildcardToken,
} from "@/utils/backend/accountsBackendUtil";
import { findOneUserByQuery } from "@repo/schemas";
import connectToDb from "@/db/connectToDb";

/**
 * API handler to log in a user with Beamable credentials.
 * @param req - request object
 * @param res - response object
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { username, password } = req.body;

    try {
        const { accessToken, refreshToken } = await authenticateUser(
            username,
            password
        );

        const accountResponse = await axios.get(
            `${getAPIEndpointRootUrl()}/api/beamable/fetch-account`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        if (!accountResponse.data) {
            res.status(404).json({ message: "Account not found" });
            return;
        }

        const beamableGamertagIdString = accountResponse.data.id?.toString();
        if (!beamableGamertagIdString) {
            res.status(404).json({ message: "Beamable gamertag not found" });
            return;
        }

        await connectToDb();
        // check if the linked accountId (beamableGamertagIdString) is already in the database if not we add
        const mongoQuery = searchAllProviderIdQuery(beamableGamertagIdString);
        const userDB = await findOneUserByQuery(mongoQuery);

        if (!userDB) {
            res.status(404).json({
                message:
                    "Thousands account User not found. Please sign up for a Thousands account first.",
            });
            return;
        }

        // link beamable account: if user has a beamable account but not yet linked to master user record
        //  add the user account to the database
        const linkedAccount = {
            id: beamableGamertagIdString,
            providerType: AccountProviderType.BEAMABLE,
            name: accountResponse.data.name || "",
            email: String(username), // username and email are synonymous
        };

        const user = await handleProviderUserAssociation(linkedAccount);
        if (!user?.success) {
            res.status(404).json({
                message: "User not found / unable to link",
            });
            return;
        }

        const wildcardAccessToken = await validateAndCreateWildcardToken(
            beamableGamertagIdString,
            accessToken,
            AccountProviderType.BEAMABLE
        );

        res.setHeader("Set-Cookie", [
            `${COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE}=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict;`,
            `${COOKIES_ACCESS_TOKEN_WILDCARD}=${wildcardAccessToken}; Path=/; HttpOnly; Secure; SameSite=Strict;`,
        ]);

        res.json({ accessToken, refreshToken, wildcardAccessToken }); // Send the tokens back to the client
    } catch (error: any) {
        console.error("Failed to log in user:", error.message);
        res.status(500).json({
            message:
                "Authentication failed. Please check your credentials and try again.",
        });
    }
}

export default handler;
