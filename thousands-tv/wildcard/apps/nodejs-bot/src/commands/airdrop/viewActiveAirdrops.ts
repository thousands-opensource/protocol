import { findAirdropsByQuery } from "@repo/schemas";
import {
    DISCORD_MAX_STRING_LENGTH,
    isMemberInChannel,
} from "@src/util/discordUtil";
import { getDiscordGuildId } from "@src/util/environmentUtil";
import { getRole } from "@src/util/roleUtil";
import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Role,
} from "discord.js";
import { logInfo } from "@src/logger";
import { IAirdrop } from "@repo/interfaces";

/**
 * Command handler for /airdrop view-active-airdrops
 * @param interaction
 */
export async function handleViewActiveAirdropsCommand(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Retrieving list of active airdrops",
        ephemeral: true,
    });

    logInfo(`${interaction.user.tag} is retrieving list of active airdrops`);

    const activeAirdrops = await findAirdropsByQuery({ active: true });

    //Default content when there are no active airdrops
    if (activeAirdrops.length === 0) {
        const replyContent = "There are no active airdrops";
        logInfo(replyContent);
        await interaction.editReply(replyContent);
        return;
    }

    //If there are active airdrops, show proper title and embed
    const embedContent = await buildActiveAirdropsEmbed(
        activeAirdrops,
        interaction.member as GuildMember
    );

    await interaction.editReply({
        content: "",
        embeds: embedContent,
    });
}

/**
 * Builds active airdrops embed
 * @param activeAirdrops - An array of active airdrops
 * @param guildMember - guild member object to get user and see if user has particular role(s)
 * @returns discord embed structure
 */
async function buildActiveAirdropsEmbed(
    activeAirdrops: IAirdrop[],
    guildMember: GuildMember
): Promise<EmbedBuilder[]> {
    let rewardRoles: string[] = [];
    let rewardTokens: string[] = [];
    let eligibleAndClaimedList: string[] = [];
    const embeds: EmbedBuilder[] = [];

    //Loop through all active airdrops and create table for querying user
    for (let i = 0; i < activeAirdrops.length; i++) {
        const airdrop: IAirdrop = activeAirdrops[i];
        const inChannel = await isMemberInChannel(
            airdrop.broadcastChannelId,
            guildMember.id
        );
        if (!inChannel) {
            continue;
        }
        const role: Role = await getRole(airdrop.roleRequiredId);
        //In case a role no longer exists just show what the role id was
        const rewardRole = role ? role.toString() : airdrop.roleRequiredId;

        const rewardTokenDisplayName =
            airdrop.tokenMetadata.name || airdrop.tokenId;
        const airdropChannelMessageUrl = `https://discord.com/channels/${getDiscordGuildId()}/${
            airdrop.broadcastChannelId
        }/${airdrop.broadcastMessageId}`;
        const rewardToken = `[${rewardTokenDisplayName}](${airdropChannelMessageUrl})`;

        //Combine the isEligible and the has claimed in one column
        const isEligible = guildMember.roles.cache.has(airdrop.roleRequiredId);

        let hasClaimed = false;
        for (const aeu of airdrop.airdropEligibleUsers) {
            if (aeu.discordId === guildMember.user.id && aeu.hasClaimed) {
                hasClaimed = true;
            }
        }
        const eligibleAndClaimed = `${isEligible} / ${hasClaimed}`;

        // check what length our longest embed string is at to ensure we are within discord limits
        // use rewardToken since this field will always be longest of the three
        const newLengthToAdd = rewardToken.length;
        const msgLength = rewardTokens.join("\n").length;
        if (msgLength + newLengthToAdd <= DISCORD_MAX_STRING_LENGTH) {
            // append to existing string arrays to be used for embed
            rewardRoles.push(rewardRole);
            rewardTokens.push(rewardToken);
            eligibleAndClaimedList.push(eligibleAndClaimed);
        } else {
            // create and add new embed
            const newEmbed = createEmbed(
                rewardRoles,
                rewardTokens,
                eligibleAndClaimedList,
                true
            );
            embeds.push(newEmbed);

            // set arrays for next batch of airdrops
            rewardRoles = [rewardRole];
            rewardTokens = [rewardToken];
            eligibleAndClaimedList = [eligibleAndClaimed];
        }
    }

    // create and add new embed with whatever we have left for the field string arrays
    const newEmbed = createEmbed(
        rewardRoles,
        rewardTokens,
        eligibleAndClaimedList,
        false
    );
    embeds.push(newEmbed);

    return embeds;
}

/**
 * Create active airdrop embed
 * @param rewardRoles - roles to show under "Role Required" column
 * @param rewardTokens - tokens to show under "Reward Token" column
 * @param eligibleAndClaimedList - text to show under "Eligible / Claimed" column
 * @param showTitle - only show title for the first embed of the active airdrop embeds
 * @returns embed to add to active airdrop message
 */
const createEmbed = (
    rewardRoles: string[],
    rewardTokens: string[],
    eligibleAndClaimedList: string[],
    showTitle: boolean
) => {
    const embed = new EmbedBuilder()
        .addFields(
            {
                name: "Role Required",
                value: rewardRoles.join("\n"),
                inline: true,
            },
            {
                name: "Reward Token",
                value: rewardTokens.join("\n"),
                inline: true,
            },
            {
                name: "Am I Eligible / Have I Claimed",
                value: eligibleAndClaimedList.join("\n"),
                inline: true,
            }
        )
        .setTimestamp();
    if (showTitle) embed.setTitle("Active Airdrops!");
    return embed;
};
