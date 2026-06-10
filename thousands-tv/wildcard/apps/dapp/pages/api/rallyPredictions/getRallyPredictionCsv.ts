import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import IUserRallyPredictionRepository from "@/repositories/interfaces/IUserRallyPredictionRepository";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

export interface RallyPredictionSettlementCsvApiResponse extends BackendApiResponse<any> {
    data?: {
        csvData: string;
        filename: string;
        summary: {
            totalParticipants: number;
            totalPool: number;
            rallyPredictionId: string;
        };
    } | null;
}

type RequestResponse = RallyPredictionSettlementCsvApiResponse;

type RequestBody = {
    startDate?: string;
    endDate?: string;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const { startDate, endDate } = req.body as RequestBody;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date",
            });
        }

        const userRallyPredictionRepository = diContainer.get<IUserRallyPredictionRepository>(
            "IUserRallyPredictionRepository"
        );
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        const rallyPredictions = await rallyPredictionRepository.getRallyPredictionsByExpirationDateRange(start, end);

        console.log('Debug - Rally predictions found:', {
            count: rallyPredictions.length,
            rallies: rallyPredictions.map(r => ({
                id: r._id.toString(),
                title: r.title,
                startDate: r.startDate?.toISOString(),
                endDate: r.endDate?.toISOString(),
                endTime: r.endDate?.getTime()
            }))
        });

        if (rallyPredictions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No rally predictions found that expire between ${start.toISOString().split('T')[0]} and ${end.toISOString().split('T')[0]}`,
            });
        }

        let allUserPredictions: any[] = [];
        let totalParticipants = 0;

        console.log('Debug - Processing rallies:', {
            rallyCount: rallyPredictions.length,
            rallies: rallyPredictions.map(r => ({
                id: r._id?.toString(),
                title: r.title,
                endDate: r.endDate
            }))
        });

        for (const rally of rallyPredictions) {
            console.log('Debug - Getting user predictions for rally:', rally._id.toString());
            const userPreds = await userRallyPredictionRepository.getUserRallyPredictionsByRallyPredictionId(rally._id.toString());
            console.log('Debug - User predictions found for rally:', {
                rallyId: rally._id.toString(),
                rallyTitle: rally.title,
                userPredsCount: userPreds.length,
                userPreds: userPreds.length > 0 ? userPreds.slice(0, 2).map(p => ({
                    userId: p.userId,
                    amount: p.amount,
                    createdAt: (p as any).createdAt
                })) : 'No predictions'
            });

            const enrichedPreds = userPreds.map(pred => ({
                userId: pred.userId,
                amount: pred.amount,
                price: pred.price,
                forOrAgainst: pred.forOrAgainst,
                createdAt: (pred as any).createdAt,
                updatedAt: (pred as any).updatedAt,
                rallyPredictionId: rally._id.toString(),
                rallyEndDate: rally.endDate,
                rallyTitle: rally.title || `Rally ${rally._id.toString()}`,
            }));
            allUserPredictions = allUserPredictions.concat(enrichedPreds);
            totalParticipants += userPreds.length;
        }

        console.log('Debug - Total user predictions:', {
            totalCount: allUserPredictions.length,
            totalParticipants,
            samplePrediction: allUserPredictions.length > 0 ? {
                keys: Object.keys(allUserPredictions[0]),
                rallyPredictionId: allUserPredictions[0].rallyPredictionId,
                userId: allUserPredictions[0].userId,
                amount: allUserPredictions[0].amount,
                hasRallyTitle: !!allUserPredictions[0].rallyTitle,
                hasRallyEndDate: !!allUserPredictions[0].rallyEndDate
            } : 'No predictions'
        });

        if (allUserPredictions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No user predictions found for rallies in the specified date range",
            });
        }

        const totalPool = allUserPredictions.reduce((sum: number, prediction: any) => sum + prediction.amount, 0);

        const ralliesMap = new Map();
        rallyPredictions.forEach((rally: any) => {
            ralliesMap.set(rally._id.toString(), rally);
            console.log('Debug - Adding rally to map:', {
                rallyId: rally._id.toString(),
                title: rally.title,
                startDate: rally.startDate,
                endDate: rally.endDate,
                hasStart: !!rally.startDate,
                hasEnd: !!rally.endDate
            });
        });

        const sortedPredictions = allUserPredictions.sort((a: any, b: any) => {
            const aTime = (a as any).createdAt || new Date(0);
            const bTime = (b as any).createdAt || new Date(0);
            return aTime.getTime() - bTime.getTime();
        });

        const headers = [
            'rallyPredictionId',
            'rallyTitle',
            'rallyEndDate',
            'userId',
            'amount',
            'price',
            'forOrAgainst',
            'createdAt',
            'updatedAt',
            'percentileWhenBet',
            'timingFactor',
            'positionMultiplier',
            'poolContribution',
            'basePayout',
            'bonusScore'
        ].join(',');

        const rows = sortedPredictions.map((prediction: any, index: number) => {
            const rally = ralliesMap.get(prediction.rallyPredictionId);

            console.log('Debug - Processing prediction:', {
                index,
                userId: prediction.userId,
                amount: prediction.amount,
                price: prediction.price,
                rallyPredictionId: prediction.rallyPredictionId,
                keys: Object.keys(prediction)
            });

            let percentileWhenBet = 0.5;

            if (rally && prediction.createdAt && rally.startDate && rally.endDate) {
                const betTime = new Date(prediction.createdAt).getTime();
                const rallyStart = new Date(rally.startDate).getTime();
                const rallyEnd = new Date(rally.endDate).getTime();
                const rallyDuration = rallyEnd - rallyStart;

                if (rallyDuration > 0) {
                    const timeIntoRally = betTime - rallyStart;
                    percentileWhenBet = Math.max(0, Math.min(1, timeIntoRally / rallyDuration));
                }

                console.log('Debug - Timing calculation:', {
                    betTime: new Date(betTime).toISOString(),
                    rallyStart: new Date(rallyStart).toISOString(),
                    rallyEnd: new Date(rallyEnd).toISOString(),
                    percentileWhenBet
                });
            }

            const timingFactor = 1 + (0.05 * (1 - percentileWhenBet));

            const price = prediction.price || 0.5;
            const safePrice = Math.max(Math.min(price, 0.9999), 0.0001);

            const positionMultiplier = Math.min(1 / safePrice, 20);

            const poolContribution = (prediction.amount / totalPool) * 100;

            const basePayout = 0.75 * totalPool * (prediction.amount / totalPool);

            const bonusScore = prediction.amount * timingFactor * positionMultiplier;

            return [
                prediction.rallyPredictionId || '',
                prediction.rallyTitle || '',
                prediction.rallyEndDate ? new Date(prediction.rallyEndDate).toISOString() : '',
                prediction.userId ? prediction.userId.toString() : '',
                prediction.amount || 0,
                prediction.price || 0,
                prediction.forOrAgainst || '',
                (prediction as any).createdAt?.toISOString() || '',
                (prediction as any).updatedAt?.toISOString() || '',
                percentileWhenBet.toFixed(4),
                timingFactor.toFixed(4),
                positionMultiplier.toFixed(4),
                poolContribution.toFixed(2),
                basePayout.toFixed(2),
                bonusScore.toFixed(2)
            ].join(',');
        });

        const csvData = [headers, ...rows].join('\n');
        const filename = `rally-predictions-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;

        const summary = {
            totalParticipants: allUserPredictions.length,
            totalPool,
            rallyPredictionId: `${rallyPredictions.length} rallies (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`,
        };

        const successMsg = `Successfully generated CSV for ${rallyPredictions.length} rally predictions with ${allUserPredictions.length} participants`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: {
                csvData,
                filename,
                summary,
            },
        });
    } catch (error: any) {
        console.error("Error generating rally prediction CSV:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
