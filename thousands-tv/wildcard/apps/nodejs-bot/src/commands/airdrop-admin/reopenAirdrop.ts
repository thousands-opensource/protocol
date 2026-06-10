import {
    getDiscordAppId,
    getMinBotTokenBalance,
} from "@src/util/environmentUtil";
import { getMembersWithRole } from "@src/util/roleUtil";
import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    Message,
    Role,
    TextChannel,
} from "discord.js";
import { BigNumber } from "ethers";
import {
    addUserToAirdrop,
    notifyIfEligibleUsersExceedsBotTokens,
} from "../../airdrop";
import {
    AIRDROP_DURATION_HOURS,
    AIRDROP_TOKEN_BASE_URL_OPENSEA,
    CHANNEL,
    ROLE,
    TOKEN_ID,
} from "../../constants";
import { WILDCARD_SWAG_CONTRACT } from "../../contracts/WildcardSwag";
import { findAirdropsByQuery, updateOneAirdropDB } from "@repo/schemas";
import { getDiscordBotWalletAddress } from "../../util/blockchainUtil";
import {
    buildArbButtonLink,
    createClaimAirdropThread,
    getDefaultAirdropChannel,
    isMemberInChannel,
    sendMessage,
} from "../../util/discordUtil";
import { buildAirdropEmbed } from "@src/util/embedUtil";
import { logError, logInfo } from "@src/logger";
import { isValidAirdropDuration } from "@src/util/util";
import { client } from "@src/index";

/**
 * Command handler for /airdrop-admin create-airdrop
 * @param interaction
 */
export async function handleReopenAirdropCommand(
    interaction: ChatInputCommandInteraction
) {
    // reply immediately so the interaction does not time out while we are creating the airdrop
    await interaction.reply({
        content: `Reopening airdrop... hang tight`,
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    const roleRequired = interaction.options.getRole(ROLE);
    const tokenIdStr = interaction.options.getString(TOKEN_ID);
    // check if they specified a channel to broadcast to, otherwise defaults to airdrop channel
    let broadcastChannel = interaction.options.getChannel(
        CHANNEL
    ) as TextChannel;
    if (!broadcastChannel) {
        broadcastChannel = await getDefaultAirdropChannel();
    }
    const airdropDurationHours = interaction.options.getNumber(
        AIRDROP_DURATION_HOURS
    );

    logInfo(
        `${userTag} is attempting to reopen airdrop in ${broadcastChannel.name} for role '${roleRequired.name}' and token Id '${tokenIdStr}', airdropDurationHours ${airdropDurationHours}`
    );

    // make sure bot has permission to access and send messages to this channel
    const botId = getDiscordAppId();
    const botIsMember = await isMemberInChannel(broadcastChannel.id, botId);

    const bot = client.user;
    const botCanSendMessages = broadcastChannel
        .permissionsFor(bot)
        .has("SendMessages");
    const botHasPermission = botIsMember && botCanSendMessages;

    if (!botHasPermission) {
        const errMsg = `Error reopening airdrop: the airdrop bot is missing access/permissions. Please make sure the bot has permission to access ${broadcastChannel} AND send messages to channel.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // make sure the token ID is actually a number. It cannot be a 'number' option type because tokenIds can be too large
    if (!Number(tokenIdStr)) {
        const errMsg = `Invalid Token ID '${tokenIdStr}'. It must be a positive number`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    //  make sure there isn't already an active airdrop for that role and token AND that an incative one exists
    const airdropDocs = await findAirdropsByQuery({
        roleRequiredId: roleRequired.id,
        tokenId: tokenIdStr,
    });

    // make sure no active airdrop exists for that role/tokenId
    for (const airdropDoc of airdropDocs) {
        if (airdropDoc.active) {
            const errMsg = `An active airdrop for role '${roleRequired}' and token id '${tokenIdStr}' already exists (active airdrop id: ${airdropDoc._id})`;
            logInfo(errMsg);
            await interaction.editReply(errMsg);
            return;
        }
    }

    if (airdropDocs.length === 0) {
        const errMsg = `No inactive airdrop for role '${roleRequired}' and token id '${tokenIdStr}' exists to be reopened.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // handle airdrop duration hours
    let concludesAt;
    if (airdropDurationHours) {
        if (!isValidAirdropDuration(airdropDurationHours)) {
            const errMsg = `Invalid airdrop duration hours ${airdropDurationHours}. The duration must be a positive integer`;
            logInfo(errMsg);
            await interaction.editReply(errMsg);
            return;
        }

        // add the duration to the current time to get the concludesAt
        concludesAt = new Date();
        concludesAt.setHours(concludesAt.getHours() + airdropDurationHours);
    }

    const airdropUpdateMutation = concludesAt
        ? {
              $set: {
                  active: true,
                  concludedBy: "",
                  broadcastChannelId: broadcastChannel.id,
                  concludesAt: concludesAt,
              },
          }
        : {
              $set: {
                  active: true,
                  concludedBy: "",
                  broadcastChannelId: broadcastChannel.id,
              },
              $unset: { concludesAt: "" },
          };

    // get most recent airdrop (airdropDocs is sorted by most recent in findAirdropsByQuery)
    let airdropDoc = airdropDocs[0];

    const tokenIdBN = BigNumber.from(tokenIdStr);
    // make sure the bot has enough tokens in its wallet to start the airdrop
    const botBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        getDiscordBotWalletAddress(),
        tokenIdBN
    );
    const botBalance = botBalanceBN.toNumber();
    const minBalanceRequired = getMinBotTokenBalance();
    if (botBalance < minBalanceRequired) {
        const errMsg = `Failed to reopen airdrop. My balance for Token ID '${tokenIdStr}' is too low. Current balance: ${botBalance}, Minimum balance: ${minBalanceRequired}. To create an airdrop, transfer the tokens to my address: ${getDiscordBotWalletAddress()}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    logInfo(`Reactivating airdrop ${airdropDoc._id}`);
    // update the existing airdrop -- set active to true and clear concluded by field
    airdropDoc = await updateOneAirdropDB(
        airdropDoc._id,
        airdropUpdateMutation
    );

    // see what the current eligible/claimed numbers should be
    const eligibleMembers = await getMembersWithRole(roleRequired.id);

    // build the airdrop embed and broadcast it
    const airdropEmbed: EmbedBuilder = await buildAirdropEmbed(airdropDoc);
    const airdropTokenUrl = `${AIRDROP_TOKEN_BASE_URL_OPENSEA}/${airdropDoc.smartContractAddress}/${tokenIdStr}`;
    const viewRewardTokenButtonArb = await buildArbButtonLink(
        "View Swag",
        airdropTokenUrl
    );

    let broadcastMessage: Message<true>;
    try {
        const forceFetch = true;
        broadcastMessage = await sendMessage(
            broadcastChannel,
            {
                content: `A new airdrop is now live! Users with the ${roleRequired} role are eligible to receive an airdrop of the ***${
                    airdropDoc.tokenMetadata.name || tokenIdStr
                }*** Swag!! Upon receiving this role, you will receive a message in a private thread with instructions on how to claim the airdrop!`,
                embeds: [airdropEmbed],
                components: [viewRewardTokenButtonArb],
            },
            forceFetch
        );
    } catch (e) {
        const errMsg =
            "Error reopening airdrop. Failed to broadcast message to channel. The airdrop has still been created but no threads or users have been added to it. Check bot permissions, conclude this airdrop, and recreate it";
        logError(errMsg, e);
        await interaction.editReply(errMsg);
        return;
    }

    // create the private thread where users with the reward role can claim the airdrop
    const tokenLabel = airdropDoc.tokenMetadata.name || tokenIdStr;
    const threadName = `Claim airdrop for the '${roleRequired.name}' role (${tokenLabel} Swag)!`;
    const newClaimAirdropThread = await createClaimAirdropThread(
        threadName,
        airdropDoc,
        roleRequired as Role,
        broadcastMessage.url
    );
    if (!newClaimAirdropThread) {
        const errMsg = `Failed to create airdrop thread! The airdrop has still been created.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // set the broadcast message ID and new thread ids in the database
    airdropDoc = await updateOneAirdropDB(airdropDoc._id, {
        $push: { claimAirdropThreadIds: newClaimAirdropThread.id },
        $set: {
            broadcastMessageId: broadcastMessage.id,
        },
    });

    const successMsg = `Successfully reopened airdrop! Users with role ${roleRequired} will receive an airdrop of the '${
        airdropDoc.tokenMetadata.name || tokenIdStr
    }' Swag`;
    logInfo(successMsg);
    await interaction.editReply(successMsg);

    for (const member of eligibleMembers.values()) {
        logInfo(
            `${member.user.tag} already has the ${roleRequired.name} role and is immediately eligible for the airdrop`
        );
        await addUserToAirdrop(member, airdropDoc);
    }
    // check if we've reached limit for available tokens to claim
    await notifyIfEligibleUsersExceedsBotTokens(airdropDoc);
}
