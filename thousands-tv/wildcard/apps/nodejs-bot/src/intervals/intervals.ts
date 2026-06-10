import axios from "axios";
import {
    getBotWalletBalanceCheckIntervalMin,
    getConcludeAirdropIntervalSeconds,
    getDiscordGuildId,
    getDiscordTagSyncIntervalSeconds,
    getMinBotWalletMATICBalance,
    getUpdateAirdropEmbedsIntervalSeconds,
    getPrivateAdminChannelId,
    getReconcilePfpIntervalSeconds,
    getSendWildfileMintStats,
    getUptimeHeartbeatIntervalSeconds,
    getUptimeHeartbeatUrl,
    isProdEnvironment,
    getLeaderboardCronJob,
    getBadgeCronJob,
    getPointsCronJob,
} from "@src/util/environmentUtil";

import {
    alertAirdropAdmins,
    removeNewUsernameDiscriminator,
    sendMessageToChannel,
} from "@src/util/discordUtil";
import { updateAirdropEmbed } from "@src/util/embedUtil";
import { concludeAirdrop } from "../commands/airdrop-admin/concludeAirdrop";
import { logError, logInfo } from "@src/logger";
import { client } from "@src/index";
import { reconcilePfps } from "@src/intervals/reconcilePfps";
import { populateLeaderboards } from "../leaderboards/populateLeaderboards";
import {
    getDiscordBotWalletAddress,
    getDiscordBotWalletBalance,
} from "@src/util/blockchainUtil";
import { getAirdropAdminRole, roleExists } from "@src/util/roleUtil";
import { Role } from "discord.js";
import { populateBadges } from "@src/badges/index";
import { processTransactionQueue } from "@src/transactionQueue/processTransactionQueue";
import { TEN_SECS_IN_MS } from "@src/constants";
import { IUser, TransactionStatusEnum } from "@repo/interfaces";
import { populatePoints } from "@src/points";
import {
    findAirdropsByQuery,
    aggregateUserDB,
    findUsersByQuery,
    updateOneUserDB,
    findTransactionQueuesByQuery,
    updateTransactionQueueDB,
} from "@repo/schemas";
const cron = require("node-cron");

/**
 * Sets up the bot's various intervals (background jobs)
 */
export async function setupIntervals() {
    // // start interval that updates airdrop embeds
    // startUpdateAirdropEmbedsInterval();
    // // start bot token balance checking interval
    // startCheckBotBalanceInterval();
    // // start interval for uptime monitoring
    // startUptimeHeartbeatInterval();
    // // start interval for that checks and concludes airdrops
    // startConcludeAirdropInterval();
    // // start interval to keep Discord Tags in the DB in sync with live data
    // startDiscordTagSyncingInterval();
    // // start interval to reconcile pfp and favorite pfps
    // startReconcilePfpInterval();
    // // start interval to report wildfiles minted
    // startWildfileMintedStatsInterval();
    //start timeouts for processing transaction queue
    startTransactionQueueReconciliationAndTimeout();
    // //start cron job for populating leaderboards
    // populateLeaderBoardsCron();
    // //start cron job for populating badge
    // populateBadgeCron();
    // //start cron job for updating points
    // startUpdatePointsCron();
}

/**
 * Sets up interval that updates active airdrop embeds with the number of users who are
 * eligible for the airdrop (have the role), and the number of users who have claimed the airdrop
 */
function startUpdateAirdropEmbedsInterval() {
    const intervalSeconds = getUpdateAirdropEmbedsIntervalSeconds();
    logInfo(
        `Starting interval to update airdrop embeds. Interval (sec): ${intervalSeconds}`
    );

    const intervalMs = intervalSeconds * 1000;

    // trigger the interval right away
    handleUpdateAirdropEmbeds();
    // setup the interval
    setInterval(handleUpdateAirdropEmbeds, intervalMs);

    async function handleUpdateAirdropEmbeds() {
        try {
            const activeAirdropDocs = await findAirdropsByQuery({
                active: true,
                broadcastMessageId: { $exists: true, $nin: ["", null] },
            });
            for (const activeAirdropDoc of activeAirdropDocs) {
                try {
                    const roleId = activeAirdropDoc.roleRequiredId;
                    const doesRoleExist = await roleExists(roleId);
                    if (!doesRoleExist) {
                        logInfo(
                            `Not updating airdrop embed, role ${roleId} does not exist`
                        );
                        continue;
                    }

                    await updateAirdropEmbed(activeAirdropDoc);
                } catch (e) {
                    logError(
                        `Error in interval updating airdrop embed ${activeAirdropDoc._id}`,
                        e
                    );
                }
            }
        } catch (e) {
            logError("Error in interval updating airdrop embeds", e);
        }
    }
}

/**
 * Sets up interval to check bot token balance
 */
function startCheckBotBalanceInterval() {
    const intervalMin = getBotWalletBalanceCheckIntervalMin();
    logInfo(
        `Starting interval to check bot token balance. Interval (min): ${intervalMin}`
    );

    // trigger the check right away
    handleBotWalletBalanceCheck();

    // and then setup the interval
    const intervalMs = intervalMin * 60 * 1000;
    setInterval(handleBotWalletBalanceCheck, intervalMs);

    async function handleBotWalletBalanceCheck() {
        try {
            logInfo("Checking bot wallet MATIC balance");
            const balance = await getDiscordBotWalletBalance();
            const minMATICBalanceRequired = getMinBotWalletMATICBalance();

            if (balance < minMATICBalanceRequired) {
                console.warn(
                    `Bot wallet MATIC balance too low: ${balance}, minMATICBalance: ${minMATICBalanceRequired}`
                );
                const airdropAdminRole: Role = await getAirdropAdminRole();

                // send low matic balance notification to private admin channel
                await alertAirdropAdmins(
                    `${airdropAdminRole} My MATIC balance is getting low, please send more MATIC to my address *${getDiscordBotWalletAddress()}*\nCurrent Balance: **${balance}** MATIC`
                );
            } else {
                logInfo(`Bot wallet MATIC balance OK: ${balance}`);
            }
        } catch (e) {
            logError("Error in interval checking bot wallet MATIC balance", e);
        }
    }
}

/**
 * Sets regular interval to ping heartbeat endpoint. Downtime would result in alerts being sent via BetterTime
 * https://elements.heroku.com/addons/betteruptime
 */
function startUptimeHeartbeatInterval() {
    // Do not send heartbeat if not prod
    if (!isProdEnvironment()) {
        logInfo("Not starting uptime heartbeat. Environment is not prod");
        return;
    }

    const uptimeHeartbeatUrl = getUptimeHeartbeatUrl();
    if (!uptimeHeartbeatUrl) {
        console.warn(
            "Not starting uptime heartbeat interval, UPTIME_HEARTBEAT_URL env var not set"
        );
        return;
    }

    const uptimeHeartbeatIntervalSeconds = getUptimeHeartbeatIntervalSeconds();
    logInfo(
        `Starting uptime heartbeat on ${uptimeHeartbeatIntervalSeconds} second interval, pinging URL: ${uptimeHeartbeatUrl}`
    );

    sendHeartbeat();
    setInterval(sendHeartbeat, uptimeHeartbeatIntervalSeconds * 1000);

    async function sendHeartbeat() {
        try {
            const response = await axios.get(uptimeHeartbeatUrl);
            if (response.status !== 200) {
                logError(`Heartbeat failed with status ${response.status}`);
            }
        } catch (e) {
            logError("Uptime heartbeat failed", e);
        }
    }
}

/**
 * Sets up interval to auto conclude airdrops
 */
function startConcludeAirdropInterval() {
    const concludeAirdropIntervalSeconds = getConcludeAirdropIntervalSeconds();
    logInfo(
        `Starting interval to conclude airdrops. Interval (sec): ${concludeAirdropIntervalSeconds}`
    );

    // setup the interval
    // Do not trigger the check right away to prevent race condition with people being added to the thread after it has been locked
    setInterval(concludeAirdrops, concludeAirdropIntervalSeconds * 1000);

    // get list of active airdrops
    async function concludeAirdrops() {
        try {
            // get all active expired airdrops where airdrops have ended (end date < now)
            const airdropsToConclude = await findAirdropsByQuery({
                active: true,
                concludesAt: { $exists: true, $lt: new Date() },
            });

            for (const airdrop of airdropsToConclude) {
                try {
                    logInfo(
                        `Automatically concluding airdrop (${airdrop._id}), roleId ${airdrop.roleRequiredId}, tokenId ${airdrop.tokenId}`
                    );

                    // auto conclude airdrop
                    await concludeAirdrop(airdrop);
                } catch (e) {
                    logError(
                        `Failed to conclude airdrop ${airdrop._id} in interval`,
                        e
                    );
                }
            }
        } catch (e) {
            logError("Failed to conclude airdrops in interval", e);
        }
    }
}

function startDiscordTagSyncingInterval() {
    const intervalSeconds = getDiscordTagSyncIntervalSeconds();
    logInfo(
        `Starting interval to sync Discord tags. Interval (sec): ${intervalSeconds}`
    );

    const intervalMs = intervalSeconds * 1000;

    // core functionality to sync discord Tag
    //handleDiscordTagSync();
    // setup the interval
    setInterval(handleDiscordTagSync, intervalMs);
}

/**
 * Sets up interval to sync Discord tags
 */
async function handleDiscordTagSync() {
    try {
        logInfo("Syncing discord usernames");

        const guildId = getDiscordGuildId();
        const guild = await client.guilds.fetch(guildId);
        const members = await guild.members.fetch();

        // Extract discordIds from members
        const discordIds = members.map((member) => member.id);

        // Get all users with those discordIds from DB
        const query = { "discordProvider.id": { $in: discordIds } };
        const users: IUser[] = await findUsersByQuery(query);

        // Convert users array to a Map for quick lookup
        const usersMap = new Map(
            users.map((user) => [user.discordProvider.id, user])
        );

        members.forEach(async (member) => {
            const discordId = member.id;
            try {
                const updatedDiscordTag = removeNewUsernameDiscriminator(
                    member.user.tag
                );

                const user = usersMap.get(discordId);
                if (
                    user &&
                    user.discordProvider?.discordTag !== updatedDiscordTag
                ) {
                    await updateOneUserDB(
                        { _id: user._id },
                        {
                            "user.discordProvider.discordTag":
                                updatedDiscordTag,
                        }
                    );

                    logInfo(
                        `Synced tag for discord id ${discordId}. Old tag: ${user.discordProvider?.discordTag} New tag: ${updatedDiscordTag}`
                    );
                }
            } catch (e) {
                logError(`Failed to sync tag for user ${discordId}`, e);
            }
        });
    } catch (e) {
        logError("Error in interval syncing Discord tags", e);
    }
}

function startReconcilePfpInterval() {
    const intervalSeconds = getReconcilePfpIntervalSeconds();
    logInfo(
        `Starting interval to reconcile pfps. Interval: ${intervalSeconds} seconds`
    );
    const intervalMs = intervalSeconds * 1000;

    //reconcilePfps();

    setInterval(reconcilePfps, intervalMs);
}

function populateLeaderBoardsCron() {
    const leaderboardCronJob = getLeaderboardCronJob();
    logInfo(
        `Creating cron job to create leaderboards. Cron expression: ${leaderboardCronJob} seconds`
    );

    // populateLeaderboards();
    cron.schedule(leaderboardCronJob, populateLeaderboards, {
        timezone: "America/Los_Angeles",
    });
}

function populateBadgeCron() {
    const badgeCronJob = getBadgeCronJob();
    logInfo(
        `Creating cron job to create badges. Cron expression: ${badgeCronJob} seconds`
    );

    //populateBadges();
    cron.schedule(badgeCronJob, populateBadges, {
        timezone: "America/Los_Angeles",
    });
}

function startUpdatePointsCron() {
    const updatePointsCronJob = getPointsCronJob();
    logInfo(
        `Creating cron job to update points. Cron expression: ${updatePointsCronJob} seconds`
    );

    // populatePoints();
    cron.schedule(updatePointsCronJob, populatePoints, {
        timezone: "America/Los_Angeles",
    });
}

function startWildfileMintedStatsInterval() {
    if (!getSendWildfileMintStats()) {
        logInfo("Not starting interval to send Wildfile mint stats");
        return;
    }

    // interval is 1 day
    const intervalSeconds = 86400;
    const intervalMs = intervalSeconds * 1000;

    logInfo(
        `Starting interval to send Wildfile mint stats. Interval (sec): ${intervalSeconds}`
    );

    sendWildfileMintStatsMessage();
    setInterval(sendWildfileMintStatsMessage, intervalMs);

    async function sendWildfileMintStatsMessage() {
        try {
            const pipeline = [
                {
                    //TODO - create ticket for this to be implemented in the new schema
                    $group: {
                        _id: "$wildfile.mintType", // Group by the `mintWildfileType` field
                        count: { $sum: 1 }, // Count the number of documents in each group
                    },
                },
            ];
            const wildfileMintStats = await aggregateUserDB(pipeline);
            let numWildpass = 0;
            let numAllowlist = 0;
            let numPublic = 0;
            let totalMinted = 0;

            wildfileMintStats.forEach(
                (stat: { _id: string; count: number }) => {
                    const count = stat.count;
                    const mintType = stat._id;
                    switch (mintType) {
                        case "wildpass":
                            numWildpass += count;
                            break;
                        case "allowlist":
                            numAllowlist += count;
                            break;
                        case "public":
                            numPublic += count;
                            break;
                    }
                }
            );

            totalMinted = numWildpass + numAllowlist + numPublic;

            const wildfileMintStatsMsg = `Wildfile mint stats. Total minted: ***${totalMinted}***
- Wildpass: ***${numWildpass}***
- Allowlist: ***${numAllowlist}***
- Public: ***${numPublic}***
`;

            await sendMessageToChannel(
                getPrivateAdminChannelId(),
                wildfileMintStatsMsg
            );
        } catch (e) {
            logError("Failed to send wildfile mint stats message", e);
        }
    }
}

async function startTransactionQueueReconciliationAndTimeout() {
    //Handle reconciliation by finding all in progress transactions - shouldn't be any because bot is starting up.
    //If there is one, this was because of bot shutting down in middle of process - set all in progress to ready
    logInfo(
        `Starting interval to reconcile transaction queue and reconile in progress transactions`
    );
    const searchQuery = { status: TransactionStatusEnum.IN_PROGRESS };
    const inProgressTransactionJobs = await findTransactionQueuesByQuery(
        searchQuery
    );
    for (const inProgressTransactionJob of inProgressTransactionJobs) {
        logInfo(
            `Reconciling Transaction Queue: ${inProgressTransactionJob._id}`
        );
        const updateQuery = { _id: inProgressTransactionJob._id };
        const update = { status: TransactionStatusEnum.READY };
        await updateTransactionQueueDB(updateQuery, update);
    }
    startTransactionQueueTimeout();
}

async function startTransactionQueueTimeout() {
    let timeToWait = TEN_SECS_IN_MS;
    try {
        timeToWait = await processTransactionQueue();
    } catch (e) {
        logError("Error in interval processing the transaction queue", e);
    }
    setTimeout(startTransactionQueueTimeout, timeToWait);
}
