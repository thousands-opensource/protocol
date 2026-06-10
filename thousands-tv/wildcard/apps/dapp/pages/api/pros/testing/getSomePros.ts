import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import { diContainer } from "@/inversify.config";
import IProRepository from "@/repositories/interfaces/IProRepository";
import { IUser } from "@repo/interfaces";
import { prosDefinition } from "@/constants/prosDefinition";

const PROS_TO_CREATE = 5;

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
        const userId = user?._id;
        if (!userId) {
            return res.status(401).json({
                message: "User is not authorized.",
            });
        }

        const proRepository = diContainer.get<IProRepository>(
            "IProRepository"
        );

        const newPros = Array.from({ length: PROS_TO_CREATE }).map(() => {
            const template =
                prosDefinition[
                    Math.floor(Math.random() * prosDefinition.length)
                ];
            const rarity = Math.floor(Math.random() * 6) + 1;
            return {
                proTemplateId: template.id,
                rarity,
                status: "Earning",
                userId,
            };
        });

        await Promise.all(
            newPros.map((pro) => proRepository.createPro(pro))
        );

        return res.status(200).json({
            message: "Pros created successfully",
            count: newPros.length,
        });
    } catch (error: any) {
        console.error("getSomePros error", error);
        return res.status(500).json({
            message: "Failed to create pros.",
            error: error?.message || "Unknown error",
        });
    }
}

export default authorize(handler);
