import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { IClaimedTicket, IUser } from "@repo/interfaces";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import { ClaimedTicketDoc } from "@repo/schemas";
import { Types } from "mongoose";
import { sanitizeInput } from "@/utils/backend/apiUtil";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    claimedTicket?: ClaimedTicketDoc | null;
    message?: string;
    error?: string;
};

/**
 * POST - Claim a ticket for a user for a specific stage
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
    if (req.method !== "POST") {
        res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const sanitizedBody = sanitizeInput(req.body);
        const { eventId, tier, accessCode, creditMultiplier } = sanitizedBody;

        const userId = user._id;

        if (!userId || !eventId || !tier) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const claimedTicketRepository: IClaimedTicketRepository =
            diContainer.get("IClaimedTicketRepository");
        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");
        const accessCodeRepository: any = diContainer.get(
            "IAccessCodeRepository"
        );

        // Check if the stage exists
        const stage = await stageRepository.getStage(eventId);
        if (!stage) {
            res.status(404).json({ message: "Stage not found" });
            return;
        }

        const isUserEligible = await checkUserClaimEligibility(
            userId?.toString(),
            eventId
        );
        if (!isUserEligible) {
            res.status(403).json({
                message:
                    "User is not eligible to claim a ticket for this stage",
            });
            return;
        }

        let accessCodeDoc = null;

        let organizationId: Types.ObjectId | undefined;
        let accessCode_id: Types.ObjectId | undefined;

        if (accessCode) {
            accessCodeDoc = await accessCodeRepository.findAccessCodeByCode(
                accessCode
            );
            if (accessCodeDoc) {
                organizationId = accessCodeDoc.organizationId;
                accessCode_id = accessCodeDoc._id;
            }
            if (!accessCodeDoc) {
                return res
                    .status(404)
                    .json({ message: "Access code not found" });
            }
            if (accessCodeDoc.tier !== tier) {
                return res.status(400).json({
                    message:
                        "Access code does not match the requested ticket tier",
                });
            }
        }

        // Check if the user has already claimed a ticket for this stage
        const existingTicket =
            await claimedTicketRepository.getClaimedTicketByUserAndEvent(
                userId?.toString(),
                eventId
            );
        if (existingTicket) {
            res.status(409).json({
                message: "User has already claimed a ticket for this stage",
            });
            return;
        }

        const newClaimedTicket: IClaimedTicket = {
            userId,
            eventId,
            tier,
            accessCodeId: accessCodeDoc ? accessCodeDoc._id : undefined,
            organizationId: organizationId,
            creditMultiplier,
        };

        const { claimedTicket, error } =
            await claimedTicketRepository.createClaimedTicket(newClaimedTicket);

        if (error || !claimedTicket) {
            res.status(500).json({
                message: "Failed to create claimed ticket",
                error: error || "Unknown error occurred",
            });
            return;
        }

        res.status(201).json({
            claimedTicket,
        });
    } catch (error: any) {
        console.error("Error creating claimed ticket:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);

/**
 * Validation: Check if a user is eligible to claim a ticket for an stage
 * @param userId
 * @param eventId
 * @returns
 */
async function checkUserClaimEligibility(
    userId: string,
    eventId: string
): Promise<{ isEligible: boolean; message: string }> {
    const claimedTicketRepository: IClaimedTicketRepository = diContainer.get(
        "IClaimedTicketRepository"
    );

    try {
        // Check if the user has already claimed a ticket for this stage
        const existingTicket =
            await claimedTicketRepository.getClaimedTicketByUserAndEvent(
                userId,
                eventId
            );

        if (existingTicket) {
            return {
                isEligible: false,
                message: "User has already claimed a ticket for this stage",
            };
        }

        // If no existing ticket is found, the user is eligible
        return {
            isEligible: true,
            message: "User is eligible to claim a ticket",
        };
    } catch (error) {
        console.error("Error checking user eligibility:", error);
        return {
            isEligible: false,
            message: "An error occurred while checking eligibility",
        };
    }
}
