import { buildAirdropEmbedWithStatsFanVis } from "@src/util/embedUtil";
import {
    getWildcardSwagContractAddress,
    getDiscordAppId,
    getMinBotTokenBalance,
    getFanAttendanceAirdropTokenId,
} from "@src/util/environmentUtil";
import { EmbedBuilder, Message } from "discord.js";
import { BigNumber } from "ethers";
import { getTokenMetadata } from "@src/util/util";
import { AIRDROP_TOKEN_BASE_URL_OPENSEA } from "../../constants";
import { WILDCARD_SWAG_CONTRACT } from "../../contracts/WildcardSwag";
import { getDiscordBotWalletAddress } from "../../util/blockchainUtil";
import {
    alertAirdropAdmins,
    buildArbButtonLink,
    getDefaultAirdropChannel,
    isMemberInChannel,
    sendMessage,
} from "../../util/discordUtil";
import { logError, logInfo } from "@src/logger";
import { client } from "@src/index";
import { IAirdropFanAttendance, IDiscordEvent } from "@repo/interfaces";
import { createAirdropFanAttendanceDB } from "@repo/schemas";

/***
 * Handle the creation of Fan Attendance Airdrop for live events
 * @param iDiscordEvent - the discord event to handle
 */
export async function handleCreateAirdropFanAttendance(
    iDiscordEvent: IDiscordEvent
) {
    try {
        logInfo(
            `creating a fan attendance airdrop for event ${iDiscordEvent.name}'`
        );

        const airdropFanAttendanceDoc = await createAirdropFanAttendance(
            iDiscordEvent
        );

        if (!airdropFanAttendanceDoc) {
            const errMsg = `Failed to create fan attendance airdrop for event ${iDiscordEvent.name}`;
            logError(errMsg);
            alertAirdropAdmins(errMsg);
            return;
        }

        const infoMsg = `Successfully created fan attendance airdrop for event ${iDiscordEvent.name}`;
        logInfo(infoMsg);
    } catch (e) {
        const errMsg = `Failed to create fan attendance airdrop for event ${iDiscordEvent.name}`;
        logError(errMsg, e);
        alertAirdropAdmins(errMsg);
        return;
    }
}

/**
 * Create Fan Attendance Airdrop Creation for live events
 * @param iDiscordEvent - the discord event to handle
 */
async function createAirdropFanAttendance(
    iDiscordEvent: IDiscordEvent
): Promise<IAirdropFanAttendance> {
    const discordBotTag = client.user.tag;
    const broadcastChannel = await getDefaultAirdropChannel(); // sent to the same airdrop channel as the other airdrops

    const tokenIdNumber = getFanAttendanceAirdropTokenId(); // the tokenId of the swag to airdrop to users

    logInfo(
        `${discordBotTag} is attempting to create fan attendance airdrop in ${broadcastChannel.name} for '${tokenIdNumber}'`
    );

    if (!iDiscordEvent.sessionCode) {
        const errMsg = `Error creating fan attendance airdrop: no session code was provided for the event`;
        logError(errMsg);
        return;
    }

    // make sure bot has permission to access and send messages to this channel
    const botId = getDiscordAppId();
    const botIsMember = await isMemberInChannel(broadcastChannel.id, botId);

    const bot = client.user;
    const botCanSendMessages = broadcastChannel
        .permissionsFor(bot)
        .has("SendMessages");
    const botHasPermission = botIsMember && botCanSendMessages;

    if (!botHasPermission) {
        const errMsg = `Error creating fan attendance airdrop: the fan attendance airdrop bot is missing access/permissions. Please make sure the bot has permission to access ${broadcastChannel} AND send messages to channel.`;
        logError(errMsg);
        alertAirdropAdmins(errMsg);
        return;
    }

    // make sure the token ID is actually a number. It cannot be a 'number' option type because tokenIds can be too large
    if (!Number(tokenIdNumber)) {
        const errMsg = `Invalid Token ID '${tokenIdNumber}'. It must be a positive number`;
        logInfo(errMsg);
        return;
    }

    const tokenIdBN = BigNumber.from(tokenIdNumber);
    // make sure the bot has enough tokens in its wallet to start the fan attendance airdrop
    const botBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        getDiscordBotWalletAddress(),
        tokenIdBN
    );
    const botBalance = botBalanceBN.toNumber();

    const minBalanceRequired = getMinBotTokenBalance();
    if (botBalance < minBalanceRequired) {
        const errMsg = `Failed to create fan attendance airdrop. My balance for Token ID '${tokenIdNumber}' is too low. Current balance: ${botBalance}, Minimum balance: ${minBalanceRequired}. To create an airdrop, transfer the tokens to my address: ${getDiscordBotWalletAddress()}`;
        logInfo(errMsg);
        return;
    }

    // get network chain id for direct the swag contract address
    const contractChainId = await WILDCARD_SWAG_CONTRACT.getChainId();

    // create the fan attendance airdrop item
    const airdropFanAttendanceContractAddress =
        getWildcardSwagContractAddress();
    const tokenIdString = tokenIdNumber.toString();
    const tokenMetadata = await getTokenMetadata(tokenIdString);
    const airdropFanAttendance: IAirdropFanAttendance = {
        createdBy: discordBotTag,
        active: true,
        smartContractAddress: airdropFanAttendanceContractAddress,
        tokenId: tokenIdString,
        tokenMetadata,
        chainId: contractChainId,
        eventChanelId: iDiscordEvent.channelId,
        broadcastChannelId: broadcastChannel.id,
        sessionCode: iDiscordEvent.sessionCode,
    };

    const airdropFanAttendanceDoc = await createAirdropFanAttendanceDB(
        airdropFanAttendance
    );

    // build the fan attendance airdrop embed and broadcast it
    const airdropFanAttendanceCreatedEmbed: EmbedBuilder =
        await buildAirdropEmbedWithStatsFanVis(
            airdropFanAttendance,
            iDiscordEvent
        );
    const airdropFanAttendanceTokenUrl = `${AIRDROP_TOKEN_BASE_URL_OPENSEA}/${airdropFanAttendanceContractAddress}/${tokenIdNumber}`;
    const viewRewardTokenButtonArb = await buildArbButtonLink(
        "View Swag",
        airdropFanAttendanceTokenUrl
    );

    let broadcastMessage: Message<true>;
    try {
        broadcastMessage = await sendMessage(broadcastChannel, {
            content: `A new Playtest event is now live! 🎉 \nAll Users who have attended the live event can win a chance for an airdrop ***${
                tokenMetadata.name || tokenIdNumber
            }*** Swag!! \nNo need to claim, a lucky contestant will be selected in-game, and will receive an airdrop to their linked wallet address!`,
            embeds: [airdropFanAttendanceCreatedEmbed],
            components: [viewRewardTokenButtonArb],
        });
    } catch (e) {
        const errMsg =
            "Error creating fan attendance airdrop. Failed to broadcast message to channel. The airdrop has still been created but no threads or users have been added to it. Check bot permissions, conclude this airdrop, and recreate it";
        logError(errMsg, e);
        return;
    }

    const successMsg = `Successfully created fan attendance airdrop! Users who attend the live event and are selected will receive '${
        tokenMetadata.name || tokenIdNumber
    }' Swag`;
    logInfo(successMsg);

    return airdropFanAttendanceDoc;
}
