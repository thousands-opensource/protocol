import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import {
    getPubnubPublishKey,
    getPubnubSecretKey,
    getPubnubSubscribeKey,
} from "@/utils/environmentUtilWCA";
import { getPubnubInstance } from "@/utils/backend/pubnubUtil";
import { ChannelEntity, ChannelList } from "@pubnub/react-chat-components";
import { ObjectCustom } from "pubnub";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";

type RequestBody = {
    eventId: string;
};

type RequestResponse = {
    success: boolean;
    message: string;
    error: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "POST") {
        res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
        return;
    }

    try {
        const { eventId } = req.body;

        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        //Get the event to get the channels list
        const event = await stageRepository.getStage(eventId);

        if (event == null) {
            res.status(500).json({
                success: false,
                message: "Error finding event",
                error: "Error finding event",
            });
            return;
        }

        await stageRepository.updateEventSetStatus(eventId, "live");

        //Initialize PubNub
        const secretKey = getPubnubSecretKey();
        const pubnub = getPubnubInstance("system", secretKey);

        const channels: ChannelEntity[] = event.channels.map((channel) => {
            return {
                id: `g.${eventId}.${channel._id}`,
                name: channel.name,
                custom: {
                    profileUrl: `/images/${channel.src}.svg`,
                } as ObjectCustom,
            } as ChannelEntity;
        });

        // add message channel but treated as signal to hold more than 64 bytes
        const signalMessageChannel = {
            id: `s.${eventId.toString()}`,
            name: "Signal Messages",
        } as ChannelEntity;

        channels.push(signalMessageChannel);

        //@todo move `setChannelMetadata` and `setMemberships` to create an event/[[...id]] or start event api
        // optimize it by batch all the promises
        for (const channel of channels) {
            await pubnub.objects.setChannelMetadata({
                channel: channel.id,
                data: {
                    name: channel.name as string,
                    description: channel.description as string,
                },
            });
        }

        await pubnub.objects.setChannelMetadata({
            channel: `group.${eventId}.system`,
            data: {
                name: "System",
            },
        });
    } catch (error: any) {
        console.log("error: ", error);
        res.status(500).json({
            success: false,
            message: "Error starting event",
            error: error.message,
        });
    }

    res.status(200).json({
        success: true,
        message: "The event has started",
        error: "",
    });
}

export default authorize(handler);
