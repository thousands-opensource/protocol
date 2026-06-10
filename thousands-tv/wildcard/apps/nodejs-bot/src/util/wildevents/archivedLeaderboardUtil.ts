import { ARCHIVED_LEADERBOARD_WILDEVENT_CONTRACT } from "@src/contracts/wildevents/types/ArchivedLeaderboardWildevent";
import { ArchivedLeaderboardWildevent, Wildevent } from "@src/types";

export async function decodeArchivedLeaderboardWildevents(
    wildevents: Wildevent[]
): Promise<string> {
    let msg = "";
    await Promise.all(
        wildevents.map(async (wildevent) => {
            const eventId = wildevent.wildeventId;
            const attestor = wildevent.attestorWildfileId;
            const wildfileIds = wildevent.wildfileIds;
            const decodedData: ArchivedLeaderboardWildevent =
                await ARCHIVED_LEADERBOARD_WILDEVENT_CONTRACT.decode(
                    wildevent.data
                );

            msg += `\tWildevent Id: ***${eventId}***
\tAttestor Wildfile Id: ***${attestor}***
\tWildfile Ids: ***[ ${wildfileIds.slice(0, 3).join(", ")} ] and ${
                wildfileIds.length - 3
            } others***
\tLeaderboard Id: ***${decodedData.leaderboardId}***
\tPage Num: ***${decodedData.pageNum}***
\tScores: ***[ ${decodedData.scores.slice(0, 3).join(", ")} ] and ${
                decodedData.scores.length - 3
            } others***
\n`;
        })
    );

    return msg;
}
