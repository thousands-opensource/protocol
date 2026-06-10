import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { updateOneUserDB, UserDoc } from "@repo/schemas";
import { authorize } from "../../middleware/authorization";
import { getPubnubSecretKey } from "@/utils/environmentUtilWCA";
import { getPubnubInstance } from "@/utils/backend/pubnubUtil";
import { getUserProviderPicture } from "@/utils/userUtil";
import IEventService from "../../../../services/interfaces/iEventService";
import { diContainer } from "../../../../inversify.config";
import { getActivePfpUrl } from "@repo/utils";
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";
import { DISPLAY_NAME_CHAR_LIMIT_MAX, DISPLAY_NAME_CHAR_LIMIT_MIN } from "@/constants";

async function generalSettings(req: NextApiRequest, res: NextApiResponse) {
    const { _id } = req.query;

    try {
        await connectToDb();

        if (req.method === "PATCH") {
            const {
                name,
                email,
                timezone,
                emailVerified,
                displayName,
                beamableGamertagId,
            } = req.body;

            const _name = (name || displayName) ?? "";

            // Assume that basicInformation is nested and part of the profile in the schema
            const updateData = {
                "preferences.displayName": _name,
                "preferences.timezone": timezone,
                email,
                "beamableProvider.isVerified": emailVerified,
            };

            console.log("generalSettings - _id3", _id);


            if (
                _name.length < DISPLAY_NAME_CHAR_LIMIT_MIN ||
                _name.length > DISPLAY_NAME_CHAR_LIMIT_MAX
            ) {
                res.status(400).json({
                    message: `Display name must be between ${DISPLAY_NAME_CHAR_LIMIT_MIN} and ${DISPLAY_NAME_CHAR_LIMIT_MAX} characters.`,
                });
                console.log("generalSettings - _id", _id);
                return;
            }

            console.log('updateData', updateData);

            const user: UserDoc | null = await updateOneUserDB(
                { _id },
                updateData
            );

            // handles updating the pubnub user metadata
            try {
                if (user) {
                    // Invalidate User Session Cache give db update
                    if (user._id) {
                        console.log(
                            `Invalidating user session for user [${user._id}]`
                        );
                        await removeUserSession(user._id.toString());
                    }

                    const secretKey = getPubnubSecretKey();
                    const pubnub = getPubnubInstance(
                        user._id.toString(),
                        secretKey
                    );

                    //If the walletProvider imageUrl is empty, we cannot send this to PubNub, so use the default provider image
                    let pfpImageUrl = getActivePfpUrl(user);
                    if (pfpImageUrl === "") {
                        pfpImageUrl = getUserProviderPicture(user);
                    }

                    // @todo - finalize the req body variable to set for username
                    const result = await pubnub.objects.setUUIDMetadata({
                        data: {
                            name: name || displayName,
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

            const eventService: IEventService =
                diContainer.get("IEventService");

            //Update the display name in Beamable if we have a Beamable account
            if (beamableGamertagId && beamableGamertagId !== "") {
                eventService.setUserName(
                    beamableGamertagId,
                    name || displayName
                );
            }

            res.json(user);
        } else {
            res.status(405).json({
                message: `Method ${req.method} Not Allowed`,
            });
        }
    } catch (error: any) {
        console.error("Error -", error);
        res.status(500).json({
            status: "Internal Server Error",
            error: "Error handling user",
            message: error.message,
        });
    }
}

export default authorize(generalSettings);
