import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import connectToDb from "@/db/connectToDb";
import { prosTestModel, proModel, proActionModel } from "@repo/schemas";
import { IUser } from "@repo/interfaces";

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

    try {
        await connectToDb();

        if (!user?._id) {
            return res.status(401).json({
                message: "Unauthorized: No user ID found.",
            });
        }

        let doc = await prosTestModel.findOne({ userId: user._id });
        if (!doc) {
            doc = new prosTestModel({
                userId: user._id,
                currentOffset: 1,
            });
        } else {
            doc.currentOffset = doc.currentOffset + 1;
        }
        await doc.save();

        const pros = await proModel.find({ userId: user._id }).lean();
        if (pros.length > 0) {
            const randomPro =
                pros[Math.floor(Math.random() * pros.length)];

            const proActions = await proActionModel
                .find({ proId: randomPro._id })
                .sort({ currentLevel: -1 })
                .limit(1)
                .lean();
            const highestLevel = proActions[0]?.currentLevel || 0;
            const currentLevel = highestLevel + 1;

            const createdAt = new Date(
                Date.now() + doc.currentOffset * 24 * 60 * 60 * 1000
            );

            await proActionModel.create({
                proId: randomPro._id,
                actionTypeId: 2,
                currentLevel,
                amount: Math.floor(Math.random() * (2000 - 100 + 1)) + 100,
                userId: randomPro.userId,
                createdAt,
                updatedAt: createdAt,
            });
        }

        return res.status(200).json({
            message: "Advanced day successfully",
            currentOffset: doc.currentOffset,
        });
    } catch (error: any) {
        console.error("advanceDay error", error);
        return res.status(500).json({
            message: "Failed to advance day.",
            error: error?.message || "Unknown error",
        });
    }
}

export default authorize(handler);
