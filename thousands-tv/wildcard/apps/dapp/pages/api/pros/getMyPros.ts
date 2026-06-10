import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import { diContainer } from "@/inversify.config";
import IProRepository from "@/repositories/interfaces/IProRepository";
import { IPro, IProsTest, IUser } from "@repo/interfaces";
import { prosDefinition } from "@/constants/prosDefinition";
import connectToDb from "@/db/connectToDb";
import { prosTestModel } from "@repo/schemas";

type ProWithDefinition = IPro & {
    name?: string;
    rarity?: number;
    earnings?: number;
    level?: number;
    trainingEndDateTime?: string | null;
};

type GetMyProsResponse = {
    pros?: ProWithDefinition[];
    currentDateTime?: string;
    message?: string;
    error?: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetMyProsResponse>,
    user: IUser
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const userId = user?._id?.toString();

        if (!userId) {
            return res.status(400).json({
                message: "Unable to determine the logged in user.",
            });
        }

        await connectToDb();
        const prosTestDoc = await prosTestModel
            .findOne({ userId: user._id })
            .lean<IProsTest | null>();

        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const now =
            Date.now() +
            (prosTestDoc?.currentOffset || 0) * 24 * 60 * 60 * 1000;

        const proRepository = diContainer.get<IProRepository>(
            "IProRepository"
        );
        const prosWithComputed = await proRepository.calculateProsWithEarnings(
            userId,
            now
        );

        const prosWithDefinition: ProWithDefinition[] = prosWithComputed.map(
            ({
                pro,
                earnings,
                level,
                status,
                trainingEndDateTime,
                offerAccepted,
                payoutAmount,
            }) => {
            const definition = prosDefinition.find(
                (definition) => definition.id === pro.proTemplateId
            );

            return {
                ...pro,
                name: definition?.name,
                rarity: pro.rarity,
                earnings,
                status,
                level,
                trainingEndDateTime,
                offerAccepted,
                payoutAmount,
            };
        }
        );

        return res.status(200).json({
            pros: prosWithDefinition,
            currentDateTime: new Date(now).toISOString(),
        });
    } catch (error: any) {
        console.error("getMyPros error", error);
        return res.status(500).json({
            message: "Failed to fetch pros for the current user.",
            error: error?.message || "Unknown error",
        });
    }
}

export default authorize(handler);
