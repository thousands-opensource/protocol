import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IAccessCodeRepository from "@/repositories/interfaces/iAccessCodeRepository";
import { IAccessCode } from "@repo/interfaces";
import { IUser } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    accessCodes?: IAccessCode[];
    message?: string;
    error?: string;
};

/**
 * API endpoint to get access codes by user id
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        let { seriesId } = req.query;

        const userId = user._id?.toString();
        seriesId = seriesId?.toString().trim();

        if (
            !userId ||
            Array.isArray(userId) ||
            !seriesId ||
            Array.isArray(seriesId)
        ) {
            return res.status(400).json({
                message:
                    "Invalid or missing query parameters: userId or seriesId",
            });
        }

        const accessCodeRepository: IAccessCodeRepository = diContainer.get(
            "IAccessCodeRepository"
        );

        const accessCodes =
            await accessCodeRepository.findValidAccessCodesByUserIdAndseriesId(
                userId,
                seriesId
            );

        if (accessCodes.length === 0) {
            // Expected behavior: Return 200 status code with empty array
            return res.status(200).json({
                message:
                    "No valid access codes found for the given user and season",
                accessCodes: [],
            });
        }

        res.status(200).json({ accessCodes });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

// Wrap the handler with the authorize middleware
export default authorize(handler);
