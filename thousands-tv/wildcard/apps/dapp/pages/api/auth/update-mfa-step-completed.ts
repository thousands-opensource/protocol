import { NextApiRequest, NextApiResponse } from "next";
import { FilterQuery, UpdateQuery } from "mongoose";
import { IUser } from "@repo/interfaces";
import { updateOneUserDB } from "@repo/schemas";
import { API_RESPONSE_STATUS_CODE_404_MESSAGE } from "@/utils/backend/apiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { email, mfaStepCompleted } = req.body;

    try {
        const update = await updateMFAStepCompleted(
            { email },
            mfaStepCompleted
        );

        if (!update) {
            res.status(404).json({
                message:
                    "User not found - unable to update MFA step completed status",
            });
            return;
        }

        res.json({
            success: true,
            message: "MFA step completed status updated successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default handler;

/**
 * Update user's MFA step completed status in DB
 * @param {FilterQuery<IUser>} query - mongo query to find user to update
 * @param {boolean} mfaStepCompleted - new MFA step completed status to set
 */
export async function updateMFAStepCompleted(
    query: FilterQuery<IUser>,
    mfaStepCompleted: boolean
) {
    const update: UpdateQuery<IUser> = {
        $set: {
            "authenticator.mfaStepCompleted": mfaStepCompleted,
            "authenticator.mfaStepCompletedAt": new Date(),
        },
    };

    return await updateOneUserDB(query, update);
}
