import { ModalBuilder } from "@discordjs/builders";
import {
    AttachmentBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    ModalSubmitInteraction,
    Role,
} from "discord.js";
import {
    ADDRESS,
    WILDPASS_ALLOWLIST_REGISTER_WALLET_BUTTON_ID,
    WILDPASS_ALLOWLIST_REGISTER_WALLET_MODAL_ID,
    WILDPASS_ALLOWLIST_CHECK_WALLET_BUTTON_ID,
} from "../../constants";

import { logError, logInfo } from "../../logger";
import { isValidAddress } from "../../util/blockchainUtil";
import {
    canBotSendChannelMessage,
    buildArbButton,
    getChannel,
    removeNewUsernameDiscriminator,
    sendMessage,
} from "../../util/discordUtil";
import {
    getDiscordAppId,
    getWildPassAllowListRegistrationChannelId,
    getWildPassInvitedRoleId,
} from "../../util/environmentUtil";
import { addModalField } from "../../util/modalUtil";
import { getRole, hasRole } from "../../util/roleUtil";
import { findOneUserByQuery, updateOneUserDB } from "@repo/schemas";

const IS_WILDPASS_REGISTRATION_ACTIVE = false;

const WILDPASS_ALLOWLIST_THUMBNAIL_FILENAME = "wildcardLogo.png";

/**
 * Sends message to register wallet address
 */
export async function broadcastRegisterWalletMessage() {
    if (!IS_WILDPASS_REGISTRATION_ACTIVE) {
        return;
    }

    const channelId = getWildPassAllowListRegistrationChannelId();
    if (!channelId) {
        logError(
            "Channel Id not found for Wildpass Channel. Please create this channel and set the environment variable:'WILDPASS_ALLOWLIST_REGISTRATION_CHANNEL_ID' accordingly."
        );
        return;
    }

    // make sure the role required exists
    const roleRequiredId = getWildPassInvitedRoleId();
    const roleRequired: Role = await getRole(roleRequiredId);
    if (!roleRequiredId || !roleRequired) {
        logError(
            "Role required for Wildpass allow list could not be found. Please make sure the role has been created and the environment variable: 'WILDPASS_INVITED_ROLE_ID' has been set accordingly. "
        );
        return;
    }
    const channel = await getChannel(channelId);

    if (!channel) {
        logInfo(
            "Unable to find Wildpass Allowlist Registration Channel, not broadcasting message."
        );
        return;
    }

    // make sure bot has permissions to send message to channel
    const botHasPermission = await canBotSendChannelMessage(channel);
    if (!botHasPermission) {
        logError(
            `Airdrop bot is missing access and/or permission to send 'Register Wallet' message to channel ${channel.name}! Please update its channel access/permissions.`
        );
        return;
    }

    // check if message is already posted
    const pinnedMsgs = await channel.messages.fetchPinned(false);
    const botId = getDiscordAppId();
    for (const [, msg] of pinnedMsgs) {
        const actionRow = msg.components[0];
        const msgComponent = actionRow?.type === 1 ? (actionRow as any).components?.[0] : undefined;
        if (
            msg.author.id === botId &&
            msgComponent?.customId ===
                WILDPASS_ALLOWLIST_REGISTER_WALLET_BUTTON_ID
        ) {
            logInfo(
                `Not broadcasting register wallet message for Wildpass allowlist, message already broadcasted`
            );
            return;
        }
    }

    logInfo(
        `Broadcasting Wildpass Allowlist register wallet message to ${channel.name}`
    );

    // build the register wallet button
    const buttonArb = buildArbButton(
        "Register wallet!",
        ButtonStyle.Primary,
        WILDPASS_ALLOWLIST_REGISTER_WALLET_BUTTON_ID
    );

    // build the check wallet button
    const checkWalletButton = new ButtonBuilder()
        .setLabel("Check wallet")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(WILDPASS_ALLOWLIST_CHECK_WALLET_BUTTON_ID);
    // put the buttons in the same row
    buttonArb.addComponents(checkWalletButton);

    const embed = buildWildpassAllowlistRegistrationEmbed(roleRequired);
    // build the thumbnail attachment that the embed uses
    const attachment = new AttachmentBuilder(
        `./src/images/${WILDPASS_ALLOWLIST_THUMBNAIL_FILENAME}`,
        {
            name: WILDPASS_ALLOWLIST_THUMBNAIL_FILENAME,
        }
    );

    const message = await sendMessage(channel, {
        embeds: [embed],
        components: [buttonArb],
        files: [attachment],
    });

    try {
        await message.pin();
    } catch (e) {
        logError(
            `Failed to pin Wildpass allowlist register wallet message to channel ${channel.name}`,
            e
        );
    }
}

/**
 * Handler when a user clicks the 'Register Wallet' button
 * @param interaction - button click interaction
 */
export async function handleWildpassAllowlistRegisterAddressButton(
    interaction: ButtonInteraction
) {
    const discordId = interaction.user.id;
    logInfo(
        `${interaction.user.tag} is attempting to register their wallet for the Wildpass allowlist`
    );

    if (!IS_WILDPASS_REGISTRATION_ACTIVE) {
        const errMsg = "Wallet registration for the Wildpass mint has ended";
        logInfo(errMsg);
        await interaction.reply({ content: errMsg, ephemeral: true });
        return;
    }

    // make sure the user has the role required
    const roleRequiredId = getWildPassInvitedRoleId();
    const roleRequired: Role = await getRole(roleRequiredId);
    const hasRoleRequired: boolean = hasRole(
        interaction.member as GuildMember,
        roleRequiredId
    );
    if (!hasRoleRequired) {
        const errMsg = `You must have the ${roleRequired} role to register your wallet for the Wildpass allowlist`;
        logInfo(errMsg);
        await interaction.reply({ content: errMsg, ephemeral: true });
        return;
    }

    const user = await findOneUserByQuery({ "discordProvider.id": discordId });

    if (!user) {
        // TODO: Add button to take user to dapp to register wallet
        const errMsg =
            "User not found in the database. Please register on our website first before continuing!";
        logInfo(errMsg);
        await interaction.reply({ content: errMsg, ephemeral: true });
        return;
    }

    const registerAddressModal = buildWildpassAllowlistRegisterAddressModal(
        user?.walletProvider?.wildfile?.wildpassAllowlistWalletAddress
    );
    interaction.showModal(registerAddressModal);
}

/**
 * Handler when a user clicks the 'Check Wallet' button
 * @param interaction - button click interaction
 */
export async function handleWildpassAllowlistCheckWalletButton(
    interaction: ButtonInteraction
) {
    await interaction.reply({
        content:
            "Checking wallet registered for the Wildpass allowlist... hang tight",
        ephemeral: true,
    });
    logInfo(
        `${interaction.user.tag} is checking wallet for the Wildpass allowlist`
    );

    const discordId = interaction.user.id;

    const user = await findOneUserByQuery({ "discordProvider.id": discordId });
    let msg;
    if (
        !user ||
        !user?.walletProvider?.wildfile?.wildpassAllowlistWalletAddress
    ) {
        msg = "You do not have a wallet registered for the Wildpass allowlist";
    } else {
        msg = `Your wallet ***${user?.walletProvider?.wildfile?.wildpassAllowlistWalletAddress}*** is registered for the Wildpass allowlist! You are ready to mint on April 20th!`;
    }

    logInfo(msg);
    await interaction.editReply(msg);
}

/**
 * Build modal for user to register their wallet
 * @param currRegisteredAddress - address currently registered (prepopulates in the modal)
 * @returns Discord modal
 */
function buildWildpassAllowlistRegisterAddressModal(
    currRegisteredAddress: string
): ModalBuilder {
    const mb = new ModalBuilder()
        .setCustomId(WILDPASS_ALLOWLIST_REGISTER_WALLET_MODAL_ID)
        .setTitle("WildPass allowlist registration");
    addModalField(
        mb,
        ADDRESS,
        "Wallet address",
        true,
        "ex. 0xab5801a7d398351b8be11c439e05c5b3259aec9b",
        currRegisteredAddress
    );
    return mb;
}

/**
 * Handles user submission of register wallet address modal
 * @param interaction - modal submit interaction
 */
export async function handleWildpassAllowlistRegisterAddressModalSubmit(
    interaction: ModalSubmitInteraction
) {
    if (!IS_WILDPASS_REGISTRATION_ACTIVE) {
        const errMsg = "Wallet registration for the Wildpass mint has ended";
        logInfo(errMsg);
        await interaction.reply({ content: errMsg, ephemeral: true });
        return;
    }

    // Reply immediately so the command does not time out
    await interaction.reply({
        content: "Registering your wallet address... hang tight",
        ephemeral: true,
    });

    const discordId = interaction.user.id;
    const discordAvatar = interaction.user.avatar;
    const userTag = removeNewUsernameDiscriminator(interaction.user.tag);
    const address = interaction.fields.getTextInputValue(ADDRESS);
    logInfo(
        `${userTag} submitted modal to register wallet address '${address}'`
    );

    // make sure the address given is valid
    if (!isValidAddress(address)) {
        const errMsg = `'${address}' is not a valid address, please submit a valid wallet address`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // make sure the user has the role required
    const roleRequiredId = getWildPassInvitedRoleId();
    const roleRequired: Role = await getRole(roleRequiredId);
    const hasRoleRequired: boolean = hasRole(
        interaction.member as GuildMember,
        roleRequiredId
    );
    if (!hasRoleRequired) {
        const errMsg = `You must have the ${roleRequired} role to register your wallet for the Wildpass allowlist`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // check to see if they already registered
    const user = await findOneUserByQuery({ "discordProvider.id": discordId });

    if (!user?.walletProvider?.wildfile?.wildpassAllowlistWalletAddress) {
        // TODO: Add button to take user to dapp to register wallet
        const errMsg = `Unable to register '${userTag}' for the Wildpass allowlist with address '${address}' Please register on our website first before continuing!`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
    }

    // only update the DB if their wallet address actually changed
    if (
        user?.walletProvider?.wildfile?.wildpassAllowlistWalletAddress !==
        address
    ) {
        await updateOneUserDB(
            { _id: user._id },
            {
                "walletProvider.wildfile.wildpassAllowlistWalletAddress":
                    address,
            }
        );
    }

    logInfo(
        `Successfully updated ${userTag}'s address for the Wildpass allowlist. New address '${address}'`
    );
    const successMsg = `Thank you! :tada: Your wallet ***${address}*** is confirmed and you're ready for mint day on April 20th!`;
    await interaction.editReply(successMsg);
    return;
}

/**
 * Builds the embed for the WildPass Allowlist Registration
 * @param roleRequired - role required to register for the allowlist
 * @returns
 */
function buildWildpassAllowlistRegistrationEmbed(
    roleRequired: Role
): EmbedBuilder {
    const wpAllowlistRegistrationEmbed = new EmbedBuilder()
        .setThumbnail(`attachment://${WILDPASS_ALLOWLIST_THUMBNAIL_FILENAME}`)
        .setTitle(`WildPass Allowlist Registration!`)
        .addFields({
            name: "**ACTION REQUIRED**",
            value: `${roleRequired}, you **MUST** resubmit your wallet below to remain on the Phase 1 guaranteed allowlist. **Press the 'Register Wallet!' button below to submit your wallet address**

To view your registered address, press the ***Check Wallet*** button.
To update your wallet address, press ***Register Wallet!*** again.`,
        })
        .setTimestamp();

    return wpAllowlistRegistrationEmbed;
}
