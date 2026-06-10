import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import ProtocolPayoutRepository from "@/repositories/implementations/mongodb/protocolPayoutRepository";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        return sendApiResponse(res, {
            success: false,
            err: "Method not allowed",
        });
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleGetUserPayouts(user);
        sendApiResponse(res, war);
    } catch (error: any) {
        console.error("Error fetching user payouts:", error);
        sendApiResponse(res, {
            success: false,
            err: error.message || "Internal server error",
        });
    }
}

async function handleGetUserPayouts(user: IUser): Promise<WildcardApiResponse> {
    if (!user._id) {
        return {
            success: false,
            err: "User ID not found",
        };
    }

    const payouts = await ProtocolPayoutRepository.findByUserId(user._id);

    return {
        success: true,
        data: payouts,
    };
}

export default authorize(handler);
