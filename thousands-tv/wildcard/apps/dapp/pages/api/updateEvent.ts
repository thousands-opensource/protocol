import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import {
    doesUserExistInEvent,
    updateOneEvent,
    findOneUserByQuery,
} from "@repo/schemas";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";

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
            beamableEventId,
            userId,
        }: { beamableEventId: string; userId: string } = req.body;
        const war: WildcardApiResponse = await updateEvent(
            beamableEventId,
            userId
        );
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error updating an event", e);
        sendApiResponse(res, {
            success: false,
            err: `Error updating an event ${e.message}`,
        });
    }
}

async function updateEvent(
    beamableEventId: string,
    userId: string
): Promise<WildcardApiResponse> {
    if (!beamableEventId || !userId) {
        return { success: false, err: "Invalid event body" };
    }

    const isUserRegistered = await doesUserExistInEvent({
        beamableEventId,
        users: userId,
    });

    if (isUserRegistered) {
        return {
            success: false,
            err: "User is already registered to the match",
        };
    }

    const user: IUser | null = await findOneUserByQuery({ _id: userId });
    const beamableProviderAccount = getBeamableAccountByUserDB(user);
    if (!beamableProviderAccount) {
        return {
            success: false,
            err: "User does not have beamable account",
        };
    }

    const query = { beamableEventId };
    const update = { $addToSet: { users: userId } };
    const newEvent = await updateOneEvent(query, update);
    return { success: true, data: newEvent };
}

export default authorize(handler);
