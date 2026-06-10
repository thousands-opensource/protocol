import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IAccessCodeRepository from "@/repositories/interfaces/iAccessCodeRepository";
import {
    AccessCodeType,
    TicketTierType,
    IAccessCode,
    AccessCodeIntent,
    UserRole,
} from "@repo/interfaces";
import { generateAccessCode } from "@/utils/eventUtil";
import { sanitizeInput } from "@/utils/backend/apiUtil";
import { authorize } from "../middleware/authorization";
import { createAccessCode } from "@/utils/backend/accountsBackendUtil";

type RequestResponse = {
    accessCodes?: string[];
    message?: string;
    error?: string;
};

/**
 * API Call to generate access codes (Designed event dashboard/ internal use)
 * @param req
 * @param res
 * @returns
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const sanitizedBody = sanitizeInput(req.body);

        const {
            codeType,
            count,
            maxQuantity,
            tier,
            seriesId,
            organizationId,
            intent,
            accessRoles,
        } = sanitizedBody;

        // Validate the intent field
        if (!intent || !Object.values(AccessCodeIntent).includes(intent)) {
            return res.status(400).json({ message: "Invalid intent" });
        }

        if (!codeType || !Object.values(AccessCodeType).includes(codeType)) {
            return res.status(400).json({ message: "Invalid code type" });
        }

        // Conditional validation based on intent
        if (intent === AccessCodeIntent.TICKET) {
            if (!tier || !Object.values(TicketTierType).includes(tier)) {
                return res.status(400).json({ message: "Invalid ticket tier" });
            }
        } else if (intent === AccessCodeIntent.ACCESS_ROLE) {
            if (
                !accessRoles ||
                !accessRoles.every((role: string) =>
                    Object.values(UserRole).includes(role as UserRole)
                )
            ) {
                return res
                    .status(400)
                    .json({ message: "Invalid access roles" });
            }
        }

        const accessCodeRepository: IAccessCodeRepository = diContainer.get(
            "IAccessCodeRepository"
        );

        let generatedCodes: string[] = [];

        const accessCodeData: IAccessCode = {
            organizationId: organizationId || null,
            accessCode: generateAccessCode(),
            isClaimed: false,
            claimedUsers: [],
            codeType,
            maxQuantity:
                codeType === AccessCodeType.SINGLE_USE ? 1 : maxQuantity,
            seriesId: seriesId || null,
            intent,
            ...(intent === AccessCodeIntent.TICKET && { tier }), // Conditionally add tier (based on intent)
            ...(intent === AccessCodeIntent.ACCESS_ROLE && { accessRoles }),
        };

        if (
            codeType === AccessCodeType.SINGLE_USE ||
            codeType === AccessCodeType.MULTI_USE
        ) {
            const codeCount =
                codeType === AccessCodeType.SINGLE_USE ? count : 1;
            for (let i = 0; i < codeCount; i++) {
                const code = await createAccessCode(accessCodeData);
                if (code) generatedCodes.push(code);
            }
        } else if (codeType === AccessCodeType.VOUCHER) {
            const code = await createAccessCode(accessCodeData);
            if (code) generatedCodes.push(code);
        }

        if (generatedCodes.length === 0) {
            return res
                .status(500)
                .json({ message: "Failed to generate access codes" });
        }

        res.status(200).json({
            accessCodes: generatedCodes,
            message: `Successfully generated ${generatedCodes.length} access code(s)`,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
