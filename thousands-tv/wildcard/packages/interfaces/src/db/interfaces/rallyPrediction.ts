import { Types } from "mongoose";

export interface IRallyPrediction {
    _id?: Types.ObjectId;
    title: string;
    subTitle: string;
    optionAText: string;
    optionBText: string;
    optionAButtonColor: string;
    optionBButtonColor: string;
    startDate: Date;
    endDate: Date;
    maxCreditSpend: number;
    wcAmount: number;
    imageUrl?: string;
    resolvedChoice?: boolean;
    cmsId: string;
    isVisible?: boolean;
    airdropComplete?: boolean;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
