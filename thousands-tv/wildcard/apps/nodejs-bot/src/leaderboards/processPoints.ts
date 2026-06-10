import { IPoints, UserIdToStats } from "@repo/interfaces";
import { addToMapProperty, ensureMapsAreCreated } from "./leaderboardUtil";
import { logError } from "@src/logger";
import { countPointDocument, findManyPointsByQuery } from "@repo/schemas";
import { getTotalPoints } from "@repo/utils";

async function fetchPoints(): Promise<IPoints[]> {
    const query = {}; // {seriesId: ''}
    const totalPointsDocument = await countPointDocument(query);
    let points: IPoints[] = [];
    let iteration = 0;
    const batchSize = 500;
    while (iteration * batchSize < totalPointsDocument) {
        const pointsArr: IPoints[] = await findManyPointsByQuery(query, null, {
            limit: batchSize,
            skip: iteration * batchSize,
        });

        points = points.concat(pointsArr);
        iteration += 1;
    }

    return points;
}

/**
 * @param userIdToStats - stats map for all users
 */
export async function processPointsForLeaderboards(
    userIdToStats: UserIdToStats
) {
    let points: IPoints[] = await fetchPoints();

    for (const point of points) {
        ensureMapsAreCreated(point.userId, userIdToStats);
        // total nft points
        const totalUserNftPoints = getTotalPoints(point.nftPoints);
        // total event points
        const totalUserEventPoints = getTotalPoints(point.eventPoints);
        try {
            const userStats = userIdToStats[point.userId];
            addToMapProperty(userStats, "wildpassNftPoint", totalUserNftPoints);
            addToMapProperty(userStats, "eventPoint", totalUserEventPoints);
        } catch (e) {
            logError(
                "There was an issue getting nft/event point and adding to map",
                e
            );
        }
    }
}
