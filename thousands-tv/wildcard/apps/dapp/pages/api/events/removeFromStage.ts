import { NextApiRequest, NextApiResponse } from "next";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import { diContainer } from "@/inversify.config";
import { UserRole } from "@repo/interfaces";
import PubNub from "pubnub";
import {
    getPubnubPublishKey,
    getPubnubSecretKey,
    getPubnubSubscribeKey,
} from "@/utils/environmentUtilWCA";
import { getPubnubInstance } from "@/utils/backend/pubnubUtil";

type RequestBody = {
    streamId: string;
    userName: string;
};

type RequestResponse = {
    message: string;
    error: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "POST") {
        res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
        return;
    }

    const { streamId, userName } = req.body;

    const userRepository: IUserRepository = diContainer.get("IUserRepository");

    try {
        //Remove from stage

        //Find the user by display name
        var user = await userRepository.findUserIdFromUserName(userName);
        if (user == null) {
            res.status(500).json({
                message: "userName not found!",
                error: `Couldn't find userName: ${userName}`,
            });
            return;
        }

        const userId: string = user?._id?.toString() ?? "";

        //Remove the role if they have it
        await userRepository.removeRoleFromUser(
            userId,
            UserRole.GUESTBROADCASTER
        );

        //Send remove from stage via PubNub
        const secretKey = getPubnubSecretKey();
        const pubnub = getPubnubInstance("SystemInvite", secretKey);

        const removeFromStageMessage: string = `removefromstage|${userName}`;

        var publishConfig = {
            channel: "Default",
            message: removeFromStageMessage,
        };

        pubnub.signal(publishConfig, function (status, response) {
            // Publish message to current channel.
            // console.log(status, response);
        });

        pubnub.stop();
    } catch (error: any) {
        res.status(500).json({
            message: "Error ending event",
            error: error.message,
        });
    }

    res.status(200).json({
        message: "",
        error: "",
    });
}
