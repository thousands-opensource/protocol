import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { findOneUserByQuery, updateOneUserDB } from "@repo/schemas";
import { getPubnubSecretKey } from "@/utils/environmentUtilWCA";
import { getPubnubInstance } from "@/utils/backend/pubnubUtil";
import { getUserProviderPicture } from "@/utils/userUtil";
import IEventService from "@/services/interfaces/iEventService";
import { IUser, UserRole } from "@repo/interfaces";
import { DISPLAY_NAME_CHAR_LIMIT_MAX, DISPLAY_NAME_CHAR_LIMIT_MIN } from "@/constants";
import { diContainer } from "@/inversify.config";
import { authorize } from "@/pages/api/middleware/authorization";
import { getActivePfpUrl } from "@repo/utils";

async function setDisplayName(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    //Require POST
    if (req.method !== "POST") {
        res.status(405).json({
            message: `setDisplayName - Method ${req.method} Not Allowed`,
        });
        return;
    }

    const { displayName, userId }: { displayName: string; userId: string } =
        req.body;
    if (!displayName || displayName === "") {
        res.status(400).json({
            message: `setDisplayName - Display name is required!`,
        });
        return;
    }

    if (
        displayName.length < DISPLAY_NAME_CHAR_LIMIT_MIN ||
        displayName.length > DISPLAY_NAME_CHAR_LIMIT_MAX
    ) {
        res.status(400).json({
            message: `setDisplayName - Display name must be between ${DISPLAY_NAME_CHAR_LIMIT_MIN} and ${DISPLAY_NAME_CHAR_LIMIT_MAX} characters.`,
        });
        return;
    }

    if (!userId || userId === "") {
        res.status(400).json({
            message: `setDisplayName - Could not get userId!`,
        });
        return;
    }

    const foundUser = await findOneUserByQuery({ _id: userId });

    if (!foundUser) {
        res.status(400).json({
            message: `setDisplayName - User not found for: ${userId}`,
        });
        return;
    }

    const updateData = {
        "preferences.displayName": displayName,
    };

    connectToDb();
    const eventService: IEventService = diContainer.get("IEventService");

    await updateOneUserDB({ _id: userId }, updateData);

    //Try to update PubNub, but don't fail this request if there is an error
    try {
        if (foundUser) {
            const secretKey = getPubnubSecretKey();
            const pubnub = getPubnubInstance(userId, secretKey);

            //If the walletProvider imageUrl is empty, we cannot send this to PubNub, so use the default provider image
            let pfpImageUrl = getActivePfpUrl(foundUser);
            if (pfpImageUrl === "") {
                pfpImageUrl = getUserProviderPicture(foundUser);
            }

            // @todo - finalize the req body variable to set for username
            const result = await pubnub.objects.setUUIDMetadata({
                data: {
                    name: displayName,
                    profileUrl: pfpImageUrl,
                    custom: {},
                },
            });

            console.log("Setting pubnub user meta data");
        } else {
            console.error("User not found in pubnub database");
        }
    } catch (pubnubError: any) {
        console.error("Error updating Pubnub:", pubnubError);
    }

    //Get the Beamable Gamer Tag from the user is there is one
    const beamableGamertagId = foundUser?.beamableProvider?.id;

    //Update the display name in Beamable if we have a Beamable account
    if (beamableGamertagId && beamableGamertagId !== "") {
        eventService.setUserName(beamableGamertagId, displayName);
    }

    res.json({ success: true });
    return;
}

export default authorize(setDisplayName, [UserRole.ORGANIZER]);
