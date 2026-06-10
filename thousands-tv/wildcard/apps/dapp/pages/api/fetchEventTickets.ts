import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import {
    IFreeTicket,
    IRippedTicket,
    IUser,
    WildcardApiResponse,
} from "@repo/interfaces";
import {
    findFreeTicketsByQuery,
    findRippedTicketsByQuery,
} from "@repo/schemas";
import {
    isConduitEnvironment,
    isLocalEnvironment,
} from "@/utils/environmentUtil";
import { getOwnedEventTickets } from "@/utils/backend/alchemyUtil";
import { getAllAssociatedWalletsForUser } from "@/utils/userUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleFetchEventTickets(user);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to claim free ticket", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to claim free ticket ${e.message}`,
        });
    }
}

async function handleFetchEventTickets(
    user: IUser
): Promise<WildcardApiResponse> {
    console.log(`Fetching event tickets for user ${user._id}`);
    if (!user._id) {
        return {
            success: false,
            err: "User not found",
        };
    }

    const ticketIds: number[] = await getOwnedTicketIds(user);
    console.log(`User ${user._id} owns tickets: ${ticketIds}`);

    return {
        success: true,
        data: ticketIds,
    };
}

async function getOwnedTicketIds(user: IUser): Promise<number[]> {
    let ticketIds: number[] = [];
    if (isLocalEnvironment() || isConduitEnvironment()) {
        const freeTickets: IFreeTicket[] = await findFreeTicketsByQuery({
            owner: user._id,
        });
        freeTickets.forEach((ticket) => {
            if (ticket.ticketId) {
                ticketIds.push(ticket.ticketId);
            }
        });
        const rippedTickets: IRippedTicket[] = await findRippedTicketsByQuery({
            userId: user._id,
        });
        const rippedTicketIds = rippedTickets.map((ticket) => ticket.tokenId);
        // filter out the tickets that have been ripped
        return ticketIds.filter(
            (ticketId) => rippedTicketIds.indexOf(ticketId) === -1
        );
    }

    const wallets = getAllAssociatedWalletsForUser(user);
    for (const wallet of wallets) {
        const ownedTickets = await getOwnedEventTickets(wallet);
        const ownedTicketIds = ownedTickets.map((ticket) =>
            Number(ticket.tokenId)
        );
        ticketIds = ticketIds.concat(ownedTicketIds);
    }

    return ticketIds;
}

export default authorize(handler);
