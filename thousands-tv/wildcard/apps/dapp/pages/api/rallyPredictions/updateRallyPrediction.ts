import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { RallyPredictionDoc } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

/**
 * Backend API response interface for Update Rally Prediction API
 */
export interface UpdateRallyPredictionApiResponse
    extends BackendApiResponse<RallyPredictionDoc> {
    data?: RallyPredictionDoc | null;
}

type RequestResponse = UpdateRallyPredictionApiResponse;

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

        const { _id, title, subTitle, optionAText, optionBText, optionAButtonColor, optionBButtonColor, startDate, endDate, maxCreditSpend, wcAmount, cmsId, imageUrl, isVisible, airdropComplete } = req.body;

        // Validate required fields
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: _id",
            });
        }

        // Get the rally prediction repository from the DI container
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        // Prepare update data
        const updateData: any = {};
        if (title) updateData.title = title;
        if (subTitle) updateData.subTitle = subTitle;
        if (optionAText) updateData.optionAText = optionAText;
        if (optionBText) updateData.optionBText = optionBText;
        if (optionAButtonColor) updateData.optionAButtonColor = optionAButtonColor;
        if (optionBButtonColor) updateData.optionBButtonColor = optionBButtonColor;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (cmsId) updateData.cmsId = cmsId;
        if (maxCreditSpend) updateData.maxCreditSpend = maxCreditSpend;
        if (wcAmount) updateData.wcAmount = wcAmount;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (isVisible !== undefined) updateData.isVisible = isVisible;
        if (airdropComplete !== undefined) updateData.airdropComplete = airdropComplete;

        // Update the rally prediction
        const rallyPredictionDoc: RallyPredictionDoc | null =
            await rallyPredictionRepository.updateRallyPrediction(_id, updateData);

        if (!rallyPredictionDoc) {
            return res.status(404).json({
                success: false,
                message: "Rally prediction not found or failed to update",
            });
        }

        const successMsg = `Successfully updated rally prediction [${rallyPredictionDoc._id}] for user [${user._id}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: rallyPredictionDoc,
        });
    } catch (error: any) {
        console.error("Error updating rally prediction:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
