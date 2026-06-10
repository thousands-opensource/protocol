import { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { authorize } from "../middleware/authorization";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { userSponsoredEventModel } from "@repo/schemas";
import { IUser } from "@repo/interfaces";

type ClaimRequestPayload = {
    userSponsoredEventId?: string;
};

function parsePayload(body: unknown): ClaimRequestPayload {
    if (!body) {
        return {};
    }

    const parsed =
        typeof body === "string" ? (JSON.parse(body) as unknown) : body;
    if (typeof parsed !== "object" || !parsed) {
        return {};
    }

    const payload = parsed as ClaimRequestPayload;
    return {
        userSponsoredEventId:
            typeof payload.userSponsoredEventId === "string"
                ? payload.userSponsoredEventId
                : undefined,
    };
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} not allowed`,
        });
    }

    let userSponsoredEventId: string | undefined;

    try {
        const payload = parsePayload(req.body);
        userSponsoredEventId = payload.userSponsoredEventId;
    } catch (error) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid request payload.",
        });
    }

    if (!userSponsoredEventId || !Types.ObjectId.isValid(userSponsoredEventId)) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid userSponsoredEventId.",
        });
    }

    try {
        await connectToDb();

        const record = await userSponsoredEventModel
            .findOne({
                _id: new Types.ObjectId(userSponsoredEventId),
                userId: user._id,
                claimedOn: null,
                paidOn: null,
            })
            .populate({
                path: "sponsoredEventId",
                select: "startTime",
            })
            .lean();

        if (!record) {
            return sendApiResponse(res, {
                success: false,
                err: "Sponsorship not found for this user.",
            });
        }

        const sponsoredEvent =
            (record as { sponsoredEventId?: unknown })?.sponsoredEventId as
                | { startTime?: Date }
                | null;
        const startTime = sponsoredEvent?.startTime
            ? new Date(sponsoredEvent.startTime)
            : null;

        if (!startTime || Number.isNaN(startTime.getTime())) {
            return sendApiResponse(res, {
                success: false,
                err: "Sponsorship start time unavailable.",
            });
        }

        const claimDelayMs = 14 * 24 * 60 * 60 * 1000;
        if (Date.now() < startTime.getTime() + claimDelayMs) {
            return sendApiResponse(res, {
                success: false,
                err: "Sponsorship rewards are not available yet.",
            });
        }

        const claimedOn = new Date();
        const updated = await userSponsoredEventModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(userSponsoredEventId),
                userId: user._id,
                claimedOn: null,
                paidOn: null,
            },
            { $set: { claimedOn } },
            { new: true }
        );

        if (!updated) {
            return sendApiResponse(res, {
                success: false,
                err: "Sponsorship not found for this user.",
            });
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                userSponsoredEventId: updated._id?.toString(),
                claimedOn: updated.claimedOn ?? claimedOn,
            },
        });
    } catch (error) {
        console.error("Failed to claim sponsorship", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to claim sponsorship.",
        });
    }
}

export default authorize(handler);
