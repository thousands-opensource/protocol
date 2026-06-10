import { NextApiRequest, NextApiResponse } from "next";
import { doesUserExistInEvent, updateOneEvent } from "@repo/schemas";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import IEventService from "@/services/interfaces/iEventService";
import { diContainer } from "@/inversify.config";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { findOneUserByQuery } from "@repo/schemas";
import { authorize } from "@/pages/api/middleware/authorization";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await updatePlayerScore(req);
        sendApiResponse(res, war);
    } catch (error: any) {
        sendApiResponseWithStatusCode(res, {
            success: false,
            err: error.response
                ? error.response.data.error
                : "Error updating player score",
        });
    }
}

async function updatePlayerScore(req: NextApiRequest) {
    const { objectId } = req.query; // Get objectId from query parameters
    const { vendorEventId, score, increment, userId } = req.body; // Get data from request body

    console.log("vendorEventId", vendorEventId);

    if (!objectId || !vendorEventId || !userId) {
        return { success: false, err: "Invalid event body" };
    }

    const isUserRegistered = await doesUserExistInEvent({
        beamableEventId: vendorEventId,
        users: userId,
    });

    if (isUserRegistered) {
        return {
            success: false,
            err: "User has registered to the match",
        };
    }

    //Get our IEventService from the DI Container
    const beamableEventService: IEventService =
        diContainer.get("IEventService");

    const user: IUser | null = await findOneUserByQuery({ _id: userId });
    const beamableProviderAccount = getBeamableAccountByUserDB(user);
    if (!beamableProviderAccount) {
        return {
            success: false,
            err: "User does not have beamable account",
        };
    }

    const query = { beamableEventId: vendorEventId };
    const update = { $addToSet: { users: userId } };

    const newEvent = await updateOneEvent(query, update);

    return { success: true, data: newEvent };
}

export default authorize(handler);
