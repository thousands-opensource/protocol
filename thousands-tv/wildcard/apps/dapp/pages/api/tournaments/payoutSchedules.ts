import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { diContainer } from "@/inversify.config";
import ITournamentsRepository from "@/repositories/interfaces/ITournamentsRepository";
import { UserRole } from "@repo/interfaces";

async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
) {
    const tournamentsRepository =
        diContainer.get<ITournamentsRepository>("ITournamentsRepository");

    if (req.method === "POST") {
        const { payoutScheduleName, schedule } = req.body ?? {};

        if (
            !payoutScheduleName ||
            !Array.isArray(schedule) ||
            !schedule.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "payoutScheduleName and at least one schedule entry are required.",
            });
        }

        const created = await tournamentsRepository.addTournamentPayoutSchedule(
            { payoutScheduleName, schedule }
        );

        if (!created) {
            return res.status(500).json({
                success: false,
                message: "Failed to create payout schedule.",
            });
        }

        return res.status(200).json({
            success: true,
            data: { id: created._id?.toString() },
        });
    }

    if (req.method === "PUT") {
        const { payoutScheduleId, payoutScheduleName, schedule } = req.body ?? {};

        if (!payoutScheduleId) {
            return res.status(400).json({
                success: false,
                message: "payoutScheduleId is required.",
            });
        }

        const update: Record<string, any> = {};
        if (payoutScheduleName) {
            update.payoutScheduleName = payoutScheduleName;
        }
        if (Array.isArray(schedule)) {
            update.schedule = schedule;
        }

        const updated =
            await tournamentsRepository.updateTournamentPayoutSchedule(
                payoutScheduleId,
                update
            );

        if (!updated) {
            return res.status(500).json({
                success: false,
                message: "Failed to update payout schedule.",
            });
        }

        return res.status(200).json({
            success: true,
            data: { id: updated._id?.toString() },
        });
    }

    return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed.`,
    });
}

export default authorize(handler, [UserRole.ADMIN, UserRole.ORGANIZER]);
