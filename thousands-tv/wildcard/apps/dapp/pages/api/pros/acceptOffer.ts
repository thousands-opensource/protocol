import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import { diContainer } from "@/inversify.config";
import IProRepository from "@/repositories/interfaces/IProRepository";
import { IProsTest, IUser } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import { prosTestModel } from "@repo/schemas";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
    }

    const { proId } = req.body || {};

    if (!proId) {
        return res.status(400).json({
            message: "Missing proId parameter.",
        });
    }

    try {
        await connectToDb();

        const prosTestDoc = await prosTestModel
            .findOne({ userId: user._id })
            .lean<IProsTest | null>();
        const now =
            Date.now() + (prosTestDoc?.currentOffset || 0) * MS_PER_DAY;

        const proRepository = diContainer.get<IProRepository>(
            "IProRepository"
        );

        const pro = await proRepository.getProByProId(proId);
        if (!pro || pro.userId?.toString() !== user._id?.toString()) {
            return res.status(403).json({
                message: "Unauthorized to accept offer for this pro.",
            });
        }

        const proActions = await proRepository.getProActionsByProId(proId);
        const activePayout = proActions.find(
            (action) =>
                action.actionTypeId === 2 &&
                action.createdAt &&
                now - new Date(action.createdAt).getTime() < MS_PER_DAY
        );

        if (!activePayout) {
            return res.status(400).json({
                message: "No active payout offer found for this pro.",
            });
        }

        await proRepository.createProAction({
            proId: activePayout.proId,
            actionTypeId: 3,
            currentLevel: activePayout.currentLevel,
            amount: activePayout.amount,
            userId: activePayout.userId,
            createdAt: new Date(now),
        });

        return res.status(200).json({
            message: "Payout offer accepted.",
        });
    } catch (error: any) {
        console.error("acceptOffer error", error);
        return res.status(500).json({
            message: "Failed to accept offer.",
            error: error?.message || "Unknown error",
        });
    }
}

export default authorize(handler);
