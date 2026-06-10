import { ISeries } from "@repo/interfaces";
import { SeriesDoc } from "@repo/schemas";
import { ClientSession } from "mongoose";

//Repository for storing Series data
export default interface ISeriesRepository {
    getSeries(seriesId: string): Promise<ISeries | null>;

    updateEntireSeries(
        series: ISeries,
        session?: ClientSession
    ): Promise<SeriesDoc | null>;

    createSeries(
        series: ISeries,
        session?: ClientSession
    ): Promise<SeriesDoc | null>;
}
