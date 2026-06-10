import { injectable } from "inversify";
import IPredictionChartDataRepository from "@/repositories/interfaces/IPredictionChartDataRepository";
import { PredictionChartDataDoc, PredictionChartDataInsert, predictionChartDataModel } from "@repo/schemas";
import { Types } from "mongoose";
import connectToDb from "@/db/connectToDb";

@injectable()
class PredictionChartDataRepository implements IPredictionChartDataRepository {
    
    async addChartDataPoint(
        rallyPredictionId: string,
        timestamp: Date,
        price: number
    ): Promise<PredictionChartDataDoc | null> {
        try {
            await connectToDb();

            const chartDataPoint: PredictionChartDataInsert = {
                rallyPredictionId: new Types.ObjectId(rallyPredictionId),
                timestamp,
                price,
            };

            const newChartDataPoint = new predictionChartDataModel(chartDataPoint);
            return await newChartDataPoint.save();
        } catch (e: any) {
            console.error("Error creating chart data point:", e);
            return null;
        }
    }

    async getChartDataByRallyPredictionId(
        rallyPredictionId: string,
        limit?: number,
        fromTimestamp?: Date,
        toTimestamp?: Date,
    ): Promise<PredictionChartDataDoc[]> {
        try {
            await connectToDb();
            
            const query: any = { rallyPredictionId: new Types.ObjectId(rallyPredictionId) };
            if (fromTimestamp) {
                query.timestamp = { $gte: fromTimestamp };
            }
            if (toTimestamp) {
                query.timestamp = { ...query.timestamp, $lte: toTimestamp };
            }

            let queryBuilder = predictionChartDataModel
                .find(query)
                .sort({ timestamp: 1 });

            if (limit) {
                queryBuilder = queryBuilder.limit(limit);
            }

            return await queryBuilder.exec();
        } catch (e: any) {
            console.error("Error fetching chart data by rallyPredictionId:", e);
            return [];
        }
    }

    async getRecentChartData(
        rallyPredictionId: string,
        timeWindowMinutes: number
    ): Promise<PredictionChartDataDoc[]> {
        try {
            await connectToDb();
            
            const now = new Date();
            const cutoffTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
            
            const query = { 
                rallyPredictionId: new Types.ObjectId(rallyPredictionId),
                timestamp: { $gte: cutoffTime }
            };
            
            return await predictionChartDataModel
                .find(query)
                .sort({ timestamp: 1 })
                .exec();
        } catch (e: any) {
            console.error("Error fetching recent chart data:", e);
            return [];
        }
    }
}

export default PredictionChartDataRepository;
