import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Guild,
    MessagePayload,
    MessageCreateOptions,
    TextChannel,
    Message,
    ThreadAutoArchiveDuration,
    AllowedThreadTypeForTextChannel,
    ChannelType,
    ThreadChannel,
    Role,
    EmbedBuilder,
    User,
    MessageEditOptions,
} from "discord.js";
import { logError } from "@src/logger";
import { IAirdrop } from "@repo/interfaces";
import { client } from "..";
import { getBlockExplorerTxUrl } from "./blockchainUtil";
import {
    getAirdropChannelId,
    getDiscordAppId,
    getDiscordGuildId,
    getLeaderboardChannelId,
    getLinkWalletChannelId,
    getPrivateAdminChannelId,
} from "./environmentUtil";
import {
    CLAIM_AIRDROP_BUTTON_ID,
    COLOR_YELLOW_DARK,
    DISCORD_CHANNELS_BASE_URL,
    LINK_WALLET_GREETER,
    MINT_WILDFILE_BROADCAST_MESSAGE,
    MESSAGE_EMBED_ICON_URL,
} from "@src/constants";
import { logInfo } from "@src/logger";
import { upsertDiscordBroadcastMessageDB } from "@repo/schemas";
import { getMember } from "./roleUtil";

export const DISCORD_MAX_STRING_LENGTH = 1024;

export async function getGuild(): Promise<Guild> {
    const guildId = getDiscordGuildId();
    return await client.guilds.fetch(guildId);
}

export async function loadGuildMembers() {
    logInfo("Loading guild members");
    const guild = await getGuild();
    await guild.members.fetch();
    logInfo("Finished loading guild members");
}
/**
 * Handles creating a new thread with message for claiming airdrops
 * @param threadName - name of the new claim airdrop thread
 * @param airdropDoc - airdrop doc in mongo to associate with the new thread
 * @param roleRequired - role required for this airdrop thread
 * @param airdropBroadcastMessageUrl - url of the airdrop broadcast message in the airdrop channel
 * @returns object containing the new thread and the new ClaimAirdropThread object used in the airdrop schema
 */
export async function createClaimAirdropThread(
    threadName: string,
    airdropDoc: IAirdrop,
    roleRequired: Role,
    airdropBroadcastMessageUrl?: string
): Promise<ThreadChannel<boolean>> {
    let newThread: ThreadChannel<boolean>;
    const broadcastChannel = await getChannel(airdropDoc.broadcastChannelId);
    try {
        newThread = await broadcastChannel.threads.create({
            name: threadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            type: getThreadType(),
        });
        logInfo(
            `Created new thread '${newThread.name}', (ID: ${newThread.id})`
        );
    } catch (e) {
        logError(`Failed to create new thread '${threadName}':`, e);
        return;
    }

    // send the initial message to the thread
    // only mention role.name not role, otherwise it will automatically add all members of that role to thread
    const claimAirdropMsg = `Congratulations Wildlings!! You have all been awarded the ***${
        roleRequired.name
    }*** role, which makes you eligible to receive an airdrop of the ***${
        airdropDoc.tokenMetadata.name || airdropDoc.tokenId
    }*** Swag. Click the *Claim Airdrop!* button below and enter the address where you would like me to send the Swag!`;

    // build the Claim Airdrop and View Airdrop buttons
    const claimAirdropButton = buildArbButton(
        "Claim airdrop!",
        ButtonStyle.Primary,
        CLAIM_AIRDROP_BUTTON_ID
    );

    let url = airdropBroadcastMessageUrl;
    if (!url) {
        const airdropBroadcastChannel = await getChannel(
            airdropDoc.broadcastChannelId
        );
        url = buildMessageUrlFromMessageAndChannelId(
            airdropDoc.broadcastMessageId,
            airdropBroadcastChannel.id
        );
    }

    const viewAirdropButton = buildArbButtonLink("View airdrop", url);

    // send the claim airdrop message to the thread
    try {
        const claimMsg = await newThread.send({
            content: claimAirdropMsg,
            components: [claimAirdropButton, viewAirdropButton],
        });
        await claimMsg.pin();
    } catch (e) {
        logError(
            `Failed to send message to new thread (id: ${newThread.id}): ${threadName}`,
            e
        );
    }

    logInfo(
        `Created new claim airdrop thread (id: ${newThread.id}): ${threadName}`
    );

    return newThread;
}

export async function getThreadChannel(
    threadId: string
): Promise<ThreadChannel> {
    const channel = client.channels.cache.get(threadId);
    if (channel && channel.partial) {
        await channel.fetch();
    }

    return channel as ThreadChannel;
}

/**
 * Broadcast the given message to the airdrop channel
 * @param message
 * @returns the message that was sent
 */
export async function broadcastMessageToAirdropChannel(
    message: string | MessagePayload | MessageCreateOptions
): Promise<Message<true>> {
    try {
        const channel: TextChannel = await getDefaultAirdropChannel();
        return await channel.send(message);
    } catch (e) {
        logError("Error sending message to airdrops channel: ", e);
    }
}

/**
 * Broadcast a given message notification to the private admin channel
 * @param message
 * @returns the message that was sent
 */
export async function alertAirdropAdmins(
    message: string | MessagePayload | MessageCreateOptions
): Promise<Message<true>> {
    try {
        const privateChannel: TextChannel = await getAirdropAdminChannel();
        return await privateChannel.send(message);
    } catch (e) {
        logError("Error sending message to private admin channel: ", e);
    }
}

/**
 * Sends a message to the specified channel.
 * @deprecated Use sendMessage function instead.
 * @param channelId The ID of the channel to send the message to.
 * @param message The message content to send. Can be a string, MessagePayload, or MessageCreateOptions.
 */
export async function sendMessageToChannel(
    channelId: string,
    message: string | MessagePayload | MessageCreateOptions
) {
    try {
        const channel: TextChannel = await getChannel(channelId);
        return await channel.send(message);
    } catch (e) {
        logError(`Error sending message to channel ${channelId}: `, e);
    }
}

/**
 * @returns The TextChannel to broadcast airdrop information to
 */
export async function getDefaultAirdropChannel(): Promise<TextChannel> {
    const channelId = getAirdropChannelId();
    if (!channelId) {
        console.warn(
            "Cannot retrieve airdrop channel, AIRDROP_CHANNEL_ID env var not set"
        );
    }

    return await getChannel(channelId);
}

/**
 * @returns The TextChannel to broadcast Leaderboard information to
 */
export async function getDefaultLeaderboardChannel(): Promise<TextChannel> {
    const channelId = getLeaderboardChannelId();
    if (!channelId) {
        console.warn(
            "Cannot retrieve Leaderboard channel, LEADERBOARD_CHANNEL_ID env var not set"
        );
        return;
    }

    return await getChannel(channelId);
}

/**
 * @returns - The private TextChannel to send notifications for admins
 */
export async function getAirdropAdminChannel(): Promise<TextChannel> {
    const privateChannelId = getPrivateAdminChannelId();
    if (!privateChannelId) {
        console.warn(
            "Cannot retrieve private admin channel, AIRDROP_ADMIN_CHANNEL_ID env var not set"
        );
    }

    return await getChannel(privateChannelId);
}

export async function getChannel(channelId: string): Promise<TextChannel> {
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (channel.partial) {
        await channel.fetch();
    }

    return channel as TextChannel;
}

/**
 * Find a discord message in the airdrops channel by message id
 * @param messageId - discord message id
 * @returns discord Message
 */
export async function getAirdropsChannelMessage(
    messageId: string
): Promise<Message<true> | null> {
    const channel: TextChannel = await getDefaultAirdropChannel();
    return getChannelMessage(channel, messageId);
}

/**
 * Finds what channel message was broadcasted in and returns that message
 * @param doc - doc to get broadcast message from
 * @returns discord message
 */
export async function getBroadcastMessage(
    channelId: string,
    messageId: string
) {
    try {
        const broadcastChannel = await getChannel(channelId);
        const broadcastMessage = await getChannelMessage(
            broadcastChannel,
            messageId
        );

        return broadcastMessage;
    } catch (e) {
        logError(
            `Failed to fetch channel message. channelId: ${channelId} messageId: ${messageId}`,
            e
        );
        return null;
    }
}

/**
 * Sends a message in the given channel/thread, if the message has embeds it will force fetch the message to ensure the embeds are up to date
 * Be sure to force fetch the message if the bot is dependent on the embeds being up to date
 * @param channel - discord channel to send message to
 * @param options - message to send
 * @param forceFetch - whether to force fetch the message after sending
 */
export async function sendMessage(
    channel: TextChannel | ThreadChannel,
    options: string | MessagePayload | MessageCreateOptions,
    forceFetch: boolean = false
): Promise<Message<true> | null> {
    try {
        if (!options) {
            logError(
                `No options provided to send message to channel ${channel.id}`
            );
            return null;
        }

        const broadcastMessage = await channel.send(options);
        // If the message has embeds, force fetch the message to ensure the embeds are up to date
        if (
            forceFetch &&
            options instanceof Object &&
            !(options instanceof MessagePayload) &&
            (options as MessageCreateOptions)?.embeds?.length > 0
        ) {
            await broadcastMessage.fetch(true);
        }

        return broadcastMessage;
    } catch (e) {
        logError(`Failed to send broadcast message. channelId: ${channel.id}`);
        return null;
    }
}

/**
 * Edits a message in the given channel/thread, and fetches the updated message to ensure it is up to date
 *  * Be sure to force fetch the message if the bot is dependent on the embeds being up to date
 * @param message - discord message to edit
 * @param content - new content to set the message to
 * @param forceFetch - whether to force fetch the message after sending
 */
export async function editMessage(
    message: Message<true>,
    content: string | MessageEditOptions | MessagePayload,
    forceFetch: boolean = false
): Promise<Message<true> | null> {
    try {
        const updatedMessage = await message.edit(content);
        // If the message has embeds, force fetch the message to ensure the embeds are up to date
        if (
            forceFetch &&
            content instanceof Object &&
            !(content instanceof MessagePayload) &&
            (content as MessageCreateOptions)?.embeds?.length > 0
        ) {
            await updatedMessage.fetch(true);
        }

        return updatedMessage;
    } catch (e) {
        logError(
            `Failed to edit broadcast message. messageId: ${message.id}`,
            e
        );
        return null;
    }
}

/**
 * Find a discord message in the broadcast channel by message id
 * @param channel - discord channel to get message from
 * @param messageId - discord message id
 * @returns discord Message
 */
export async function getChannelMessage(
    channel: TextChannel,
    messageId: string
): Promise<Message<true> | null> {
    try {
        let msg: Message<true> = await channel.messages.fetch(messageId);
        return msg;
    } catch (e) {
        logError(
            `Failed to fetch channel message. channelId: ${channel.id} messageId: ${messageId}`,
            e
        );
        return null;
    }
}

/**
 * Returns an ActionRowBuilder that contains a button link to the block explorer
 * @param txnHash - transaction to link to
 * @returns ActionRowBuilder with a button link to the block explorer
 */
export function getBlockchainTxnArbButton(
    txnHash: string,
    alternateText?: string
): ActionRowBuilder<ButtonBuilder> {
    const txnUrl = getBlockExplorerTxUrl(txnHash);
    return buildArbButtonLink(alternateText || "View transaction", txnUrl);
}

/**
 * Returns an ActionRowBuilder that contains a button link to the block explorer
 * @param txnHash - transaction to link to
 * @returns ActionRowBuilder with a button link to the block explorer
 */
export function getWildeventTxnArbButton(
    txnHash: string
): ActionRowBuilder<ButtonBuilder> {
    const txnUrl = getBlockExplorerTxUrl(txnHash);
    return buildArbButtonLink("View Wildevent", txnUrl);
}

/**
 * Returns an ActionRowBuilder that contains a button link to the given URL
 * @param url - url to link
 * @returns ActionRowBuilder with a button link to the given url
 */
export function buildArbButton(
    buttonLabel: string,
    buttonStyle: ButtonStyle,
    customId?: string
): ActionRowBuilder<ButtonBuilder> {
    const bb = new ButtonBuilder().setLabel(buttonLabel).setStyle(buttonStyle);
    if (customId) {
        bb.setCustomId(customId);
    }

    return new ActionRowBuilder<ButtonBuilder>().addComponents(bb);
}

export function buildArbButtonLink(
    buttonLabel: string,
    url: string
): ActionRowBuilder<ButtonBuilder> {
    const bb = new ButtonBuilder()
        .setLabel(buttonLabel)
        .setStyle(ButtonStyle.Link)
        .setURL(url);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(bb);
}

export async function removeButtonsFromMessage(
    channelId: string,
    messageId: string
) {
    try {
        const channel = await getChannel(channelId);
        if (!channel) {
            console.warn(`Failed to find thread ${channelId}`);
            return;
        }

        const msg: Message<true> = await channel.messages.fetch(messageId);
        if (!msg) {
            console.warn(
                `Failed to find message ${messageId} in thread ${channelId}`
            );
            return;
        }

        // edit the message to remove the components (buttons)
        await editMessage(msg, {
            content: msg.content,
            components: [],
        });
    } catch (e) {
        logError(
            `Failed to remove buttons from thread message. threadId: ${channelId}, messageId: ${messageId}`,
            e
        );
    }
}

/**
 * Get the type of thread to send the user
 */
export function getThreadType(): AllowedThreadTypeForTextChannel {
    // private threads are restricted to level 2 boosted servers, so check the environment variable
    const usePrivateThread = process.env.USE_PRIVATE_THREAD === "true";
    if (usePrivateThread) {
        return ChannelType.PrivateThread;
    }

    return ChannelType.PublicThread;
}

/**
 * Create url of message in a channel to link to
 * @param messageId - id of message to link to
 * @param channelId - id of channel that message is in
 * @returns string
 */
export function buildMessageUrlFromMessageAndChannelId(
    messageId: string,
    channelId: string
): string {
    const guildId = getDiscordGuildId();
    return `${DISCORD_CHANNELS_BASE_URL}/${guildId}/${channelId}/${messageId}`;
}

/**
 * Scans ids in channel  to see if member is part of that channel
 * @param channelId - id of channel to check
 * @param memberId - id of member to  check
 * @returns boolean
 */
export async function isMemberInChannel(
    channelId: string,
    memberId: string
): Promise<boolean> {
    const channel = await getChannel(channelId);
    const channelMembers = channel.members;
    for (const channelMember of channelMembers.values()) {
        if (channelMember.id === memberId) {
            return true;
        }
    }
    return false;
}

/**
 * Formats a javascript to string for discord to display
 * @param date - Javascript Date item
 * @returns Date string
 */
export function formatDateDiscord(date: Date) {
    return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

/**
 * Checks if bot is member of and has permission to send messages in a text channel
 * @param channel - TextChannel to check
 * @returns boolean
 */
export async function canBotSendChannelMessage(
    channel: TextChannel
): Promise<boolean> {
    const botId = getDiscordAppId();
    const botIsMember = await isMemberInChannel(channel.id, botId);

    const bot = client.user;
    const botCanSendMessages = channel.permissionsFor(bot).has("SendMessages");
    return botIsMember && botCanSendMessages;
}

/**
 * @dev - Temporary function to remove the discriminator from a user's tag (with a unique username). To be updated upon https://github.com/discordjs/discord.js/pull/9512 release.
 *
 * Removes the discriminator "#0" from a Discord tag if it exists.
 * @param {string} userTag - The Discord username to modify.
 * @returns {string} The modified Discord username without the discriminator.
 */
export function removeNewUsernameDiscriminator(userTag: string) {
    // self-contained validation check
    if (userTag?.endsWith("#0")) {
        return userTag.slice(0, -2);
    }
    return userTag;
}

/**
 * Return discord user reference from discord id
 * @param discordId - discord id of user
 * @returns discord user reference
 */
export function getDiscordUserReference(discordId: string): string {
    return `<@${discordId}>`;
}

/**
 * Convert a Discord user's avatar to a URL from discord ImageExtension type .gif to .png
 * @param {string} avatarURL - The URL of the user's avatar.
 */
export function convertAvatarURLGifToPng(avatarURL: string) {
    return avatarURL.replace(".gif", ".png");
}

/**
 * Fetches a user's guild-specific avatar if available, otherwise their global Discord avatar.
 * @dev - guild specific display avatars is a feature for discord nitro users
 * @param {User} user - The user whose avatar is being fetched. (This may not be the same as a guild member.)
 * @returns {Promise<string>} - The URL of the user's avatar.
 */
export async function getUserAvatarUrl(user: User) {
    try {
        // Fetch the member object from the guild
        const member = await getMember(user.id);

        // Get the guild-specific member avatar URL
        let guildAvatarURL = member.displayAvatarURL({
            extension: "png",
            size: 128,
        });

        guildAvatarURL = convertAvatarURLGifToPng(guildAvatarURL);

        // If the guild avatar URL is different from the user's default avatar, return it
        if (guildAvatarURL && guildAvatarURL !== user.defaultAvatarURL) {
            return guildAvatarURL;
        }
    } catch (e) {
        logError(`getUserAvatarUrl: Failed to fetch guild member:`, e);
    }

    // Return the user's global Discord avatar URL
    return user.displayAvatarURL({ size: 128 });
}
