import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import { diContainer } from "@/inversify.config";
import IProRepository from "@/repositories/interfaces/IProRepository";
import { IProsTest, IUser } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import { prosTestModel } from "@repo/schemas";

interface UpgradeProBody {
    proId?: string;
    startingLevel?: number;
}

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

    const { proId, startingLevel }: UpgradeProBody = req.body || {};

    if (!proId || typeof startingLevel !== "number") {
        return res.status(400).json({
            message: "Missing or invalid parameters: proId, startingLevel.",
        });
    }

    try {
        const userIdStr = user?._id?.toString();
        if (!userIdStr) {
            return res.status(401).json({
                message: "Unauthorized: No user ID found.",
            });
        }

        const proRepository = diContainer.get<IProRepository>(
            "IProRepository"
        );

        const pro = await proRepository.getProByProId(proId);

        if (!pro) {
            return res.status(400).json({
                message: "Invalid proId. Pro not found.",
            });
        }

        if (pro.userId?.toString() !== userIdStr) {
            return res.status(403).json({
                message: "Unauthorized to upgrade this pro.",
            });
        }

        const proActions = await proRepository.getProActionsByProId(proId);
        const highestLevel = proActions.filter(x => x.actionTypeId === 1).reduce(
            (max, action) => Math.max(max, action.currentLevel || 0),
            0
        );
        const currentLevel = highestLevel + 1;

        if (currentLevel !== startingLevel) {
            return res.status(400).json({
                message:
                    "Pro level mismatch. Please refresh and try again.",
            });
        }

        await connectToDb();
        const prosTestDoc = await prosTestModel
            .findOne({ userId: user._id })
            .lean<IProsTest | null>();

        const now =
            Date.now() +
            (prosTestDoc?.currentOffset || 0) * 24 * 60 * 60 * 1000;

        const computedPros = await proRepository.calculateProsWithEarnings(
            userIdStr,
            now
        );
        const totalEarnings = computedPros.reduce(
            (sum, entry) => sum + entry.earnings,
            0
        );
        const upgradeCost = currentLevel * 100;

        if (totalEarnings < upgradeCost) {
            return res.status(400).json({
                message: "Not enough earnings",
            });
        }

        await proRepository.createProAction({
            proId: pro._id!,
            actionTypeId: 1,
            currentLevel,
            amount: upgradeCost,
            userId: pro.userId,
            createdAt: new Date(now),
        });

        return res.status(200).json({
            message: "Pro action recorded successfully.",
        });
    } catch (error: any) {
        console.error("upgradePro error:", error);
        return res.status(500).json({
            message: "Failed to upgrade pro.",
            error: error?.message || "Unknown error",
        });
    }
}

export default authorize(handler);
