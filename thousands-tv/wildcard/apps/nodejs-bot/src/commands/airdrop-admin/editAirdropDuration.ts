import {
    editMessage,
    formatDateDiscord,
    getBroadcastMessage,
} from "../../util/discordUtil";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { AIRDROP_DURATION_HOURS, ROLE, TOKEN_ID } from "../../constants";
import { buildAirdropEmbed } from "@src/util/embedUtil";
import { isValidAirdropDuration } from "@src/util/util";
import { logInfo } from "@src/logger";
import { findOneAirdropByQuery, updateOneAirdropDB } from "@repo/schemas";

/**
 * Handles editing the airdrop's duration
 * @param interaction - chat input command
 */
export async function handleEditAirdropDurationCommand(
    interaction: ChatInputCommandInteraction
) {
    // reply immediately so the interaction does not time out
    await interaction.reply({
        content: `Updating airdrop duration...`,
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    const roleRequired = interaction.options.getRole(ROLE);
    const tokenIdStr = interaction.options.getString(TOKEN_ID);
    const roleName = roleRequired.name;
    const airdropDurationHours = interaction.options.getNumber(
        AIRDROP_DURATION_HOURS
    );

    logInfo(
        `${userTag} is attempting to edit airdrop duration for role '${roleName}' and token ID '${tokenIdStr}', airdropDurationHours ${airdropDurationHours}`
    );

    // make sure there is already an active airdrop for that role
    let airdropDoc = await findOneAirdropByQuery({
        roleRequiredId: roleRequired.id,
        active: true,
        tokenId: tokenIdStr,
    });

    const tokenLabel = airdropDoc.tokenMetadata.name || airdropDoc.tokenId;
    if (!airdropDoc) {
        const errMsg = `Cannot edit airdrop duration. An active airdrop for role ${roleRequired} and swag ${tokenLabel} does not exist`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // make sure new end date is valid
    if (!isValidAirdropDuration(airdropDurationHours)) {
        const errMsg = `Invalid airdrop duration hours ${airdropDurationHours}. The duration must be a positive integer`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // add the duration to the current time to get the new concludesAt
    const concludesAt = new Date();
    concludesAt.setHours(concludesAt.getHours() + airdropDurationHours);

    // Update the DB with new autoEnd Date
    airdropDoc = await updateOneAirdropDB(airdropDoc._id, {
        $set: { concludesAt: concludesAt },
    });

    // update airdrop embed to show new airdrop end date status
    const airdropEmbed: EmbedBuilder = await buildAirdropEmbed(airdropDoc);

    const airdropBroadcastMessage = await getBroadcastMessage(
        airdropDoc.broadcastChannelId,
        airdropDoc.broadcastMessageId
    );
    if (!airdropBroadcastMessage) {
        const errMsg = `Cannot conclude airdrop ${airdropDoc._id}. Failed to find airdrop broadcast message with messageId ${airdropDoc.broadcastMessageId}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // update only the embed end date timestamp
    const forceFetch = true;
    await editMessage(
        airdropBroadcastMessage,
        {
            embeds: [airdropEmbed],
        },
        forceFetch
    );

    const concludesAtFormatted = formatDateDiscord(concludesAt);

    await interaction.editReply(
        `Airdrop for ${roleRequired} and swag ***${tokenLabel}*** has been updated. The airdrop will now conclude at ${concludesAtFormatted} (in ${airdropDurationHours} hours)`
    );
}
