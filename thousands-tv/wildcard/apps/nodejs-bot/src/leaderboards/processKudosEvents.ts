import { countKudosDocument, findKudosByQuery } from "@repo/schemas";
import { IKudosEvent, KudosType, UserIdToStats } from "@repo/interfaces";
import { addToMapProperty, ensureMapsAreCreated } from "./leaderboardUtil";
import { logError } from "@src/logger";

/**
 * Entry point to process all kudos events for leaderboards
 * @param userIdToStats - stats map for all users
 */
export async function processKudosEventsForLeaderboards(
    userIdToStats: UserIdToStats
) {
    // Get total number of user from matching query
    const totalKudosGiven = await countKudosDocument(null);
    let totalKudos: IKudosEvent[] = [];

    // Batch 5000 kudos to avoid too many calls, but we do not want to exceed 10MB on retrieval
    let iteration = 0;
    const batchSize = 5000;
    while (iteration * batchSize < totalKudosGiven) {
        const kudos: IKudosEvent[] = await findKudosByQuery(null, null, {
            limit: batchSize,
            skip: iteration * batchSize,
        });

        totalKudos = totalKudos.concat(kudos);
        iteration += 1;
    }

    for (const kudos of totalKudos) {
        const userId = kudos.recipientUserId.toString();
        ensureMapsAreCreated(userId, userIdToStats);
        const userStats = userIdToStats[userId];
        try {
            const kudosType: KudosType = kudos.type;
            addToMapProperty(userStats, kudosType, 1);
        } catch (e) {
            logError(
                "There was an issue getting kudos type and adding to map",
                e
            );
        }
    }
}
