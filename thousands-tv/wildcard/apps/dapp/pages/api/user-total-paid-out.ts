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
        const war: WildcardApiResponse = await handleGetUserTotalPaidOut(user);
        sendApiResponse(res, war);
    } catch (error: any) {
        console.error("Error fetching user total paid out:", error);
        sendApiResponse(res, {
            success: false,
            err: error.message || "Internal server error",
        });
    }
}

async function handleGetUserTotalPaidOut(user: IUser): Promise<WildcardApiResponse> {
    if (!user._id) {
        return {
            success: false,
            err: "User ID not found",
        };
    }

    try {
        const payouts = await ProtocolPayoutRepository.findByUserId(user._id);

        const totalPaidOut = payouts.reduce((sum, payout) => {
            return sum + (payout.payoutAmount || 0);
        }, 0);

        return {
            success: true,
            data: {
                totalPaidOut
            },
        };
    } catch (error: any) {
        console.error("Error calculating total paid out:", error);
        return {
            success: false,
            err: error.message || "Failed to calculate total paid out",
        };
    }
}

export default authorize(handler);
