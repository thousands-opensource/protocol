import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken, getGuestAccessToken } from "@/backend/common";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { updateOneUserDB } from "@repo/schemas";
import { FindBeamableUser } from "@/contexts/globalContextAccounts";
import { fetchBeamableUserByEmail } from "@/utils/accountAPIUtil";
import {
    AccountProviderParams,
    handleProviderUserAssociation,
} from "@/utils/backend/accountsBackendUtil";
import { AccountProviderType } from "@repo/interfaces";
import { WildcardAccountsApiResponse } from "@/types";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

/**
 * Update the password for a user account and verify the email.
 * @param req
 * @param res
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { email, code, newPassword } = req.body;

    try {
        const accessToken = await getGuestAccessToken();

        const response = await axios.post(
            `${BEAM_API_URL}/basic/accounts/password-update/confirm`,
            { email, code, newPassword },
            {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        // fetch beamable account by email
        var fetchedBeamableUser: FindBeamableUser | null = null;
        try {
            const accessToken = await getAdminAccessToken();
            const userSearchResponse = await axios.get(
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
            //Take the first match.  Since emails are unique in Beamable, there shouldn't ever be more than one match
            fetchedBeamableUser = userSearchResponse.data.accounts[0];
        } catch (error: any) {
            console.error(`Error searching for user ${email}: `, error);
            res.status(400).json({ message: `Error searching for Beamable user email: ${email} Not Found` });
            return;
        }

        //Make sure we found a Beamable user for the provided email address
        if (!fetchedBeamableUser) {
            console.log("Error fetching Beamable user");
            res.status(400).json({ message: `Beamable user for email: ${email} Not Found` });
            return;
        }

        //
        if (fetchedBeamableUser.gamerTags.length === 0) {
            console.log(
                "Error fetching Beamable user: No gamertag id found for the user"
            );
            res.status(400).json({ message: `Beamable user for email: ${email} found, but without a valid gamer tag.` });
            return;
        }

        // @dev - https://docs.beamable.com/reference/get_basic-accounts-search
        const gamerTagId = fetchedBeamableUser.gamerTags[0]?.gamerTag; // get the first gamer tag id

        // parse into the beamable Account params
        const beamableLinkAccountParams: AccountProviderParams = {
            id: gamerTagId.toString(),
            name: "",
            email: String(fetchedBeamableUser.email),
            providerType: AccountProviderType.BEAMABLE,
        };

        if (!response.data) {
            throw new Error("Error confirming password update");
        }

        // handle linking a beamable account to account user or creating a whole new user with the beamable account linked
        const userDBResponse: WildcardAccountsApiResponse =
            await handleProviderUserAssociation(beamableLinkAccountParams);
        const userDB = userDBResponse.data;

        // here we now update the emailVerified to true (verifying the account)
        const updateUserToVerified = await updateOneUserDB(
            { _id: userDB._id },
            { "beamableProvider.isVerified": true }
        );

        if (!updateUserToVerified) {
            throw new Error(
                `User not found with email: ${email}: unable to update emailVerified`
            );
        }

        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error confirming password update",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default handler;
