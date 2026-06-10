import { ARCHIVE_LEADERBOARD_BATCH_SIZE, LEADERBOARD_ID } from "@src/constants";
import { findOneLeaderboard, updateOneLeaderboard } from "@repo/schemas";
import { logError, logInfo } from "@src/logger";
import { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { ILeaderboard } from "@repo/interfaces";
import { getLeaderboardChannelId } from "@src/util/environmentUtil";
import { UpdateQuery } from "mongoose";
import { getChannel } from "@src/util/discordUtil";

/**
 * Handles the interaction to archive a leaderboard with the given leaderboardId.
 * @param interaction - The ChatInputCommandInteraction object from Discord.
 */
export async function archiveLeaderboard(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Archiving Leaderboard...",
        ephemeral: true,
    });

    const adminDiscordTag = interaction.user.tag;
    const leaderboardId = interaction.options.getString(LEADERBOARD_ID) || "";

    logInfo(`${adminDiscordTag} is archiving "${leaderboardId}"`);

    //--- CHECKS
    // Confirm leaderboard exists
    const leaderboardFilterQuery = { leaderboardId };
    const leaderboard: ILeaderboard = await findOneLeaderboard(
        leaderboardFilterQuery
    );
    if (!leaderboard) {
        const errMsg = `There is no leaderboard with id ${leaderboardId} that is ready to be archived on chain.`;
        logError(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Don't create transactions to archive if it is already fully archived, if needed investigate with dev team
    if (leaderboard.isFullyArchived) {
        const msg = `The leaderboard with id ${leaderboardId} has already been fully archived.`;
        logInfo(msg);
        await interaction.editReply({ content: msg });
        return;
    }
    //--- END CHECKS
    try {
        const leaderboardRows = leaderboard.leaderboardRows;

        const numberOfPages = Math.ceil(
            leaderboardRows.length / ARCHIVE_LEADERBOARD_BATCH_SIZE
        );
        const pagesNums: number[] = Array.from(
            { length: numberOfPages },
            (_, i) => i + 1
        );

        const leaderboardUpdateQuery: UpdateQuery<ILeaderboard> = {
            isFullyArchived: true,
            pagesNums,
        };

        await updateOneLeaderboard(
            leaderboardFilterQuery,
            leaderboardUpdateQuery
        );

        logInfo(
            `Processing Archive Leaderboard messaging for leaderboard [${leaderboardId}]`
        );

        //----- Retrieve Leaderboard Channel
        const leaderboardChannelId = getLeaderboardChannelId();
        if (!leaderboardChannelId) {
            const errMsg = `Cannot retrieve leaderboard channel, LEADERBOARD_CHANNEL_ID env var must be set before archiving the leaderboard.`;
            logError(errMsg);
            await interaction.editReply(errMsg);
            return;
        }

        // Log the successful creation of the transaction queue
        const leaderboardChannelTag = leaderboardChannelId
            ? `<#${leaderboardChannelId}>`
            : "Leaderboard Channel";
        const summaryMsg = `A Leaderboard ${leaderboardId} has been archived with ${numberOfPages} pages.\nGo to the Leaderboard Channel ${leaderboardChannelTag} to see the results!`;
        logInfo(summaryMsg);
        interaction.editReply(summaryMsg);

        let leaderboardChannel: TextChannel;
        try {
            leaderboardChannel = await getChannel(leaderboardChannelId);
        } catch (e) {
            const errMsg = `Unable to retrieve leaderboard channel, please check that the LEADERBOARD_CHANNEL_ID env var is correctly set.`;
            logInfo(errMsg);
            logError(errMsg);
            await interaction.editReply(errMsg);
            return;
        }
    } catch (e) {
        const errMsg = `Failed to handle the Archive Leaderboard event for leaderboard ${leaderboardId}: ${e.message}`;
        logError(errMsg, e);
        await interaction.editReply(errMsg);
    }
}
