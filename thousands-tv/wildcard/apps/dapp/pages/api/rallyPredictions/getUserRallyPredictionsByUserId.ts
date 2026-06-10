import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { UserRallyPredictionDoc } from "@repo/schemas";
import { IUser, IUserRallyPrediction } from "@repo/interfaces";
import IUserRallyPredictionRepository from "@/repositories/interfaces/IUserRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

/**
 * Backend API response interface for User forecasts API
 */
export interface UserRallyPredictionsApiResponse
    extends BackendApiResponse<IUserRallyPrediction[]> {
    data?: IUserRallyPrediction[] | null;
}

type RequestResponse = UserRallyPredictionsApiResponse;

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    try {
        // Validate request method
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const userId = user._id?.toString();

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: userId",
            });
        }

        // Get the user rally prediction repository from the DI container
        const userRallyPredictionRepository = diContainer.get<IUserRallyPredictionRepository>(
            "IUserRallyPredictionRepository"
        );

        // Fetch user forecasts by userId
        const userRallyPredictionDocs: UserRallyPredictionDoc[] =
            await userRallyPredictionRepository.getUserRallyPredictionsByUserId(userId);

        // Convert documents to plain objects
        const userRallyPredictions: IUserRallyPrediction[] = userRallyPredictionDocs.map(
            (doc) => doc.toObject() as IUserRallyPrediction
        );

        const successMsg = `Successfully fetched ${userRallyPredictions.length} user forecasts for userId [${userId}] by user [${user._id}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: userRallyPredictions,
        });
    } catch (error: any) {
        console.error("Error fetching user forecasts by userId:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
