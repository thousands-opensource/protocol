import {
    editMessage,
    getBroadcastMessage,
    getThreadChannel,
} from "../../../src/util/discordUtil";
import { ChatInputCommandInteraction, EmbedBuilder, Role } from "discord.js";
import { ROLE, TOKEN_ID } from "../../constants";
import { getRole } from "@src/util/roleUtil";
import { logError, logInfo } from "@src/logger";
import { buildAirdropEmbed } from "@src/util/embedUtil";
import { client } from "@src/index";
import {
    AirdropDoc,
    findOneAirdropByQuery,
    updateOneAirdropDB,
} from "@repo/schemas";

/**
 * Command handler for /airdrop-admin conclude-airdrop,
 * @param interaction - chat input command that kicked off concluding the airdrop
 */
export async function handleConcludeAirdropCommand(
    interaction: ChatInputCommandInteraction
) {
    // reply immediately so the interaction does not time out while concluding the airdrop
    await interaction.reply({
        content: `Concluding airdrop... hang tight`,
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    const roleRequired = interaction.options.getRole(ROLE) as Role;
    const tokenIdStr = interaction.options.getString(TOKEN_ID);
    const roleName = roleRequired.name;
    logInfo(
        `${userTag} is attempting to conclude airdrop for role '${roleName}' and token ID '${tokenIdStr}'`
    );

    // make sure there is already an active airdrop for that role
    const airdropDoc = await findOneAirdropByQuery({
        active: true,
        roleRequiredId: roleRequired.id,
        tokenId: tokenIdStr,
    });
    if (!airdropDoc) {
        const errMsg = `Cannot conclude airdrop. An active airdrop for role ${roleRequired} with token ID ${tokenIdStr} does not exist`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

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

    const concludeAirdropSuccessMsg = await concludeAirdrop(
        airdropDoc,
        userTag,
        roleRequired
    );

    await interaction.editReply(concludeAirdropSuccessMsg);
}

/**
 * Handles conclusion of airdrops
 * @dev - decouple the conclude logic from chat command to implement conclude logic in its own function
 * @param airdrop - airdrop doc in mongo used to retrieve the current airdrop instance
 * @param concludedBy - user who concluded the airdrop - undefined/null if bot is auto-concluding
 * @param roleRequired - role object required for this airdrop
 * @returns - success message upon successful airdrop auto conclusion
 */
export async function concludeAirdrop(
    airdropDoc: AirdropDoc,
    concludedBy?: string,
    roleRequired?: Role
) {
    const isAutoConclude = !concludedBy || !roleRequired;
    if (isAutoConclude) {
        // use the bot's tag if it's being auto-concluded
        concludedBy = client.user.tag;
        roleRequired = await getRole(airdropDoc.roleRequiredId);
    }

    const airdropBroadcastMessage = await getBroadcastMessage(
        airdropDoc.broadcastChannelId,
        airdropDoc.broadcastMessageId
    );
    if (!airdropBroadcastMessage) {
        const errMsg = `Cannot conclude airdrop ${airdropDoc._id}. Failed to find airdrop broadcast message with messageId ${airdropDoc.broadcastMessageId}`;
        logInfo(errMsg);
        return;
    }

    // update DB to conclude the airdrop
    airdropDoc = await updateOneAirdropDB(airdropDoc._id, {
        $set: { active: false, concludedBy: concludedBy },
    });

    const tokenLabel = airdropDoc.tokenMetadata.name || airdropDoc.tokenId;

    // update airdrop embed to show new airdrop end date status
    const airdropEmbed: EmbedBuilder = await buildAirdropEmbed(
        airdropDoc,
        roleRequired.name // this parameter will only be used if the role was deleted for the airdrop
    );
    const concludeMsg = `This airdrop has concluded (***${roleRequired.name}*** role, ***${tokenLabel}*** swag)`;

    // update the original broadcast message to say the airdrop has concluded
    await editMessage(airdropBroadcastMessage, {
        content: concludeMsg,
        embeds: [airdropEmbed],
    });

    // reply to the broadcast message to say that the airdrop has concluded
    await airdropBroadcastMessage.reply(concludeMsg);

    // find the threads for this airdrop
    for (const claimAirdropThreadId of airdropDoc.claimAirdropThreadIds) {
        const claimAirdropThread = await getThreadChannel(claimAirdropThreadId);
        if (!claimAirdropThread) {
            logInfo(
                `Failed to find claim airdrop thread with ID: ${claimAirdropThreadId}, not broadcasting conclude message`
            );
            continue;
        }

        if (claimAirdropThread.archived || claimAirdropThread.locked) {
            logInfo(
                `skipping thread with ID: ${claimAirdropThreadId} it is already locked/archived.`
            );
            continue;
        }

        try {
            await claimAirdropThread.send(concludeMsg);
        } catch (e) {
            logError(
                `Error sending conclude message to claim airdrop thread with ID:  ${claimAirdropThreadId}`,
                e
            );
        }

        // lock and archive the thread. Must lock before archiving
        await claimAirdropThread.setLocked(true, concludeMsg);
        await claimAirdropThread.setArchived(true, concludeMsg);
    }

    const successMsg = `Successfully concluded airdrop for role '${roleRequired.name}' and swag '${tokenLabel}'`;
    logInfo(successMsg);
    return successMsg;
}
