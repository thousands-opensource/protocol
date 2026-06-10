import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser, IRallyPrediction } from "@repo/interfaces";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

/**
 * Backend API response interface for Get Rally Prediction By ID API
 */
export interface GetRallyPredictionByIdApiResponse
    extends BackendApiResponse<IRallyPrediction> {
    data?: IRallyPrediction | null;
}

type RequestResponse = GetRallyPredictionByIdApiResponse;

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    try {
        // Validate request method
        if (req.method !== "GET") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const { id } = req.query;

        // Validate required fields
        if (!id || typeof id !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing or invalid rally prediction ID",
            });
        }

        // Get the rally prediction repository from the DI container
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        // Fetch the rally prediction
        const rallyPredictionDoc = await rallyPredictionRepository.getRallyPredictionById(id);

        if (!rallyPredictionDoc) {
            return res.status(404).json({
                success: false,
                message: "Rally prediction not found",
            });
        }

        // Convert document to plain object
        const rallyPrediction: IRallyPrediction = rallyPredictionDoc.toObject() as IRallyPrediction;

        const successMsg = `Successfully fetched rally prediction [${id}] for user [${user._id}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: rallyPrediction,
        });
    } catch (error: any) {
        console.error("Error fetching rally prediction:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
