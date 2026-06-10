import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { getIvsIdleGamePlatformApiKey, getIvsIdleGamePlayerActionUrl } from "../../utils/environmentUtilWCA";
import { UserDoc } from "@repo/schemas";
import { authorize } from "./middleware/authorization";

async function handler(req: NextApiRequest, res: NextApiResponse,
    user: UserDoc) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const {
            streamId,
            eventId,
            vendorEventId,
            userId,
            userName,
            chatActionGuid,
            command,
            pfpUrl,
            walletAddress,
            ticketTier,
        } = req.body;
        if (
            !streamId ||
            !eventId ||
            !vendorEventId ||
            !userId ||
            !userName ||
            !command
        ) {
            console.error("Invalid send command body");
            sendApiResponse(res, {
                success: false,
                err: `Invalid send command body`,
            });
            return;
        }

        //Make sure userId matches
        if (userId != user._id) {
            console.error("UserId doesn't match");
            sendApiResponse(res, {
                success: false,
                err: `UserId doesn't match`,
            });
            return;
        }

        //Make sure primary walletAddress matches
        if (walletAddress != user.walletProvider?.address) {
            console.error("walletAddress doesn't match");
            sendApiResponse(res, {
                success: false,
                err: `walletAddress doesn't match`,
            });
            return;
        }

        const additionalWalletAddresses = user.walletProvider?.additionalWallets;

        const war: WildcardApiResponse = await sendCommand(
            streamId,
            eventId,
            vendorEventId,
            userId,
            userName,
            command,
            chatActionGuid,
            pfpUrl,
            walletAddress,
            ticketTier,
            additionalWalletAddresses,
        );
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error sending an action", e);
        sendApiResponse(res, {
            success: false,
            err: `Error sending an event ${e.message}`,
        });
    }
}

async function sendCommand(
    streamId: string,
    eventId: string,
    vendorEventId: string,
    userId: string,
    userName: string,
    command: string,
    chatActionGuid: string,
    pfpUrl?: string,
    walletAddress?: string,
    ticketTier?: string,
    additionalWalletAddresses?: string[],
) {
    const ivsIdleGamePlayerActionUrl = getIvsIdleGamePlayerActionUrl();
    const ivsIdleGamePlatformApiKey = getIvsIdleGamePlatformApiKey();

    const { data } = await axios.post(
        ivsIdleGamePlayerActionUrl,
        {
            StreamId: streamId,
            EventId: eventId,
            VendorEventId: vendorEventId,
            UserId: userId,
            UserName: userName,
            Command: command,
            ChatActionGuid: chatActionGuid,
            PfpUrl: pfpUrl,
            WalletAddress: walletAddress,
            TicketTier: ticketTier,
            AdditionalWalletAddresses: additionalWalletAddresses,
        },
        {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ivsIdleGamePlatformApiKey,
            },
        }
    );
    return { success: true, data: data };
}

export default authorize(handler);
