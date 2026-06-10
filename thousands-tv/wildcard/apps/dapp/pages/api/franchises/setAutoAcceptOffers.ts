import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { usersModel } from "@repo/schemas";
import { diContainer } from "@/inversify.config";
import IUserSessionCacheRepository from "@/repositories/interfaces/IUserSessionCacheRepository";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
    }

    const { autoAcceptOffers } = req.body as {
        autoAcceptOffers?: boolean;
    };

    if (typeof autoAcceptOffers !== "boolean") {
        return sendApiResponse(res, {
            success: false,
            err: "Missing or invalid autoAcceptOffers value",
        });
    }

    try {
        await connectToDb();
        const userId = user?._id?.toString();
        if (!userId) {
            return sendApiResponse(res, {
                success: false,
                err: "User not found",
            });
        }

        await usersModel.findByIdAndUpdate(
            userId,
            { autoAcceptOffers },
            { new: false }
        );
        const userSessionCacheRepository =
            diContainer.get<IUserSessionCacheRepository>(
                "IUserSessionCacheRepository"
            );
        await userSessionCacheRepository.removeUserSession(userId);

        return sendApiResponse(res, {
            success: true,
            data: { autoAcceptOffers },
        });
    } catch (error) {
        console.error("Failed to update auto-accept offers", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to update auto-accept offers",
        });
    }
}

export default authorize(handler);
