import { logError, logInfo } from "@src/logger";
import {
    ChatInputCommandInteraction,
    Role,
    StageChannel,
    VoiceChannel,
} from "discord.js";
import { CHANNEL, ROLE } from "../../constants";
import { hasRole } from "@src/util/roleUtil";

/**
 * Command handler for /airdrop-admin award-role
 * @param interaction
 */
export async function handleAwardRoleForVoiceChannel(
    interaction: ChatInputCommandInteraction
) {
    const userTag = interaction.user.tag;
    const roleAwarded = interaction.options.getRole(ROLE) as Role;
    const channel = interaction.options.getChannel(CHANNEL) as
        | VoiceChannel
        | StageChannel;

    // reply immediately so the interaction does not time out while we are awarding the role
    await interaction.reply({
        content: `Awarding role to members in ${channel}... hang tight`,
        ephemeral: true,
    });

    logInfo(
        `${userTag} is attempting to award '${roleAwarded.name}' to members in voice channel ${channel.name}`
    );

    let numMembersAwarded = 0;
    let fetchedChannel;
    try {
        fetchedChannel = await channel.fetch(true);
    } catch (e) {
        const errMsg = `Unable to fetch channel ${channel}, make sure the bot has permission to access that channel`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    if (fetchedChannel.members.size < 1) {
        const errorMsg = `There is nobody in ${channel}`;
        logInfo(errorMsg);
        await interaction.editReply(errorMsg);
        return;
    }

    try {
        // iterate through all members within channel
        for (const member of fetchedChannel.members.values()) {
            if (!hasRole(member, roleAwarded.id)) {
                await member.roles.add(roleAwarded);
                numMembersAwarded++;
                logInfo(
                    `Added role "${roleAwarded.name}" to ${member.user.tag}`
                );
            }
        }
    } catch (e) {
        const errMsg = `Error adding ${roleAwarded} to channel members.  Make sure the bot has permission to manage roles and is awarding a role ***below*** its role in the server settings!`;
        logError(errMsg, e);
        await interaction.editReply(errMsg);
        return;
    }

    const successMsg =
        numMembersAwarded === 0
            ? `Everybody in ${channel} already has the ${roleAwarded} role`
            : `Successfully awarded ${roleAwarded} to ${numMembersAwarded} user(s) in ${channel}!`;
    logInfo(successMsg);
    await interaction.editReply(successMsg);
}
