import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import {
    Channel,
    IStage,
    IUser,
    UserRole,
    WildcardApiResponse,
} from "@repo/interfaces";
import { authorize } from "../middleware/authorization";
import { getPubnubSecretKey } from "@/utils/environmentUtilWCA";
import { getPubnubInstance } from "@/utils/backend/pubnubUtil";
import {
    getChannelPermissions,
    setPubnubMembershipsWithRetry,
} from "@/utils/backend/streamUtil";
import { ChannelEntity } from "@pubnub/react-chat-components";
import { GrantTokenPermissions, ObjectCustom } from "pubnub";
import { findOneEventByQuery } from "@repo/schemas";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();

        const {
            channel,
            vendorEventId,
        }: {
            channel: ChannelEntity;
            vendorEventId: string;
        } = req.body;
        if (!channel.id || !channel.name || !vendorEventId) {
            const errMsg = "Invalid body";
            console.error(errMsg);
            sendApiResponse(res, {
                success: false,
                err: errMsg,
            });
            return;
        }

        const stage = await findOneEventByQuery({
            beamableEventId: vendorEventId,
        });

        if (!stage) {
            const errMsg = `Unable to find event: ${vendorEventId}.`;
            console.error(errMsg);
            sendApiResponse(res, {
                success: false,
                err: errMsg,
            });
            return;
        }

        const channels: ChannelEntity[] = stage.channels.map((channel) => {
            return {
                id: `g.${stage._id.toString()}.${channel._id}`,
                name: channel.name,
                custom: {
                    profileUrl: `/images/${channel.src}.svg`,
                } as ObjectCustom,
            } as ChannelEntity;
        });

        // add signal message channel to receive more than 64 bytes
        const signalMessageChannel = {
            id: `s.${stage._id.toString()}`,
            name: "Signal Messages",
        } as ChannelEntity;
        const signalDirectMessageChannel = {
            id: `u.${user?._id?.toString()}`,
            name: "Direct Messages",
        } as ChannelEntity;

        channels.push(
            signalMessageChannel,
            signalDirectMessageChannel,
            channel
        );

        const userId = user?._id!.toString();
        const stageId = stage._id.toString();
        const secretKey = getPubnubSecretKey();
        const pubnub = getPubnubInstance(userId, secretKey);

        // @todo check if channel exist (extra call or keep creating the channel (side effects?))
        // create channel metadata for new channel
        await pubnub.objects.setChannelMetadata({
            channel: channel.id,
            data: {
                name: channel.name as string,
            },
        });

        const channelIds = channels.map((channel) => channel.id);
        const channelPermissions = getChannelPermissions(
            channels,
            stageId,
            user
        );

        const pubnubToken = await pubnub.grantToken({
            ttl: 180,
            authorized_uuid: userId,
            resources: {
                channels: channelPermissions,
                uuids: {
                    [userId]: {
                        update: true,
                        delete: user.roles.includes(UserRole.MODERATOR),
                        get: true,
                    },
                },
            },
            patterns: {
                uuids: {
                    ".*": {
                        get: true,
                    },
                },
                channels: {
                    "PUBNUB_INTERNAL_.*": {
                        read: true,
                        write: true,
                        update: true,
                        join: true,
                        get: true,
                        delete: user.roles.includes(UserRole.MODERATOR),
                    },
                    ".*": {
                        read: true,
                    },
                },
            },
        });

        // adds user to channel retry mechanism for profile metadata discrepancy
        const membershipSuccess = await setPubnubMembershipsWithRetry(
            pubnub,
            userId,
            channelIds,
            user
        );

        // @todo yes or no -> membership failed - get the end user to redo the process after retry?
        if (!membershipSuccess) {
            console.error(
                `Failed to set PubNub memberships for user ${userId}`
            );
            sendApiResponse(res, {
                success: false,
                err: `Failed to set PubNub memberships for user ${userId}`,
            });
            return;
        }

        const war: WildcardApiResponse = {
            success: true,
            data: { pubnubToken, newChannel: channel },
        };
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error creating a channel", JSON.stringify(e, null, 2));
        sendApiResponse(res, {
            success: false,
            err: `Error creating a channel ${e.message}`,
        });
    }
}

export default authorize(handler);
