import { injectable } from "inversify";
import IRallyPredictionRepository, { RallyPredictionWithSharedData } from "@/repositories/interfaces/IRallyPredictionRepository";
import {
    RallyPredictionDoc,
    RallyPredictionInsert,
    rallyPredictionsModel,
} from "@repo/schemas";
import { Types } from "mongoose";
import { IRallyPrediction } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import { diContainer } from "@/inversify.config";
import IPredictionSharedCacheService from "@/services/interfaces/IPredictionSharedCacheService";

@injectable()
export default class RallyPredictionRepository implements IRallyPredictionRepository {

    /**
     * Add a new rally prediction document
     */
    async addRallyPrediction(
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
    ): Promise<RallyPredictionDoc | null> {
        let session;

        try {
            await connectToDb();
            session = await rallyPredictionsModel.startSession();
            session.startTransaction();

            const rallyPredictionData: RallyPredictionInsert = {
                title,
                subTitle,
                optionAText,
                optionBText,
                optionAButtonColor,
                optionBButtonColor,
                startDate,
                endDate,
                maxCreditSpend,
                wcAmount,
                cmsId,
                ...(imageUrl && { imageUrl }),
            };

            const newRallyPrediction = new rallyPredictionsModel(rallyPredictionData);
            const savedRallyPrediction = await newRallyPrediction.save({ session });

            await session.commitTransaction();
            return savedRallyPrediction;
        } catch (e: any) {
            console.error("Error creating rally prediction:", e);
            if (session) {
                await session.abortTransaction();
            }
            return null;
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    /**
     * Update an existing rally prediction document
     */
    async updateRallyPrediction(
        id: string,
        updateData: Partial<IRallyPrediction>
    ): Promise<RallyPredictionDoc | null> {
        try {
            await connectToDb();

            return await rallyPredictionsModel.findByIdAndUpdate(
                new Types.ObjectId(id),
                { ...updateData, updatedAt: new Date() },
                { new: true }
            ).exec();
        } catch (e: any) {
            console.error("Error updating rally prediction:", e);
            return null;
        }
    }

    /**
     * Get all rally prediction documents
     */
    async getAllRallyPredictions(): Promise<RallyPredictionDoc[]> {
        try {
            await connectToDb();

            return await rallyPredictionsModel
                .find({})
                .sort({ createdAt: -1 })
                .exec();
        } catch (e: any) {
            console.error("Error fetching all forecasts:", e);
            return [];
        }
    }

    /**
     * Get a rally prediction by its MongoDB _id
     */
    async getRallyPredictionById(
        id: string
    ): Promise<RallyPredictionDoc | null> {
        try {
            await connectToDb();

            return await rallyPredictionsModel
                .findById(new Types.ObjectId(id))
                .exec();
        } catch (e: any) {
            console.error("Error fetching forecasts by id:", e);
            return null;
        }
    }

    /**
     * Get a rally prediction by its MongoDB _id with shared cache data
     */
    async getRallyPredictionByIdWithSharedData(
        id: string
    ): Promise<RallyPredictionWithSharedData | null> {
        try {
            await connectToDb();

            // Get rally prediction from database
            const rallyPrediction = await rallyPredictionsModel
                .findById(new Types.ObjectId(id))
                .exec();

            if (!rallyPrediction) {
                return null;
            }            // Get shared data from cache
            const predictionSharedCacheService = diContainer.get<IPredictionSharedCacheService>(
                "IPredictionSharedCacheService"
            );

            const cachedData = await predictionSharedCacheService.getCachedSharedRallyPrediction(id);
            
            // Map existing cached data to new format if needed
            let sharedData = cachedData;
            if (cachedData && !(cachedData as any).haltedUntil && (cachedData as any).HaltedUntil) {
                // Convert old format to new format
                sharedData = {
                    haltedUntil: (cachedData as any).HaltedUntil
                };
            }

            return {
                rallyPrediction,
                sharedData
            };
        } catch (e: any) {
            console.error("Error fetching forecast by id with shared data:", e);
            return null;
        }
    }

    /**
     * Get a rally prediction by its CMS ID
     */
    async getRallyPredictionByCmsId(
        cmsId: string
    ): Promise<RallyPredictionDoc | null> {
        try {
            await connectToDb();

            return await rallyPredictionsModel
                .findOne({ cmsId })
                .exec();
        } catch (e: any) {
            console.error("Error fetching forecast by cmsId:", e);
            return null;
        }
    }

    async getRallyPredictionsByExpirationDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<RallyPredictionDoc[]> {
        try {
            await connectToDb();

            const query = {
                endDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            return await rallyPredictionsModel
                .find(query)
                .sort({ endDate: 1 })
                .exec();
        } catch (e: any) {
            console.error("Error fetching rally predictions by expiration date range:", e);
            return [];
        }
    }
}
