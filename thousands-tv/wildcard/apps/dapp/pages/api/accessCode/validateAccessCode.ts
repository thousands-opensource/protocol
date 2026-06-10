import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IAccessCodeRepository from "@/repositories/interfaces/iAccessCodeRepository";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import { WildcardAccountsApiResponse } from "@/types";

/**
 * API handler for validating access codes
 * @param req
 * @param res
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                message: `Method ${req.method} Not Allowed`,
            },
            405
        );
        return;
    }

    const { code } = req.query;

    if (!code || Array.isArray(code)) {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                message: "Invalid access code provided",
            },
            400
        );
        return;
    }

    try {
        const accessCodeRepository: IAccessCodeRepository = diContainer.get(
            "IAccessCodeRepository"
        );
        const war: WildcardAccountsApiResponse = await validateAccessCode(
            code as string,
            accessCodeRepository
        );
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error validating access code:", e);
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                message: "Something went wrong",
            },
            500
        );
    }
}

/**
 * Validate the access code
 * @param code - The access code provided by the client
 * @param accessCodeRepository - The repository for access codes
 * @returns Promise<WildcardAccountsApiResponse>
 */
export async function validateAccessCode(
    code: string,
    accessCodeRepository: IAccessCodeRepository
): Promise<WildcardAccountsApiResponse> {
    const accessCode = await accessCodeRepository.findAccessCodeByCode(code);

    if (!accessCode) {
        return {
            success: true,
            data: {
                isValid: false,
            },
            message: "Invalid access code, please try again.",
        };
    }

    if (accessCode.isClaimed) {
        return {
            success: true,
            data: {
                isValid: false,
            },
            message: "Access code has already been claimed",
        };
    }

    return {
        success: true,
        data: {
            isValid: true,
            roles: accessCode.accessRoles,
        },
        message: "Access code is valid",
    };
}

// @dev- non-authenticated endpoint (used for applying access codes in the signed out view)
export default handler;
