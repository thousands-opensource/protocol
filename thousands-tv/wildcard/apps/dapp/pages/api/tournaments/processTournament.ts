import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import { diContainer } from "@/inversify.config";
import ITournamentsRepository from "@/repositories/interfaces/ITournamentsRepository";
import IPlayerEarningsRepository from "@/repositories/interfaces/IPlayerEarningsRepository";
import ITournamentCacheRepository from "@/repositories/interfaces/ITournamentCacheRepository";

export const config = {
  maxDuration: 120, // seconds
};

//const handler = async (req: NextApiRequest, res: NextApiResponse) => {
async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("Start process-tournaments");

    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
    }

    const apiKey = req.headers["x-api-key"];
    const serverApiKey = getGameDataApiKey();

    if (!apiKey || !serverApiKey || apiKey !== serverApiKey) {
        return sendApiResponse(res, {
            success: false,
            err: "Unauthorized: Missing or Invalid API key",
        });
    }

    try {
        const tournamentsRepository =
            diContainer.get<ITournamentsRepository>(
                "ITournamentsRepository"
            );
        const playerEarningsRepository =
            diContainer.get<IPlayerEarningsRepository>(
                "IPlayerEarningsRepository"
            );
        const tournamentCacheRepository =
            diContainer.get<ITournamentCacheRepository>(
                "ITournamentCacheRepository"
            );

        const tournaments = await tournamentsRepository.getAllTournaments();

        for (const tournament of tournaments) {
            const tid = tournament?.tid?.toString();
            if (!tid) {
                continue;
            }

            if (!tournament?.as) {
                console.log(
                    `Skipping tournament ${tid} because auto-settlement is disabled.`
                );
                continue;
            }

            const tournamentOption =
                await tournamentsRepository.getTournamentOptionByTid(tid);
            if (
                !tournamentOption?.payoutSchedule ||
                !("schedule" in tournamentOption.payoutSchedule)
            ) {
                console.warn(
                    `Skipping tournament ${tid} because payout schedule is not configured.`
                );
                continue;
            }

            const scheduleEntries =
                (tournamentOption.payoutSchedule as any).schedule || [];
            if (!scheduleEntries.length) {
                console.warn(
                    `Skipping tournament ${tid} because payout schedule has no entries.`
                );
                continue;
            }
            const maxPaidRank = scheduleEntries.reduce(
                (max: number, entry: { range?: [number, number] }) => {
                    const end = Array.isArray(entry.range)
                        ? entry.range[1]
                        : 0;
                    return Math.max(max, end || 0);
                },
                0
            );

            const alreadyProcessed =
                await tournamentCacheRepository.isTournamentTidInSet(tid);
            if (alreadyProcessed) {
                console.log(`Skipping already processed tournament ${tid}`);
                continue;
            }

            if (!tournament?.r?.length) continue;
            const listOfGamerTagsProcessed: string[] = [];
            if (!tournament?.p === true) continue;
            console.log(tid);
            for (let rank = 0; rank < tournament.r.length; rank++) {
                const reward = tournament.r[rank];
                const adjustedRank = rank + 1;
                // Only process ranks included in the payout schedule
                if (adjustedRank <= maxPaidRank) {
                    const gamerTagToProcess = reward.gt.toString();
                    console.log(
                        adjustedRank + " " + reward.gt + " - " + reward.s
                    );
                    //Use tournamentPayoutSchedule top convert rank to amountInCents
                    const rewardScheduleEntry = scheduleEntries.find(
                        (entry: { range?: [number, number]; amountInCents?: number }) =>
                            Array.isArray(entry.range) &&
                            adjustedRank >= entry.range[0] &&
                            adjustedRank <= entry.range[1]
                    );
                    const rewardAmountInCents =
                        rewardScheduleEntry?.amountInCents ?? 0;

                    console.log(rewardAmountInCents);

                    //Only process players who are getting a reward
                    if (rewardAmountInCents > 0) {
                        await playerEarningsRepository.addPlayerEarningsTransaction(
                            gamerTagToProcess,
                            "daily",
                            rewardAmountInCents,
                            tid
                        );
                        listOfGamerTagsProcessed.push(gamerTagToProcess);
                    }
                }
            }

            //Update balances
            for (var gamerTag of listOfGamerTagsProcessed) {
                const playerEarningsTransactions =
                    await playerEarningsRepository.getPlayerEarningsTransactions(
                        gamerTag
                    );

                var playerEarningsTransactionsBalance = 0;
                if (
                    playerEarningsTransactions &&
                    playerEarningsTransactions.length > 0
                ) {
                    for (const playerEarningsTransaction of playerEarningsTransactions) {
                        playerEarningsTransactionsBalance +=
                            playerEarningsTransaction.amount;
                    }
                }

                await playerEarningsRepository.addOrUpdatePlayerEarnings(
                    gamerTag,
                    playerEarningsTransactionsBalance
                );
            }

            await tournamentCacheRepository.addTournamentTidToSet(tid);
        }

        sendApiResponse(res, { success: true });
    } catch (error) {
        console.error("Failed to process tournaments", error);
        sendApiResponse(res, {
            success: false,
            err: "Failed to process tournaments",
        });
    }
};

export default handler;
