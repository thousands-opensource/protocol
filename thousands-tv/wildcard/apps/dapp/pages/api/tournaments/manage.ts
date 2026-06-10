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
        const { tid, payoutScheduleId } = req.body ?? {};

        if (!tid || !payoutScheduleId) {
            return res.status(400).json({
                success: false,
                message: "tid and payoutScheduleId are required.",
            });
        }

        const existing = await tournamentsRepository.getTournamentOptionByTid(
            tid
        );
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "A tournament option with this tid already exists.",
            });
        }

        const created = await tournamentsRepository.addTournamentOption({
            tid,
            payoutSchedule: payoutScheduleId,
        });

        if (!created) {
            return res.status(500).json({
                success: false,
                message: "Failed to create tournament option.",
            });
        }

        return res.status(200).json({
            success: true,
            data: { id: created._id?.toString() },
        });
    }

    if (req.method === "PUT") {
        const { tournamentOptionId, tid, payoutScheduleId } = req.body ?? {};

        if (!tournamentOptionId) {
            return res.status(400).json({
                success: false,
                message: "tournamentOptionId is required.",
            });
        }

        const update: any = {};
        if (tid) {
            update.tid = tid;
        }
        if (payoutScheduleId !== undefined) {
            update.payoutSchedule = payoutScheduleId || undefined;
        }

        const updated = await tournamentsRepository.updateTournamentOption(
            tournamentOptionId,
            update
        );

        if (!updated) {
            return res.status(500).json({
                success: false,
                message: "Failed to update tournament option.",
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

export default authorize(handler, [
    UserRole.ADMIN,
    UserRole.ORGANIZER,
]);
