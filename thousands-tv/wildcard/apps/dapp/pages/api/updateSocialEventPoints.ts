import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import {
    findPointsByQuery,
    findPointsDefinitionByQuery,
    updateOnePointsDB,
} from "@repo/schemas";
import {
    EventPointType,
    IPoints,
    IUser,
    WildcardApiResponse,
    defaultEventPointsDefinition,
} from "@repo/interfaces";
import { authorize } from "./middleware/authorization";
import { UpdateQuery } from "mongoose";

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
        const { socialEventPointsType } = req.body;
        const war: WildcardApiResponse = await updateSocialEventPointsType(
            socialEventPointsType,
            user
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

export async function updateSocialEventPointsType(
    socialEventPointsType: EventPointType,
    user: IUser
): Promise<WildcardApiResponse> {
    if (!socialEventPointsType) {
        return { success: false, err: "Invalid social event points body" };
    }

    const userId = user._id?.toString();
    const points: IPoints | null = await findPointsByQuery({ userId });
    const eventPoints = points?.eventPoints ? points.eventPoints : [];
    let hasEvent = eventPoints.some(
        (eventPoint) => eventPoint.eventId === socialEventPointsType
    );

    if (hasEvent) {
        return {
            success: false,
            err: `User has already completed event: ${socialEventPointsType} and recorded it in event points`,
        };
    }
    const socialEventPointsDef = await findPointsDefinitionByQuery({
        pointsId: socialEventPointsType,
    });
    const socialEventPointValue: number = socialEventPointsDef?.pointValue
        ? socialEventPointsDef.pointValue
        : defaultEventPointsDefinition[socialEventPointsType];

    if (!socialEventPointValue) {
        return {
            success: false,
            err: `There are no points valid for ${socialEventPointsType}`,
        };
    }

    const userPointsUpdateQuery = {
        userId,
    };
    let userPointsUpdate: UpdateQuery<IPoints> = {
        userId,
        $push: {
            eventPoints: {
                eventId: socialEventPointsType,
                points: socialEventPointValue,
            },
        },
    };

    const updatedPoints = await updateOnePointsDB(
        userPointsUpdateQuery,
        userPointsUpdate
    );

    return { success: true, data: updatedPoints };
}

export default authorize(handler);
