import { buildAirdropEmbedWithStats } from "@src/util/embedUtil";
import {
    getWildcardSwagContractAddress,
    getDiscordAppId,
    getMinBotTokenBalance,
} from "@src/util/environmentUtil";
import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    Message,
    Role,
    TextChannel,
} from "discord.js";
import { BigNumber } from "ethers";
import { getTokenMetadata, isValidAirdropDuration } from "@src/util/util";
import {
    AIRDROP_DURATION_HOURS,
    ROLE,
    TOKEN_ID,
    CHANNEL,
    AIRDROP_TOKEN_BASE_URL_OPENSEA,
} from "../../constants";
import { WILDCARD_SWAG_CONTRACT } from "../../contracts/WildcardSwag";
import { getDiscordBotWalletAddress } from "../../util/blockchainUtil";
import {
    buildArbButtonLink,
    createClaimAirdropThread,
    getDefaultAirdropChannel,
    isMemberInChannel,
    sendMessage,
} from "../../util/discordUtil";
import { getMembersWithRole } from "../../util/roleUtil";
import { logError, logInfo } from "@src/logger";
import { client } from "@src/index";
import {
    addUserToAirdrop,
    notifyIfEligibleUsersExceedsBotTokens,
} from "@src/airdrop";
import { IAirdrop } from "@repo/interfaces";
import {
    createAirdropDB,
    findOneAirdropByQuery,
    updateOneAirdropDB,
} from "@repo/schemas";

/**
 * Command handler for /airdrop-admin create-airdrop
 * @param interaction
 */
export async function handleCreateAirdropCommand(
    interaction: ChatInputCommandInteraction
) {
    // reply immediately so the interaction does not time out while we are creating the airdrop
    await interaction.reply({
        content: `Creating airdrop... hang tight`,
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
        `${userTag} is attempting to create airdrop in ${broadcastChannel.name} for role '${roleRequired.name}' and token Id '${tokenIdStr}', airdropDurationHours ${airdropDurationHours}`
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
        const errMsg = `Error creating airdrop: the airdrop bot is missing access/permissions. Please make sure the bot has permission to access ${broadcastChannel} AND send messages to channel.`;
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

    // make sure there isn't already an active airdrop for that role & token
    const activeAirdropByRoleDoc = await findOneAirdropByQuery({
        active: true,
        roleRequiredId: roleRequired.id,
        tokenId: tokenIdStr,
    });
    if (activeAirdropByRoleDoc) {
        const errMsg = `An active airdrop for role '${roleRequired}', token id '${tokenIdStr}', already exists (active airdrop id: ${activeAirdropByRoleDoc._id})`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    const tokenIdBN = BigNumber.from(tokenIdStr);
    // make sure the bot has enough tokens in its wallet to start the airdrop
    const botBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        getDiscordBotWalletAddress(),
        tokenIdBN
    );
    const botBalance = botBalanceBN.toNumber();

    const minBalanceRequired = getMinBotTokenBalance();
    if (botBalance < minBalanceRequired) {
        const errMsg = `Failed to create airdrop. My balance for Token ID '${tokenIdStr}' is too low. Current balance: ${botBalance}, Minimum balance: ${minBalanceRequired}. To create an airdrop, transfer the tokens to my address: ${getDiscordBotWalletAddress()}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // create the airdrop item
    const airdropContractAddress = getWildcardSwagContractAddress();
    const tokenMetadata = await getTokenMetadata(tokenIdStr);
    const airdrop: IAirdrop = {
        createdBy: userTag,
        active: true,
        roleRequiredId: roleRequired.id,
        smartContractAddress: airdropContractAddress,
        tokenId: tokenIdStr,
        tokenMetadata,
        broadcastChannelId: broadcastChannel.id,
    };

    if (airdropDurationHours) {
        if (!isValidAirdropDuration(airdropDurationHours)) {
            const errMsg = `Invalid airdrop duration hours ${airdropDurationHours}. The duration must be a positive integer`;
            logInfo(errMsg);
            await interaction.editReply(errMsg);
            return;
        }

        // add the duration to the current time to get the concludesAt
        const concludesAt = new Date();
        concludesAt.setHours(concludesAt.getHours() + airdropDurationHours);
        airdrop.concludesAt = concludesAt;
    }

    // find all members with the given role
    const eligibleMembers = await getMembersWithRole(roleRequired.id);

    let airdropDoc = await createAirdropDB(airdrop);
    // build the airdrop embed and broadcast it
    const airdropEmbed: EmbedBuilder = await buildAirdropEmbedWithStats(
        airdrop,
        eligibleMembers.size,
        0
    );
    const airdropTokenUrl = `${AIRDROP_TOKEN_BASE_URL_OPENSEA}/${airdropContractAddress}/${tokenIdStr}`;
    const viewRewardTokenButtonArb = await buildArbButtonLink(
        "View Swag",
        airdropTokenUrl
    );

    let broadcastMessage: Message<true>;
    const forceFetch = true; // force fetch the message after sending it to ensure the embeds show up correctly
    try {
        broadcastMessage = await sendMessage(
            broadcastChannel,
            {
                content: `A new airdrop is now live! Users with the ${roleRequired} role are eligible to receive an airdrop of the ***${
                    tokenMetadata.name || tokenIdStr
                }*** Swag!! Upon receiving this role, you will receive a message in a private thread with instructions on how to claim the airdrop!`,
                embeds: [airdropEmbed],
                components: [viewRewardTokenButtonArb],
            },
            forceFetch
        );
    } catch (e) {
        const errMsg =
            "Error creating airdrop. Failed to broadcast message to channel. The airdrop has still been created but no threads or users have been added to it. Check bot permissions, conclude this airdrop, and recreate it";
        logError(errMsg, e);
        await interaction.editReply(errMsg);
        return;
    }

    // create the private thread where users with the reward role can claim the airdrop
    const tokenLabel = tokenMetadata.name || tokenIdStr;
    const threadName = `Claim airdrop for the '${roleRequired.name}' role (${tokenLabel} Swag)!`;
    const newClaimAirdropThread = await createClaimAirdropThread(
        threadName,
        airdropDoc,
        roleRequired as Role,
        broadcastMessage.url
    );
    if (!newClaimAirdropThread) {
        const errMsg = `Unable to create create airdrop thread! The airdrop has still been created.`;
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

    const successMsg = `Successfully created airdrop! Users with role ${roleRequired} will receive an airdrop of the '${
        tokenMetadata.name || tokenIdStr
    }' Swag`;
    logInfo(successMsg);
    await interaction.editReply(successMsg);

    // once the airdrop is created and active, go through the members who already have that role. They are immediately eligible to claim the airdrop.
    for (const member of eligibleMembers.values()) {
        logInfo(
            `${member.user.tag} already has the ${roleRequired.name} role and is immediately eligible for the airdrop`
        );
        airdropDoc = await addUserToAirdrop(member, airdropDoc);
    }
    // check if we've reached limit for available tokens to claim
    await notifyIfEligibleUsersExceedsBotTokens(airdropDoc);
}
