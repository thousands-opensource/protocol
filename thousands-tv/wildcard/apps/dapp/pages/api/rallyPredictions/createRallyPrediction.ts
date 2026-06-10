import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { RallyPredictionDoc } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

/**
 * Backend API response interface for Create Forecast API
 */
export interface CreateRallyPredictionApiResponse
    extends BackendApiResponse<RallyPredictionDoc> {
    data?: RallyPredictionDoc | null;
}

type RequestResponse = CreateRallyPredictionApiResponse;

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

        const { title, subTitle, optionAText, optionBText, optionAButtonColor, optionBButtonColor, startDate, endDate, maxCreditSpend, wcAmount, cmsId, imageUrl } = req.body;

        // Validate required fields
        if (!title || !startDate || !endDate || !cmsId || !maxCreditSpend || !wcAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, startDate, endDate, cmsId, maxCreditSpend, wcAmount",
            });
        }

        // Get the rally prediction repository from the DI container
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        // Create the rally prediction
        const rallyPredictionDoc: RallyPredictionDoc | null =
            await rallyPredictionRepository.addRallyPrediction(
                title,
                subTitle,
                optionAText, 
                optionBText, 
                optionAButtonColor, 
                optionBButtonColor,
                new Date(startDate),
                new Date(endDate),
                maxCreditSpend,
                wcAmount,
                cmsId,
                imageUrl
            );

        if (!rallyPredictionDoc) {
            return res.status(500).json({
                success: false,
                message: "Failed to create forecast",
            });
        }

        const successMsg = `Successfully created forecast [${rallyPredictionDoc._id}] for user [${user._id}]`;
        console.info(successMsg);

        return res.status(201).json({
            success: true,
            message: successMsg,
            data: rallyPredictionDoc,
        });
    } catch (error: any) {
        console.error("Error creating forecast:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
