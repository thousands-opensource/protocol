import connectToDb from "@/db/connectToDb";
import {
    ILeaderboard,
    WildcardApiResponse,
    LEADERBOARD_PAGE_SIZE,
} from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { findLeaderboardsByQuery } from "@repo/schemas";
import { getApiCacheResponseDurationMinutes } from "@/utils/environmentUtil";
/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    // set cache headers to cache for 100 seconds and then stale for 1 second
    const API_CACHE_RESPONSE_DURATION_SECONDS =
        getApiCacheResponseDurationMinutes() * 60;

    res.setHeader(
        "Cache-Control",
        `s-maxage=${API_CACHE_RESPONSE_DURATION_SECONDS}`
    );

    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const page = req.query.pageNum
            ? parseInt(req.query.pageNum as string)
            : 0;
        const leaderboardId: string = req.query.leaderboardId
            ? (req.query.leaderboardId as string)
            : "";
        //query options - get us a page for each leaderboard
        const leaderboards: ILeaderboard[] = await fetchLeaderboards(
            page,
            leaderboardId
        );
        const war: WildcardApiResponse = { success: true, data: leaderboards };
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to fetch leaderboards", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to fetch leaderboards ${e.message}`,
        });
    }
}

/**
 * Fetch leaderboards
 * @param page 0-based index of the page
 * @param leaderboardId Specifies leaderboardId to fetch specific leaderboard or empty string "" to fetch all
 * @returns list of leaderboard objects
 */
export async function fetchLeaderboards(
    page: number,
    leaderboardId: string
): Promise<ILeaderboard[]> {
    let query: any = { isFullyArchived: { $ne: true } };
    if (leaderboardId) {
        query = { ...query, leaderboardId };
    }
    //query options - get us a page for each leaderboard
    const leaderboards: ILeaderboard[] = await findLeaderboardsByQuery(query, {
        //leave in "_id: 0" or else there is a mongo issue with 'Cannot do exclusion on field in inclusion projection'
        _id: 0,
        leaderboardRows: {
            $slice: [LEADERBOARD_PAGE_SIZE * page, LEADERBOARD_PAGE_SIZE],
        },
    });
    return leaderboards;
}

export default handler;
