import { Types } from "mongoose";

export interface IPredictionChartData {
    _id?: Types.ObjectId;
    rallyPredictionId: Types.ObjectId;
    timestamp: Date;
    price: number;
}
