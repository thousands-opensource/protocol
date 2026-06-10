import {
    MAX_LEADERBOARD_RANK,
    alphaSeriesZeroLeaderboardId,
    dreamHackLeaderboardId,
    eventLeaderboardId,
    nftLeaderboardId,
} from "@src/constants";
import {
    createOneArchiveLeaderboard,
    findOneLeaderboard,
    updateOneLeaderboard,
} from "@repo/schemas";
import { getPointsAndStatsForAlphaZeroLeaderboard } from "@src/leaderboards/alphaSeriesZero";
import {
    ILeaderboard,
    ILeaderboardRow,
    IUser,
    LeaderboardPointsAndStats,
    LeaderboardStats,
    PrevDayUserIdToRank,
    UserIdToStats,
} from "@repo/interfaces";
import { getLeaderboardMetaInfo } from "@src/leaderboards/leaderboardMeta";
import { processDiscordEventsForLeaderboards } from "@src/leaderboards/processDiscordEvents";
import { logError, logInfo } from "@src/logger";
import { FilterQuery } from "mongoose";
import { processKudosEventsForLeaderboards } from "./processKudosEvents";
import { LEADERBOARD_BLACKLISTED_WILDFILE_IDS } from "./leaderboardsBlacklist";
import { getPointsAndStatsForDreamHackLeaderboard } from "./dreamHack";
import { processPointsForLeaderboards } from "./processPoints";
import { getPointsAndStatsForNftLeaderboard } from "./nft";
import { getPointsAndStatsForEventLeaderboard } from "./event";
import { findUsersByQuery } from "@repo/schemas";
import { getActivePfpUrl, userIdentifier } from "@repo/utils";

export async function populateLeaderboards() {
    logInfo(`Populate leaderboards at ${Date()}`);

    //Use this when SxT is ready
    /*const response = await executeSxTSQLQuery(
        sqlTextQueryDiscordAttendanceMaterialisedView
    );*/
    //

    //Get only the leaderboards from the in memory array that are currently active
    let activeLeaderboardInfoArr: ILeaderboard[] =
        getActiveLeaderboardsFromMetaInfo();

    //Map of wildfiles to their respective stats
    let userIdToStatsMap: UserIdToStats = {};

    //get discordevent attendance and update userIdToStats
    await processDiscordEventsForLeaderboards(userIdToStatsMap);
    console.log("Finished processing discord events for leaderboard");

    //get kudos and update userIdToStats
    await processKudosEventsForLeaderboards(userIdToStatsMap);
    console.log("Finished processing kudos events for leaderboard");

    await processPointsForLeaderboards(userIdToStatsMap);
    console.log("Finished processing points for leaderboard");

    //Run through other wild events..

    //process all the users by going through the userIdToStats and calculating their score for each leaderboard
    await processAllUsers(userIdToStatsMap, activeLeaderboardInfoArr);
    console.log("Successfully calculating score per user");

    //Go through each leaderboard and update the leaderboard and write an archive
    for (const leaderboard of activeLeaderboardInfoArr) {
        //Sort the leaderboard and replace the leaderboardRows with the sorted object
        sortLeaderboardRows(leaderboard);

        //If there is a previous leaderboard we need to process the previous ranks from that leaderboard and write an archive, if not skip
        //There will always only be one leaderboard per id in the leaderboards table, but there will be many in the archive-leaderboards table
        const findOneLeaderboardQuery = {
            leaderboardId: leaderboard.leaderboardId,
        };
        await handleUpdateForPrevLeaderboard(
            leaderboard,
            findOneLeaderboardQuery
        );

        //Update the leaderboard with the updated rows from todays calculations
        const newLeaderboard: ILeaderboard = {
            leaderboardId: leaderboard.leaderboardId,
            name: leaderboard.name,
            description: leaderboard.description,
            leaderboardRows: leaderboard.leaderboardRows,
            leaderboardScoringDetails: leaderboard.leaderboardScoringDetails,
        };
        await updateOneLeaderboard(findOneLeaderboardQuery, newLeaderboard);
    }
    logInfo(`Finish Populate leaderboards at ${Date()}`);

    return;
}

/**
 * Process all users to accurately read userIdToStats and translate to correct leaderboardRows in each table they should be a part of
 * @param userIdToStats - map of wildfiles to their respective stats
 * @param activeLeaderboardInfoArr - list of active leaderboards to process
 */
async function processAllUsers(
    userIdToStats: UserIdToStats,
    activeLeaderboardInfoArr: ILeaderboard[]
) {
    //find the user in the db for each wildfile in our stats map
    for (const wildfileToRemove of LEADERBOARD_BLACKLISTED_WILDFILE_IDS) {
        delete userIdToStats[wildfileToRemove];
    }

    const usersArr = await getAllUsers(userIdToStats);
    console.log("Successfully retrieved all users");

    //go through each user to figure out points
    for (const user of usersArr) {
        const initialWildfileId =
            user.walletProvider.wildfile.initialWildfileId;
        if (!initialWildfileId) {
            logError(
                `${userIdentifier(user)} does not have a initialWildfileId`
            );
            continue;
        }
        const userStats: LeaderboardStats = userIdToStats[initialWildfileId];
        processUser(user, userStats, activeLeaderboardInfoArr);
    }
}

/**
 * Get all users and paginate because there could be thousands
 * @param userIdToStats - map of wildfiles to their respective stats
 */
async function getAllUsers(userIdToStats: UserIdToStats): Promise<IUser[]> {
    const allWildfiles = Object.keys(userIdToStats).map((item) => {
        return Number(item);
    });

    let usersArr: IUser[] = [];
    const batchSize = 500;
    const numBatches = Math.ceil(allWildfiles.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
        const currBatch = allWildfiles.splice(0, batchSize);
        const query = {
            "walletProvider.wildfile.initialWildfileId": { $in: currBatch },
        };
        const eligibleUsers: IUser[] = await findUsersByQuery(query, {
            _id: 1,
            "walletProvider.address": 1,
            "preferences.displayName": 1,
            "walletProvider.wildfile.initialWildfileId": 1,
            "walletProvider.pfp": 1,
            "preferences.showLinkedSocials": 1,
        });
        usersArr = usersArr.concat(eligibleUsers);
    }

    return usersArr;
}

/**
 * Controller function to triage individual logic out to leaderboard handler
 * @param leaderboard - current ILeaderboard object
 * @param userStats - LeaderboardStats for user being processed
 * @returns total number of points and filtered stats
 */
function getPointsAndFilteredStatsForLeaderboard(
    leaderboard: ILeaderboard,
    userStats: LeaderboardStats
): LeaderboardPointsAndStats {
    const leaderboardId = leaderboard.leaderboardId;
    if (leaderboardId === alphaSeriesZeroLeaderboardId) {
        return getPointsAndStatsForAlphaZeroLeaderboard(userStats, leaderboard);
    }

    if (leaderboardId === dreamHackLeaderboardId) {
        return getPointsAndStatsForDreamHackLeaderboard(userStats, leaderboard);
    }

    if (leaderboardId === nftLeaderboardId) {
        return getPointsAndStatsForNftLeaderboard(userStats, leaderboard);
    }

    if (leaderboardId === eventLeaderboardId) {
        return getPointsAndStatsForEventLeaderboard(userStats, leaderboard);
    }

    return { points: 0, updatedStats: userStats };
}

/**
 * Process each user by creating an ILeaderboardRow for each row they have some points in
 * @param user - current IUser
 * @param userStats - stats we have collected from this user
 * @param activeLeaderboardInfoArr - list of active leaderboards to process
 */
function processUser(
    user: IUser,
    userStats: LeaderboardStats,
    activeLeaderboardInfoArr: ILeaderboard[]
) {
    //loop through all leaderboards and update rows for the user in each leaderboard
    for (const leaderboard of activeLeaderboardInfoArr) {
        //Need a copy of user stats for each leaderboard because we only show stats relevant for that leaderboard
        const copyOfUserStats = JSON.parse(JSON.stringify(userStats));
        const { points, updatedStats } =
            getPointsAndFilteredStatsForLeaderboard(
                leaderboard,
                copyOfUserStats
            );
        if (points === 0) {
            //If they don't have a score or a score of zero then dont add
            continue;
        }
        let row: ILeaderboardRow = {
            rank: MAX_LEADERBOARD_RANK,
            prevRank: MAX_LEADERBOARD_RANK,
            userId: user?._id.toString(),
            score: points,
            pfpUrl: getActivePfpUrl(user),
            userStats: updatedStats,
        };
        if (user.preferences?.showLinkedSocials) {
            row.displayName = user.preferences.displayName || "";
        }
        leaderboard.leaderboardRows.push(row);
    }
}

/**
 * Remove any leaderboards with isFrozen set to true in the configuration
 * @returns only active leaderboards
 */
function getActiveLeaderboardsFromMetaInfo() {
    //Get the leaderboardMetaInfo template in the context of the function so it is cleaned up after running
    const inMemoryLeaderboardInfoArr: ILeaderboard[] = getLeaderboardMetaInfo();

    //filter the in memory leaderboards to remove any of the leaderboards that are frozen
    const activeLeaderboardInfoArr = inMemoryLeaderboardInfoArr.filter(
        (leaderboard) => !leaderboard.isFrozen
    );
    return activeLeaderboardInfoArr;
}

/**
 * Process the leaderboard to create a map for fast lookup times
 * @param prevDayLeaderboard - leaderboard from previous day
 * @returns - Get the PrevDayUserIdToRank
 */
function getPrevRankMap(prevDayLeaderboard: ILeaderboard) {
    //Preprocess the previous leaderboard to get a mapping of user to rank
    let rankMap: PrevDayUserIdToRank = {};
    const rows = prevDayLeaderboard.leaderboardRows;
    for (const row of rows) {
        const userId = row.userId;
        let prevRank = row.rank;
        //In the case the user did not have a rank, set to MAX_LEADERBOARD_RANK
        if (!prevRank) {
            prevRank = MAX_LEADERBOARD_RANK;
        }
        rankMap[userId] = prevRank;
    }
    return rankMap;
}

/**
 * Update current leaderboardRows to include the prevRank which is the rank from prevDayLeaderboard rows
 * @param prevDayLeaderboardRankMap - previous leaderboard ranking as a map for O(1) lookup
 * @param leaderboardRows - current in memory leaderboard rows
 */
function updateRankAndPrevRank(
    prevDayLeaderboardRankMap: PrevDayUserIdToRank,
    leaderboardRows: ILeaderboardRow[]
) {
    //Now add the prevRank to the current leaderboard and add the users rank as well by iterating through each index
    for (let i = 0; i < leaderboardRows.length; i++) {
        const leaderboardRow = leaderboardRows[i];
        //Rows are already sorted so we are just adding the rank here in order
        leaderboardRow.rank = i + 1;
        const prevRankFromMap =
            prevDayLeaderboardRankMap[leaderboardRow.userId];
        leaderboardRow.prevRank = prevRankFromMap
            ? prevRankFromMap
            : MAX_LEADERBOARD_RANK;
    }
}

/**
 * If leaderboard exists from before, create an archive and update today's leaderboard with correct prev ranks
 * @param leaderboard - todays leaderboard in memory
 * @param findOneLeaderboardQuery - query to use in mongo to find leaderboard
 */
async function handleUpdateForPrevLeaderboard(
    leaderboard: ILeaderboard,
    findOneLeaderboardQuery: FilterQuery<ILeaderboard>
) {
    //Pull entire leaderboard from day before and match each user to get prev rank
    //If the leaderboard has not been created just return and show everyone's rank as MAX_LEADERBOARD_RANK so it shows upward movement
    const prevDayLeaderboard = await findOneLeaderboard(
        findOneLeaderboardQuery
    );

    let prevDayLeaderboardRankMap: PrevDayUserIdToRank = {};
    if (prevDayLeaderboard) {
        //write the archive of the old leaderboard
        const prevDayLeaderboardFormatted: ILeaderboard = {
            leaderboardId: prevDayLeaderboard.leaderboardId,
            description: prevDayLeaderboard.description,
            name: prevDayLeaderboard.name,
            leaderboardRows: prevDayLeaderboard.leaderboardRows,
            leaderboardScoringDetails:
                prevDayLeaderboard.leaderboardScoringDetails,
        };
        await createOneArchiveLeaderboard(prevDayLeaderboardFormatted);

        //Get the previous day ranking map
        prevDayLeaderboardRankMap = getPrevRankMap(prevDayLeaderboard);
    }
    //Update the prev rank in every entry in leaderboard rows based on the prevDayLeaderboard, if no prev then we are just adding the rank so be sure this is run
    updateRankAndPrevRank(
        prevDayLeaderboardRankMap,
        leaderboard.leaderboardRows
    );
}

/**
 * Sort the ILeaderboardRows based on score property and update the leaderboard object
 * @param leaderboard - leader board with unsorted ILeaderboardRows
 */
function sortLeaderboardRows(leaderboard: ILeaderboard) {
    const sortedLeaderboardRows = leaderboard.leaderboardRows.sort(
        (rowA: ILeaderboardRow, rowB: ILeaderboardRow) => {
            const rowAScore = rowA.score;
            const rowBScore = rowB.score;
            if (rowAScore > rowBScore) {
                return -1;
            } else if (rowBScore > rowAScore) {
                return 1;
            }
            return rowA.userId < rowB.userId ? -1 : 1;
        }
    );
    leaderboard.leaderboardRows = sortedLeaderboardRows;
}
