import { RallyPredictionDoc } from "@repo/schemas";
import { IRallyPrediction } from "@repo/interfaces";
import { SharedRallyPredictionData } from "@/services/interfaces/IPredictionSharedCacheService";

export interface RallyPredictionWithSharedData {
    rallyPrediction: RallyPredictionDoc;
    sharedData: SharedRallyPredictionData | null;
}

export default interface IRallyPredictionRepository {
    addRallyPrediction(
        title: string,
        subTitle: string,
        optionAText: string,
        optionBText: string,
        optionAButtonColor: string,
        optionBButtonColor: string,
        startDate: Date,
        endDate: Date,
        maxCreditSpend: number,
        wcAmount: number,
        cmsId: string,
        imageUrl?: string
    ): Promise<RallyPredictionDoc | null>;

    updateRallyPrediction(
        id: string,
        updateData: Partial<IRallyPrediction>
    ): Promise<RallyPredictionDoc | null>;

    getAllRallyPredictions(): Promise<RallyPredictionDoc[]>;

    getRallyPredictionById(id: string): Promise<RallyPredictionDoc | null>;

    getRallyPredictionByIdWithSharedData(id: string): Promise<RallyPredictionWithSharedData | null>;

    getRallyPredictionByCmsId(cmsId: string): Promise<RallyPredictionDoc | null>;

    getRallyPredictionsByExpirationDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<RallyPredictionDoc[]>;
}
