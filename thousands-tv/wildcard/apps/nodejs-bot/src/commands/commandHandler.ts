import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    ModalSubmitInteraction,
    Role,
} from "discord.js";
import {
    handleClaimAirdropButton,
    handleClaimAirdropModalSubmit,
} from "../airdrop";
import {
    CLAIM_AIRDROP_BUTTON_ID,
    CLAIM_AIRDROP_MODAL_ID,
    CONCLUDE_AIRDROP,
    CREATE_AIRDROP,
    VIEW_ACTIVE_AIRDROPS,
    GET_AIRDROP_CONTRACT_ADDRESS,
    GET_TOKEN_BALANCE,
    GET_AIRDROP_BOT_WALLET_ADDRESS,
    AWARD_ROLE_FOR_VOICE_CHANNEL,
    REOPEN_AIRDROP,
    EDIT_AIRDROP_DURATION,
    WILDPASS_ALLOWLIST_REGISTER_WALLET_BUTTON_ID,
    WILDPASS_ALLOWLIST_REGISTER_WALLET_MODAL_ID,
    WILDPASS_ALLOWLIST_CHECK_WALLET_BUTTON_ID,
    GET_REGISTERED_EVENT_TYPES,
    GET_WILDFILE_INFO,
    TRANSFER_WILDFILE,
    FETCH_RECENT_WILDEVENTS,
    GENERATE_HELIKA_REPORT,
    REACT,
    GET_DISCORD_IDS_FROM_WILDFILES,
    GET_DISCORD_IDS_MODAL_ID,
    UPDATE_ALL_INITIAL_WILDFILE_IDS,
    GET_WILDPASS_OG_HOLDERS,
    GIVE_KUDOS,
    GET_WILDFILE_IDS_FROM_DISCORD_IDS_MODAL_ID,
    GET_WILDFILE_IDS_FROM_DISCORD_IDS,
    AWARD_ROLE_TO_USERS,
    AWARD_ROLE_TO_USERS_MODAL_ID,
    ARCHIVE_LEADERBOARD_COMMAND,
    GET_WILDFILE_IDS_FROM_WALLET_ADDRESSES,
    GET_WILDFILE_IDS_FROM_ADDRESSES_MODAL_ID,
    GET_AIRDROP_ADDRESSES_MODAL_ID,
    AIRDROP_SWAG,
} from "../constants";
import { logError } from "@src/logger";
import { getAirdropAdminRole, isAirdropAdmin } from "../util/roleUtil";
import { handleConcludeAirdropCommand } from "./airdrop-admin/concludeAirdrop";
import { handleCreateAirdropCommand } from "./airdrop-admin/createAirdrop";
import { handleGetAirdropBotWalletAddressCommand } from "./airdrop/getAirdropBotWalletAddress";
import { handleGetAirdropContractAddressCommand } from "./airdrop/getAirdropContractAddress";
import { handleGetTokenBalanceCommand } from "./airdrop/getTokenBalance";
import { handleViewActiveAirdropsCommand } from "./airdrop/viewActiveAirdrops";
import { handleAwardRoleForVoiceChannel } from "./airdrop-admin/awardRoleForVoiceChannel";
import { handleReopenAirdropCommand } from "./airdrop-admin/reopenAirdrop";
import { logInfo } from "@src/logger";
import { handleEditAirdropDurationCommand } from "@src/commands/airdrop-admin/editAirdropDuration";
import {
    handleWildpassAllowlistCheckWalletButton,
    handleWildpassAllowlistRegisterAddressButton,
    handleWildpassAllowlistRegisterAddressModalSubmit,
} from "@src/commands/wildpass/wildpassAllowlistRegistration";

import { handleGetRegisteredEventTypes } from "@src/commands/wildevents/getRegisteredEventTypes";
import { handleGetWildfileInfo } from "@src/commands/wildfile/getWildfileInfo";
import { handleTransferWildfile } from "@src/commands/wildfile-admin/transferWildfile";
import { handleFetchRecentWildevents } from "@src/commands/wildevents/fetchRecentWildevents";
import { generateHelikaReport } from "./wildfile-admin/generateHelikaReport";
import { handleFanReact } from "./fan-attendance/getFanReactions";
import {
    getDiscordIdsFromWildfileIdsCsv,
    getDiscordIdsFromWildfileIdsModal,
} from "./wildfile-admin/getDiscordIdsFromWildfiles";
import { getWildpassOgHolders } from "./airdrop-admin/getWildpassOgHolders";
import { giveKudos } from "./wildfile-admin/giveKudos";
import {
    getWildfileIdsFromDiscordIdsCsv,
    getWildfileIdsFromDiscordIdsModal,
} from "./wildfile-admin/getWildfileIdsFromDiscordids";
import {
    handleAwardRoleToUsers,
    handleAwardRoleToUsersModal,
} from "./wildfile-admin/handleAwardRoleToUsers";
import { archiveLeaderboard } from "./wildfile-admin/archiveLeaderboard";
import {
    getWildfileIdsFromWalletAddressesCsv,
    getWildfileIdsFromWalletAddressesModal,
} from "./wildfile-admin/getWildfileIdsFromWalletAddresses";
import {
    handleAirdropSwag,
    handleAirdropSwagModalSubmit,
} from "@src/commands/airdrop-admin/airdropSwag";

/**
 * Handles airdrop commands, like '/airdrop get-airdrop-contract-address'
 */
export async function executeAirdropCommand(
    interaction: ChatInputCommandInteraction
) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case VIEW_ACTIVE_AIRDROPS:
            return await handleViewActiveAirdropsCommand(interaction);
        case GET_AIRDROP_CONTRACT_ADDRESS:
            return await handleGetAirdropContractAddressCommand(interaction);
        case GET_AIRDROP_BOT_WALLET_ADDRESS:
            return await handleGetAirdropBotWalletAddressCommand(interaction);
        case GET_TOKEN_BALANCE:
            return await handleGetTokenBalanceCommand(interaction);
        default:
            logError(`Unknown airdrop subcommand ${subcommand}`);
            return;
    }
}

/**
 * Handles airdrop admin commands, like '/airdrop-admin create-airdrop'
 */
export async function executeAirdropAdminCommand(
    interaction: ChatInputCommandInteraction
) {
    // make sure this user is actually an airdrop admin
    if (!isAirdropAdmin(interaction.member as GuildMember)) {
        logInfo(
            `${interaction.user.tag} is attempting to use an airdrop admin command, but does not have the airdrop admin role`
        );
        const airdropAdminRole: Role = await getAirdropAdminRole();
        await interaction.reply({
            content: `Unauthorized. That command is restricted to users with the ${airdropAdminRole} role`,
            ephemeral: true,
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case CREATE_AIRDROP:
            return await handleCreateAirdropCommand(interaction);
        case AWARD_ROLE_FOR_VOICE_CHANNEL:
            return await handleAwardRoleForVoiceChannel(interaction);
        case CONCLUDE_AIRDROP:
            return await handleConcludeAirdropCommand(interaction);
        case REOPEN_AIRDROP:
            return await handleReopenAirdropCommand(interaction);
        case EDIT_AIRDROP_DURATION:
            return await handleEditAirdropDurationCommand(interaction);
        case GET_WILDPASS_OG_HOLDERS:
            return await getWildpassOgHolders(interaction);
        case AIRDROP_SWAG:
            return await handleAirdropSwag(interaction);
        default:
            logError(`Unknown airdrop-admin subcommand ${subcommand}`);
            return;
    }
}

/**
 * Handles '/wildfile' commands
 */
export async function executeWildfileCommand(
    interaction: ChatInputCommandInteraction
) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case GET_WILDFILE_INFO:
            return await handleGetWildfileInfo(interaction);
        default:
            logError(`Unknown wildfile subcommand ${subcommand}`);
            return;
    }
}

/**
 * Handles '/fan' commands
 */
export async function executeFanCommand(
    interaction: ChatInputCommandInteraction
) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case REACT:
            return await handleFanReact(interaction);
        default:
            logError(`Unknown fan subcommand ${subcommand}`);
            return;
    }
}

/**
 * Handles '/wildfile-admin' commands
 */
export async function executeWildfileAdminCommand(
    interaction: ChatInputCommandInteraction
) {
    if (!isAirdropAdmin(interaction.member as GuildMember)) {
        logInfo(
            `${interaction.user.tag} is attempting to use a Wildfile admin command, but does not have the airdrop admin role`
        );
        const airdropAdminRole: Role = await getAirdropAdminRole();
        await interaction.reply({
            content: `Unauthorized. That command is restricted to users with the ${airdropAdminRole} role`,
            ephemeral: true,
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case TRANSFER_WILDFILE:
            return await handleTransferWildfile(interaction);
        case GENERATE_HELIKA_REPORT:
            return await generateHelikaReport(interaction);
        case GIVE_KUDOS:
            return await giveKudos(interaction);
        case GET_DISCORD_IDS_FROM_WILDFILES:
            return await getDiscordIdsFromWildfileIdsModal(interaction);
        case GET_WILDFILE_IDS_FROM_DISCORD_IDS:
            return await getWildfileIdsFromDiscordIdsModal(interaction);
        case GET_WILDFILE_IDS_FROM_WALLET_ADDRESSES:
            return await getWildfileIdsFromWalletAddressesModal(interaction);
        case AWARD_ROLE_TO_USERS:
            return await handleAwardRoleToUsersModal(interaction);
        case ARCHIVE_LEADERBOARD_COMMAND:
            return await archiveLeaderboard(interaction);
        default:
            logError(`Unknown wildfile-admin subcommand ${subcommand}`);
            return;
    }
}

/**
 * Handles '/wildevents' commands
 */
export async function executeWildeventsCommand(
    interaction: ChatInputCommandInteraction
) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case GET_REGISTERED_EVENT_TYPES:
            return await handleGetRegisteredEventTypes(interaction);
        case FETCH_RECENT_WILDEVENTS:
            return await handleFetchRecentWildevents(interaction);
        default:
            logError(`Unknown wildevents subcommand ${subcommand}`);
            return;
    }
}

/**
 * Handles modal submission interactions
 * @param interaction modal submission interaction
 */
export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
    const modalId = interaction.customId;

    switch (modalId) {
        case CLAIM_AIRDROP_MODAL_ID:
            return await handleClaimAirdropModalSubmit(interaction);
        case WILDPASS_ALLOWLIST_REGISTER_WALLET_MODAL_ID:
            return await handleWildpassAllowlistRegisterAddressModalSubmit(
                interaction
            );
        case GET_DISCORD_IDS_MODAL_ID:
            return await getDiscordIdsFromWildfileIdsCsv(interaction);
        case GET_WILDFILE_IDS_FROM_DISCORD_IDS_MODAL_ID:
            return await getWildfileIdsFromDiscordIdsCsv(interaction);
        case GET_WILDFILE_IDS_FROM_ADDRESSES_MODAL_ID:
            return await getWildfileIdsFromWalletAddressesCsv(interaction);
        case AWARD_ROLE_TO_USERS_MODAL_ID:
            return await handleAwardRoleToUsers(interaction);
        case GET_AIRDROP_ADDRESSES_MODAL_ID:
            return await handleAirdropSwagModalSubmit(interaction);
        default:
            logError(`Unknown modal submit customId ${modalId}`);
            return;
    }
}

/**
 * Handle button click interactions
 * @param interaction button click interaction
 */
export async function handleButtonInteraction(interaction: ButtonInteraction) {
    const buttonId = interaction.customId;
    switch (buttonId) {
        case CLAIM_AIRDROP_BUTTON_ID:
            return await handleClaimAirdropButton(interaction);
        case WILDPASS_ALLOWLIST_REGISTER_WALLET_BUTTON_ID:
            return await handleWildpassAllowlistRegisterAddressButton(
                interaction
            );
        case WILDPASS_ALLOWLIST_CHECK_WALLET_BUTTON_ID:
            return await handleWildpassAllowlistCheckWalletButton(interaction);
        default:
            logError(
                `Unknown button id: ${buttonId} submitted by ${interaction.user.tag}`
            );
            return;
    }
}
