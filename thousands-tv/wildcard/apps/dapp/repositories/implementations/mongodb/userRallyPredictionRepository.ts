import { injectable } from "inversify";
import IUserRallyPredictionRepository from "@/repositories/interfaces/IUserRallyPredictionRepository";
import {
    UserRallyPredictionDoc,
    UserRallyPredictionInsert,
    userRallyPredictionsModel,
} from "@repo/schemas";
import { Types } from "mongoose";
import connectToDb from "@/db/connectToDb";

@injectable()
export default class UserRallyPredictionRepository implements IUserRallyPredictionRepository {

    /**
     * Add a new user rally prediction document
     */
    async addUserRallyPrediction(
        userId: string,
        rallyPredictionId: string,
        amount: number,
        price: number,
        forOrAgainst: boolean,
        questionText: string,
        selectedOptionText: string,
        selectedOptionColor: string
    ): Promise<UserRallyPredictionDoc | null> {
        let session;

        try {
            await connectToDb();
            session = await userRallyPredictionsModel.startSession();
            session.startTransaction();

            const userRallyPredictionData: UserRallyPredictionInsert = {
                userId: new Types.ObjectId(userId),
                rallyPredictionId: new Types.ObjectId(rallyPredictionId),
                amount,
                price,
                forOrAgainst,
                questionText,
                selectedOptionText,
                selectedOptionColor,
            };

            const newUserRallyPrediction = new userRallyPredictionsModel(userRallyPredictionData);
            const savedUserRallyPrediction = await newUserRallyPrediction.save({ session });

            await session.commitTransaction();
            return savedUserRallyPrediction;
        } catch (e: any) {
            console.error("Error creating user rally prediction:", e);
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
     * Get all user forecasts by userId
     */
    async getUserRallyPredictionsByUserId(
        userId: string
    ): Promise<UserRallyPredictionDoc[]> {
        try {
            await connectToDb();

            return await userRallyPredictionsModel
                .find({ userId: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .exec();
        } catch (e: any) {
            console.error(
                "Error fetching user forecasts by userId:",
                e
            );
            return [];
        }
    }

    /**
     * Get all user forecasts by rallyPredictionId
     */
    async getUserRallyPredictionsByRallyPredictionId(
        rallyPredictionId: string
    ): Promise<UserRallyPredictionDoc[]> {
        try {
            await connectToDb();

            const results = await userRallyPredictionsModel
                .find({ rallyPredictionId: new Types.ObjectId(rallyPredictionId) })
                .sort({ createdAt: -1 })
                .exec();

            return results;
        } catch (e: any) {
            console.error(
                "Error fetching user forecasts by rallyPredictionId:",
                e
            );
            return [];
        }
    }

    /**
     * Get all user forecasts by both userId and rallyPredictionId
     */
    async getUserRallyPredictionsByUserIdAndRallyPredictionId(
        userId: string,
        rallyPredictionId: string
    ): Promise<UserRallyPredictionDoc[]> {
        try {
            await connectToDb();

            return await userRallyPredictionsModel
                .find({
                    userId: new Types.ObjectId(userId),
                    rallyPredictionId: new Types.ObjectId(rallyPredictionId),
                })
                .sort({ createdAt: -1 })
                .exec();
        } catch (e: any) {
            console.error(
                "Error fetching user forecasts by userId and rallyPredictionId:",
                e
            );
            return [];
        }
    }
}
