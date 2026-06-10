import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { diContainer } from "@/inversify.config";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import { IUser } from "@repo/interfaces";
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";

type UpdatePayoutMethodBody = {
    payoutMethod?: "USD" | "USDC";
};

async function updatePayoutMethod(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    const { payoutMethod } = req.body as UpdatePayoutMethodBody;
    if (payoutMethod !== "USD" && payoutMethod !== "USDC") {
        return res.status(400).json({
            success: false,
            message: "payoutMethod must be USD or USDC",
        });
    }

    const userId = user?._id?.toString();
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User not found in session",
        });
    }

    const userRepository =
        diContainer.get<IUserRepository>("IUserRepository");

    const success = await userRepository.updatePayoutMethod(
        userId,
        payoutMethod
    );

    if (!success) {
        return res.status(500).json({
            success: false,
            message: "Failed to update payout method",
        });
    }

    await removeUserSession(userId);

    return res.status(200).json({ success: true });
}

export default authorize(updatePayoutMethod);
