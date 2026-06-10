import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { UserRallyPredictionDoc } from "@repo/schemas";
import { IUser, IUserRallyPrediction } from "@repo/interfaces";
import IUserRallyPredictionRepository from "@/repositories/interfaces/IUserRallyPredictionRepository";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

/**
 * Backend API response interface for Create User Rally Prediction API
 */
export interface CreateUserRallyPredictionApiResponse
    extends BackendApiResponse<IUserRallyPrediction> {
    data?: IUserRallyPrediction | null;
}

type RequestResponse = CreateUserRallyPredictionApiResponse;

interface RequestBody {
    rallyPredictionId: string;
    amount: number;
    price: number;
    forOrAgainst: boolean;
    questionText: string;
    selectedOptionText: string;
    selectedOptionColor: string;
}

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

        const {
            rallyPredictionId,
            amount,
            price,
            forOrAgainst,
            questionText,
            selectedOptionText,
            selectedOptionColor,
        } = req.body as RequestBody;
        const userId = user._id?.toString();

        // Validate required fields
        const missingFields = [];
        if (!userId) missingFields.push("userId");
        if (!rallyPredictionId) missingFields.push("rallyPredictionId");
        if (amount === undefined || amount === null)
            missingFields.push("amount");
        if (price === undefined || price === null) missingFields.push("price");
        if (forOrAgainst === undefined || forOrAgainst === null)
            missingFields.push("forOrAgainst");
        if (!questionText) missingFields.push("questionText");
        if (!selectedOptionText) missingFields.push("selectedOptionText");
        if (!selectedOptionColor) missingFields.push("selectedOptionColor");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
        }

        // Validate amount is positive
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0",
            });
        }

        // Validate price is between 0 and 1
        if (price <= 0 || price > 1) {
            return res.status(400).json({
                success: false,
                message: "Price must be between 0 and 1",
            });
        }

        // Get repositories from DI container
        const rallyPredictionRepository =
            diContainer.get<IRallyPredictionRepository>(
                "IRallyPredictionRepository"
            );
        const userRallyPredictionRepository =
            diContainer.get<IUserRallyPredictionRepository>(
                "IUserRallyPredictionRepository"
            );

        // Verify rally prediction exists and is still open
        const rallyPrediction =
            await rallyPredictionRepository.getRallyPredictionById(
                rallyPredictionId
            );

        if (!rallyPrediction) {
            return res.status(404).json({
                success: false,
                message: "Rally prediction not found",
            });
        }

        // Check if prediction is still open (between start and end dates)
        const now = new Date();
        const startDate = new Date(rallyPrediction.startDate);
        const endDate = new Date(rallyPrediction.endDate);

        if (now < startDate) {
            return res.status(400).json({
                success: false,
                message: "Rally prediction has not started yet",
            });
        }

        if (now > endDate) {
            return res.status(400).json({
                success: false,
                message: "Rally prediction has ended",
            });
        }

        // Create the user rally prediction
        const newUserRallyPrediction: UserRallyPredictionDoc | null =
            await userRallyPredictionRepository.addUserRallyPrediction(
                userId!,
                rallyPredictionId,
                amount,
                price,
                forOrAgainst,
                questionText,
                selectedOptionText,
                selectedOptionColor
            );

        if (!newUserRallyPrediction) {
            return res.status(500).json({
                success: false,
                message: "Failed to create user rally prediction",
            });
        }

        // Convert to plain object
        const userRallyPrediction: IUserRallyPrediction =
            newUserRallyPrediction.toObject() as IUserRallyPrediction;

        const successMsg = `Successfully created user rally prediction for userId [${userId}] on rallyPredictionId [${rallyPredictionId}] by user [${user._id}]`;
        console.info(successMsg);

        return res.status(201).json({
            success: true,
            message: successMsg,
            data: userRallyPrediction,
        });
    } catch (error: any) {
        console.error("Error creating user rally prediction:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
}

export default authorize(handler);
