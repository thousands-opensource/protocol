//@ts-nocheck
import { NextApiRequest, NextApiResponse } from "next";
import { FilterQuery } from "mongoose";
import { IUser } from "@repo/interfaces";
import { findOneUserByQuery } from "@repo/schemas";
import { sendApiResponseWithStatusCode } from "@/utils/backend/apiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { email } = req.query;

    try {
        const user = await checkMFAStepCompleted({ email });

        if (!user) {
            res.status(404).json({
                message:
                    "User not found - unable to check MFA step completed status",
            });
            return;
        }

        res.json({
            status: "success",
            message: "MFA step completed status checked successfully",
            data: {
                mfaStepCompleted: user.authenticator?.mfaStepCompleted,
                mfaStepCompletedWithinLast15Minutes: user.authenticator
                    ?.mfaStepCompletedAt
                    ? isWithinLastSeconds(user.authenticator.mfaStepCompletedAt)
                    : false,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            status: "Internal Server Error",
            service: "N/A",
            error: "Error checking MFA step completed status",
            message: error.message,
        });
    }
}

export default handler;

/**
 * Check user's MFA step completed status in DB
 * @param {FilterQuery<IUser>} query - mongo query to find user to check
 */
export async function checkMFAStepCompleted(query: FilterQuery<IUser>) {
    return await findOneUserByQuery(query);
}

/**
 * Check if a date is within the last N minutes
 * @dev - minute cool down period before TOTP is invalidated if isOTPValid cookie is false
 * @param {Date} date - date to check
 * @param {number} minutes - number of minutes to check
 */
function isWithinLastSeconds(date: Date) {
    const seconds = 10;
    const nSecondsAgo = new Date(Date.now() - seconds * 1000);
    return date > nSecondsAgo;
}
