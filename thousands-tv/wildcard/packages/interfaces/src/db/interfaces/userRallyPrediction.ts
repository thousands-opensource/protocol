import { Types } from "mongoose";

export interface IUserRallyPrediction {
    _id?: Types.ObjectId;
    userId: Types.ObjectId; // Reference to users collection
    rallyPredictionId: Types.ObjectId; // Reference to rally-predictions collection
    amount: number; // Amount of the prediction
    price: number; // Price at which the prediction was made
    forOrAgainst: boolean; // true for "for", false for "against"
    questionText: string;
    selectedOptionText: string;
    selectedOptionColor: string;

    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
