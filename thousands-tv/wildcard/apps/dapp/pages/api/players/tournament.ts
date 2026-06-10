import type { NextApiRequest, NextApiResponse } from "next";
import { 
    tournamentPayoutSchedule, 
    tournamentPayoutSchedule2, 
    tournamentPayoutScheduleDaily, 
    tournamentPayoutScheduleWeekly,
    tournamentPayoutScheduleDaily16, 
    tournamentPayoutScheduleWeekly16,
} from "@/constants/tournamentPayoutSchedule";
import { diContainer } from "@/inversify.config";
import ITournamentsRepository from "@/repositories/interfaces/ITournamentsRepository";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            err: `Method ${req.method} not allowed`,
        });
    }

    // Inputs reserved for future use
    const { tid } = req.query;
    if (!tid) {
        return res.status(400).json({
            success: false,
            err: "Missing required query parameter 'tid'",
        });
    }

    const clean = (s: string) => s.endsWith("/") ? s.slice(0, -1) : s;
    const cleanedTid = clean(tid.toString());

    const tournamentsRepository =
        diContainer.get<ITournamentsRepository>("ITournamentsRepository");

    console.log(cleanedTid);

    const tournamentOption =
        await tournamentsRepository.getTournamentOptionByTid(
            cleanedTid
        );

    console.log(tournamentOption);

    const payoutSchedule: Array<{ rank: number; earnings: number }> = [];

    if (
        tournamentOption?.payoutSchedule &&
        "schedule" in tournamentOption.payoutSchedule
    ) {
        const scheduleEntries =
            (tournamentOption.payoutSchedule as any).schedule || [];
        scheduleEntries.forEach((entry: any) => {
            const [start, end] = entry.range || [];
            for (let rank = start; rank <= end; rank++) {
                payoutSchedule.push({
                    rank,
                    earnings: entry.amountInCents,
                });
            }
        });
    } else {
        if (tid.includes("Weekly")) {
            for (const entry of tournamentPayoutScheduleWeekly) {
                const [start, end] = entry.range;
                for (let rank = start; rank <= end; rank++) {
                    payoutSchedule.push({
                        rank,
                        earnings: entry.amountInCents,
                    });
                }
            }
        } else {
            for (const entry of tournamentPayoutScheduleDaily) {
                const [start, end] = entry.range;
                for (let rank = start; rank <= end; rank++) {
                    payoutSchedule.push({
                        rank,
                        earnings: entry.amountInCents,
                    });
                }
            }
        }
    }

    return res.status(200).json({
        success: true,
        data: {
            payoutSchedule,
        },
    });
}

