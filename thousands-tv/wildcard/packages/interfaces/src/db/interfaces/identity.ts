import { Types } from "mongoose";

export const IDENTITIES = "identities";

export interface IIdentity {
    identityName: string;
    identityPfpImageUrl: string;
    identityType: string;
    identityRole: string;
    showAsTalent: boolean;
    supportTokenContractAddress?: string | undefined;
    startDate: Date;
    endDate?: Date | null;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}