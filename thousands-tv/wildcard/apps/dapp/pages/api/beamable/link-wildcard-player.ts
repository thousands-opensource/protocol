import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { authorize } from "../middleware/authorization";
import { diContainer } from "@/inversify.config";
import IPlayerLinkingRepository from "@/repositories/interfaces/IPlayerLinkingRepository";
import { IUser } from "@repo/interfaces";
import { updateOneUserDB } from "@repo/schemas";
import { beamableMicroserviceApiCall } from "@/utils/backend/timelessApiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { code } = req.body ?? {};

    if (!code || typeof code !== "string") {
        return res.status(400).json({
            success: false,
            message: "Missing or invalid code!",
        });
    }

    try {
        await connectToDb();
        const playerLinkingRepository =
            diContainer.get<IPlayerLinkingRepository>("IPlayerLinkingRepository");

        console.log(code);

        const linkDoc = await playerLinkingRepository.getPlayerByLinkCode(code);

        console.log(linkDoc);

        if (!linkDoc || !linkDoc.gt || !user?._id) {
            return res.status(400).json({ success: false, message: "Invalid or expired code!" });
        }

        const gamerTag = linkDoc.gt.toString();
        const userIdString = user._id.toString();

        //Update the thousands_link_code as used on Beamable
        const request = {
            code,
            gamerTag,
            "thousandId": userIdString
        };

        console.log("REQUEST: ", JSON.stringify(request));

        var beamableResponse = await beamableMicroserviceApiCall("/ConfirmThousandsLink", request);

        if (!beamableResponse)
        {
            console.log(`ERROR: link-wildcard-player - Unable to confirm link in Beamable for code: ${code} and gamerTag: ${gamerTag}`);
            return res.status(400).json({ success: false, error: "Unable to confirm link in Beamable" });
        }

        //Update the user record
        const updateResult = await updateOneUserDB(
            { _id: user._id },
            {
                beamableProvider: {
                    id: gamerTag,
                    name: "",
                    email: "none",
                    isVerified: true,
                },
            }
        );

        if (!updateResult) {
            console.log(`ERROR: link-wildcard-player - Unable to update user: ${userIdString}`);
            return res.status(400).json({ success: false, error: "Unable to update user" });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("linkWildcardPlayer error", error);
        return res.status(500).json({ success: false });
    }
}

export default authorize(handler);
