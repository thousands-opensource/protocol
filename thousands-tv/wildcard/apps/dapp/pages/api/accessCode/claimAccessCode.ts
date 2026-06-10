import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IAccessCodeRepository from "@/repositories/interfaces/iAccessCodeRepository";
import { IUser } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";
import { sanitizeInput } from "@/utils/backend/apiUtil";

/**
 * API endpoint to claim an access code
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const sanitizedBody = sanitizeInput(req.body);
        let { accessCode } = sanitizedBody;

        const userId = user._id?.toString();
        accessCode = accessCode?.trim();

        if (!userId || !accessCode) {
            return res
                .status(400)
                .json({ message: "Missing required parameters" });
        }

        const accessCodeRepository: IAccessCodeRepository = diContainer.get(
            "IAccessCodeRepository"
        );

        // Find the access code
        const foundAccessCode = await accessCodeRepository.findAccessCodeByCode(
            accessCode
        );

        if (!foundAccessCode || !foundAccessCode._id) {
            return res.status(404).json({ message: "Invalid access code" });
        }

        // Claim the access code
        const updatedAccessCode = await accessCodeRepository.claimAccessCode(
            foundAccessCode._id.toString(),
            userId
        );

        if (!updatedAccessCode) {
            return res
                .status(500)
                .json({ message: "Failed to claim access code" });
        }

        res.status(200).json({
            accessCode: updatedAccessCode,
            message: "Access code successfully claimed",
        });
    } catch (error: any) {
        if (
            error.message ===
            "User has already claimed this multi-use access code" ||
            error.message === "Access code is already claimed"
        ) {
            return res.status(200).json({ message: error.message });
        }
        if (error.message === "All access codes have been claimed") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
