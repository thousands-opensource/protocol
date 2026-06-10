import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { ISeries } from "@repo/interfaces";
import ISeriesRepository from "@/repositories/interfaces/iSeriesRepository";
import { SeriesDoc, seriesModel } from "@repo/schemas";
import { ClientSession } from "mongoose";

@injectable()
export default class seriesRepository implements ISeriesRepository {
    async getSeries(seriesId: string): Promise<ISeries | null> {
        await connectToDb();
        return seriesModel.findById(seriesId).lean();
    }
    async updateEntireSeries(
        series: ISeries,
        session?: ClientSession
    ): Promise<SeriesDoc | null> {
        try {
            await connectToDb();

            const newSeries = await seriesModel.findByIdAndUpdate(
                series._id,
                series,
                { returnDocument: "after", upsert: true, session }
            );
            return newSeries;
        } catch (e: any) {
            console.log(
                `seriesRepository.updateEntireSeries seriesId: ${series._id} error: `,
                e
            );
            return null;
        }
    }

    async createSeries(
        series: ISeries,
        session?: ClientSession
    ): Promise<SeriesDoc | null> {
        try {
            await connectToDb();
            const newSeries = new seriesModel(series);
            await newSeries.save({ session });
            return newSeries;
        } catch (e: any) {
            console.log(
                `seriesRepository.createSeries stage: ${series} error: `,
                e
            );
            return null;
        }
    }
}
