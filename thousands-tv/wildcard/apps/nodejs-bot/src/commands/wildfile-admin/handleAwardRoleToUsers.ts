import { logError, logInfo } from "@src/logger";
import {
    ChatInputCommandInteraction,
    GuildMember,
    ModalBuilder,
    ModalSubmitInteraction,
    Role,
} from "discord.js";
import {
    AWARD_ROLE_TO_USERS_MODAL_ID,
    DISCORD_IDS_INPUT_FIELD,
    ROLE,
    ROLE_AWARDED_INPUT_FIELD,
} from "../../constants";
import {
    getAirdropAdminRole,
    getRole,
    hasRole,
    isAirdropAdmin,
} from "@src/util/roleUtil";
import { addModalField, addModalFieldParagraph } from "@src/util/modalUtil";

/**
 * Command handler for creating modal to award role to users /award-role-to-users
 * @param interaction
 */
export async function handleAwardRoleToUsersModal(
    interaction: ChatInputCommandInteraction
) {
    const userTag = interaction.user.tag;
    const roleAwarded = interaction.options.getRole(ROLE) as Role;
    logInfo(
        `${userTag} is attempting to award ${roleAwarded.name} role to a list of discord users.`
    );

    const mb = new ModalBuilder()
        .setCustomId(AWARD_ROLE_TO_USERS_MODAL_ID)
        .setTitle("Add role to users");

    addModalField(
        mb,
        ROLE_AWARDED_INPUT_FIELD,
        "Role",
        true,
        "",
        roleAwarded.id
    );
    addModalFieldParagraph(
        mb,
        DISCORD_IDS_INPUT_FIELD,
        "Input Discord Ids to Get Wildfile Ids",
        true,
        4000,
        1,
        "Enter your discord ids here - comma separated"
    );
    await interaction.showModal(mb);
}

export async function handleAwardRoleToUsers(
    interaction: ModalSubmitInteraction
) {
    // reply immediately so the interaction does not time out while we are awarding the role
    await interaction.reply({
        content: `Awarding role to list of discord users...`,
        ephemeral: true,
    });

    // make sure the user has the required admin role
    if (!isAirdropAdmin(interaction.member as GuildMember)) {
        const roleRequired: Role = await getAirdropAdminRole();
        const errMsg = `You must have ${roleRequired} role to award a role to users`;
        logInfo(errMsg);
        await interaction.reply({ content: errMsg, ephemeral: true });
        return;
    }

    // extract discord list and other modal inputs
    const roleId = interaction.fields.getTextInputValue(
        ROLE_AWARDED_INPUT_FIELD
    );
    const discordListInput = interaction.fields.getTextInputValue(
        DISCORD_IDS_INPUT_FIELD
    );

    // transform discord list input and trim whitespace
    const discordIdList = discordListInput
        .split(",")
        .filter((discordId) => discordId !== "");
    for (let i = 0; i < discordIdList.length; i++) {
        discordIdList[i] = discordIdList[i].trim();
    }

    // check role exist
    const roleAwarded: Role = await getRole(roleId);
    if (!roleAwarded) {
        const errMsg = `Role not found`;
        logInfo(errMsg);
        await interaction.reply({ content: errMsg, ephemeral: true });
        return;
    }

    // award role to all users
    let numMembersAwarded = 0;
    const totalNumMembersAwarded = discordIdList.length;
    try {
        const guild = interaction.guild;
        const members = guild.members.cache;
        for (const discordId of discordIdList) {
            const member = members.get(discordId);
            if (!hasRole(member, roleAwarded.id)) {
                await member.roles.add(roleAwarded);
                numMembersAwarded++;
                logInfo(
                    `Added role "${roleAwarded.name}" to ${member.user.tag}`
                );
            }
        }
    } catch (e) {
        const errMsg = `Error adding ${roleAwarded} to provided list of discord ids!`;
        logError(errMsg, e);
        await interaction.editReply(errMsg);
        return;
    }

    const successMsg =
        numMembersAwarded === 0
            ? `The provided list of discord ids already has been awarded the ${roleAwarded} role`
            : `Successfully awarded ${roleAwarded} ${numMembersAwarded}/${totalNumMembersAwarded} user(s) from the provided list!`;
    logInfo(successMsg);
    await interaction.editReply(successMsg);
}
