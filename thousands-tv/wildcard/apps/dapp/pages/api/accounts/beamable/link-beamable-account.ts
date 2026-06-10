import { NextApiRequest, NextApiResponse } from "next";
import { IUser } from "@repo/interfaces";
import { WildcardAccountsApiResponse } from "@/types";
import { linkBeamableAccountOnRegistrationOrSignUp } from "@/utils/backend/accountsBackendUtil";
import { authorize } from "../../middleware/authorization";

/**
 * API route to link Beamable account on registration or sign up
 * (Create a new beamable account if one does not exist)
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { connectedUserDBProviderId, email } = req.body;

    if (!connectedUserDBProviderId) {
        console.error("No connectedUserDBProviderId found in request body");
        return res.status(400).json({ message: "Bad request" });
    }

    // some validation checks here
    if (!email) {
        console.error("No email found in request body");
        return res.status(400).json({ message: "Bad request" });
    }

    console.log("Linking Beamable account on registration or sign up");

    try {
        const result: WildcardAccountsApiResponse =
            await linkBeamableAccountOnRegistrationOrSignUp(
                user,
                connectedUserDBProviderId,
                email
            );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Error linking Beamable account:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default authorize(handler);
