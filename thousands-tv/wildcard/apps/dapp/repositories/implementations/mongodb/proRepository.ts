import connectToDb from "@/db/connectToDb";
import IProRepository from "@/repositories/interfaces/IProRepository";
import { IPro, IProAction } from "@repo/interfaces";
import {
    ProDoc,
    proModel,
    ProActionDoc,
    proActionModel,
} from "@repo/schemas";
import { injectable } from "inversify";

@injectable()
export default class ProRepository implements IProRepository {
    public async createPro(pro: IPro): Promise<ProDoc | null> {
        try {
            await connectToDb();
            const created = new proModel(pro);
            await created.save();
            return created;
        } catch (error) {
            console.error("ProRepository.createPro error", error);
            return null;
        }
    }

    public async getProByProId(proId: string): Promise<IPro | null> {
        await connectToDb();
        return proModel.findOne({ _id: proId }).lean();
    }

    public async getProsByUserId(userId: string): Promise<IPro[]> {
        await connectToDb();
        return proModel.find({ userId }).lean();
    }

    public async getProActionsByUserId(
        userId: string
    ): Promise<IProAction[]> {
        await connectToDb();
        return proActionModel.find({ userId }).lean();
    }

    public async getProActionsByProId(
        proId: string
    ): Promise<IProAction[]> {
        await connectToDb();
        return proActionModel
            .find({ proId })
            .sort({ currentLevel: -1 })
            .lean();
    }

    public async createProAction(
        action: IProAction
    ): Promise<ProActionDoc | null> {
        try {
            await connectToDb();
            const created = new proActionModel(action);
            await created.save();
            return created;
        } catch (error) {
            console.error("ProRepository.createProAction error", error);
            return null;
        }
    }

    public async calculateProsWithEarnings(
        userId: string,
        currentTime: number
    ) {
        const DAILY_RATE_PER_RARITY = 10;
        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        await connectToDb();
        const [pros, proActions] = await Promise.all([
            proModel.find({ userId }).lean(),
            proActionModel.find({ userId }).lean(),
        ]);

        const earningsByProId: Record<string, number> = {};
        const highestLevelByProId: Record<string, number> = {};
        const offerAcceptedByProId: Record<string, boolean> = {};
        const offerAcceptedDateTimeByProId: Record<string, Date | null> = {};
        const latestTrainingActionByProId: Record<
            string,
            { timestamp: number; currentLevel: number }
        > = {};
        const activePayoutByProId: Record<string, number> = {};

        proActions.forEach((action) => {
            const proIdKey = action.proId?.toString();
            if (!proIdKey) {
                return;
            }
            
            if (action.actionTypeId === 3) {
                offerAcceptedByProId[proIdKey] = true;
                offerAcceptedDateTimeByProId[proIdKey] = action.createdAt ?? null;
            }
        });

        proActions.forEach((action) => {
            const proIdKey = action.proId?.toString();
            if (!proIdKey) {
                return;
            }

            if (action.actionTypeId === 1) {
                earningsByProId[proIdKey] =
                    (earningsByProId[proIdKey] || 0) + action.amount;

                const createdAtTime = action.createdAt
                    ? new Date(action.createdAt).getTime()
                    : 0;
                const existing = latestTrainingActionByProId[proIdKey];

                if (!existing || createdAtTime > existing.timestamp) {
                    latestTrainingActionByProId[proIdKey] = {
                        timestamp: createdAtTime,
                        currentLevel: action.currentLevel || 0,
                    };
                }
                highestLevelByProId[proIdKey] = Math.max(
                    highestLevelByProId[proIdKey] || 0,
                    action.currentLevel || 0
                );
            } else if (action.actionTypeId === 2 && action.createdAt) {
                const payoutTime = new Date(action.createdAt).getTime();
                if (currentTime - payoutTime < MS_PER_DAY) {
                    activePayoutByProId[proIdKey] = action.amount;
                }
            }
        });

        return pros.map((pro) => {
            const proIdKey = pro._id?.toString() || "";
            const createdAtTime = pro.createdAt
                ? new Date(pro.createdAt).getTime()
                : null;
            var daysOwned =
                createdAtTime && createdAtTime < currentTime
                    ? Math.max(0, (currentTime - createdAtTime) / MS_PER_DAY)
                    : 0;

            //Accepted an offer
            if (offerAcceptedByProId[proIdKey] && offerAcceptedDateTimeByProId[proIdKey] != null)
            {
                const offerAcceptedDateTime = new Date(offerAcceptedDateTimeByProId[proIdKey]).getTime();
                daysOwned = createdAtTime ? Math.max(0, (offerAcceptedDateTime - createdAtTime) / MS_PER_DAY) : 0;
                console.log(`offerAcceptedDateTime: ${offerAcceptedDateTime}}`);
                console.log(`createdAtTime: ${createdAtTime}`);
                console.log(`daysOwned: ${daysOwned}`);
            }

            const rarityMultiplier = pro.rarity ?? 0;
            const baseEarnings = Math.floor(
                daysOwned * DAILY_RATE_PER_RARITY * rarityMultiplier
            );
            const actionTotal = earningsByProId[proIdKey] || 0;
            const earnings = Math.max(baseEarnings - actionTotal, 0);
            const level = (highestLevelByProId[proIdKey] || 0) + 1;
            const offerAccepted = offerAcceptedByProId[proIdKey];

            let status = "Earning";
            let trainingEndDateTime: string | null = null;
            const latestTraining = latestTrainingActionByProId[proIdKey];

            if (latestTraining && latestTraining.timestamp > 0) {
                const trainingDurationMs =
                    (latestTraining.currentLevel || 1) * MS_PER_DAY;
                const trainingEnd =
                    latestTraining.timestamp + trainingDurationMs;
                trainingEndDateTime = new Date(trainingEnd).toISOString();

                if (currentTime < trainingEnd) {
                    status = "Training";
                }
            }

            return {
                pro,
                earnings,
                level,
                status,
                trainingEndDateTime,
                offerAccepted,
                payoutAmount: activePayoutByProId[proIdKey] ?? null,
            };
        });
    }
}
