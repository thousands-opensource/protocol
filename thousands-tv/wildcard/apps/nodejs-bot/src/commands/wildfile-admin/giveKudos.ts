import { KUDOS_REASON, KUDOS_OPTIONS, KUDOS_TYPE, TO } from "@src/constants";
import { BigNumber } from "ethers";
import { logError, logInfo } from "@src/logger";
import { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { WILDCARD_SWAG_CONTRACT } from "@src/contracts/WildcardSwag";
import { getDiscordBotWalletAddress } from "@src/util/blockchainUtil";
import {
    getDiscordAppId,
    getKudosChannelId,
    getMinBotTokenBalance,
} from "@src/util/environmentUtil";
import { getChannel, isMemberInChannel } from "@src/util/discordUtil";
import { client } from "@src/index";
import { writeTransactionQueue } from "@src/transactionQueue/transactionQueueService";
import {
    AirdropTransactionData,
    BlockchainStatusEnum,
    BundleTypeEnum,
    KudosType,
    Transaction,
    TransactionStatusEnum,
    TxnTypeEnum,
    KudosTransactionData,
} from "@repo/interfaces";
import { findOneUserByQuery } from "@repo/schemas";

/**
 * Handles the interaction for giving kudos in Discord.
 * @param interaction - The ChatInputCommandInteraction object from Discord.
 */
export async function giveKudos(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
        content: "Giving kudos...",
        ephemeral: true,
    });

    const adminDiscordTag = interaction.user.tag;
    const adminDiscordId = interaction.user.id;
    const kudosReason = interaction.options.getString(KUDOS_REASON) || "";
    const recipientDiscordUser = interaction.options.getUser(TO);
    const kudosTypeValue = interaction.options.getString(
        KUDOS_TYPE
    ) as KudosType;

    const kudosOption = KUDOS_OPTIONS.find(
        (option) => option.value === kudosTypeValue
    );
    const kudosTypeName = kudosOption.name;
    const tokenIdStr = kudosOption.tokenId;

    const recipientDiscordTag = recipientDiscordUser.tag;
    const recipientDiscordId = recipientDiscordUser.id;

    logInfo(
        `${adminDiscordTag} is giving kudos "${kudosTypeName}" to ${recipientDiscordTag}. Token ID to airdrop: ${tokenIdStr}`
    );

    //--- CHECKS
    // Ensure kudos channel exists
    const kudosChannelId = getKudosChannelId();
    if (!kudosChannelId) {
        const errMsg = `Cannot retrieve kudos channel, KUDOS_CHANNEL_ID env var must be set before giving kudos.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Ensure kudos channel can be retrieved
    let kudosChannel: TextChannel;
    try {
        kudosChannel = await getChannel(kudosChannelId);
    } catch (e) {
        const errMsg = `Unable to retrieve kudos channel, please check that the KUDOS_CHANNEL_ID env var is correctly set.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Ensure bot has permission to access and send messages to this channel
    const botId = getDiscordAppId();
    const botIsMember = await isMemberInChannel(kudosChannelId, botId);
    const bot = client.user;
    const botCanSendMessages = kudosChannel
        .permissionsFor(bot)
        .has("SendMessages");
    const botHasPermission = botIsMember && botCanSendMessages;

    if (!botHasPermission) {
        const errMsg = `Error sending kudos: the airdrop bot is missing access/permissions. Please make sure the bot has permission to access ${kudosChannel} AND send messages to channel.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Ensure recipient exists in DB
    const recipient = await findOneUserByQuery({
        "discordProvider.id": recipientDiscordId,
    });
    logInfo(`Recipient DiscordId: ${recipientDiscordId}`);
    if (!recipient) {
        const errMsg = `Could not find recipient '${recipientDiscordTag}' in database.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Ensure recipient has wallet address in DB
    if (!recipient.walletProvider?.address) {
        const errMsg = `Could not find recipient's wallet address of '${recipientDiscordTag}' in database.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Ensure admin exists in DB
    const admin = await findOneUserByQuery({
        "discordProvider.id": adminDiscordId,
    });
    logInfo(`Admin DiscordId: ${adminDiscordId}`);
    if (!admin) {
        const errMsg = `Could not find admin '${adminDiscordTag}' in database.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Ensure the bot has enough tokens in its wallet to complete the airdrop
    const tokenIdBN = BigNumber.from(tokenIdStr);
    const botBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        getDiscordBotWalletAddress(),
        tokenIdBN
    );
    const botBalance = botBalanceBN.toNumber();
    const minBalanceRequired = getMinBotTokenBalance();
    if (botBalance < minBalanceRequired) {
        const errMsg = `Failed to give kudos. My balance for Token ID '${tokenIdStr}' is too low. Current balance: ${botBalance}, Minimum balance: ${minBalanceRequired}. To give kudos with an airdrop, transfer the tokens to my address: ${getDiscordBotWalletAddress()}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    //--- WRITE TO TRANSACTION BUNDLE TO THE QUEUE
    try {
        // Define the transaction data for the Give Kudos event
        const giveKudosTransactionData: KudosTransactionData = {
            recipientDBId: recipient._id,
            adminDBId: admin._id,
            kudosType: kudosTypeValue,
            kudosReason: kudosReason,
        };

        const airdropTransactionData: AirdropTransactionData = {
            recipientDBId: recipient._id,
            tokenIdStr: tokenIdStr,
        };

        // Add the transactions to the transaction bundle
        const transactionBundle: Transaction[] = [];

        transactionBundle.push({
            status: TransactionStatusEnum.READY,
            blockchainStatus: BlockchainStatusEnum.NOT_SUBMITTED,
            data: JSON.stringify(giveKudosTransactionData),
            type: TxnTypeEnum.KUDOS,
        });

        transactionBundle.push({
            status: TransactionStatusEnum.READY,
            blockchainStatus: BlockchainStatusEnum.NOT_SUBMITTED,
            data: JSON.stringify(airdropTransactionData),
            type: TxnTypeEnum.AIRDROP,
        });

        // Send the transaction bundle to the service layer to be added to the transaction queue
        const transactionQueueStatus = await writeTransactionQueue(
            transactionBundle,
            BundleTypeEnum.GIVE_KUDOS,
            recipient._id
        );

        const kudosChannelId = getKudosChannelId();
        const kudosChannelTag = kudosChannelId
            ? `<#${kudosChannelId}>`
            : "Kudos Channel";

        const adminDiscordLink = `<@${adminDiscordId}>`;
        const recipientDiscordLink = `<@${recipientDiscordId}>`;

        if (!transactionQueueStatus) {
            const errMsg = `Failed to write a transaction for the Give Kudos event '${kudosTypeValue}'. From ${adminDiscordLink} to ${recipientDiscordLink} - ${kudosReason}'`;
            interaction.editReply(errMsg);
            throw new Error(errMsg);
        }

        // Log the successful creation of the transaction queue
        let statusMsg = `A transaction was created for the Give Kudos event '${kudosTypeValue}'! From ${adminDiscordLink} to ${recipientDiscordLink} - ${kudosReason}\nGo to the Kudos Channel ${kudosChannelTag} to see the results!'`;
        logInfo(statusMsg);
        interaction.editReply(statusMsg);
    } catch (e) {
        logError(
            `Failed to handle the Give Kudos event from Admin [${admin._id}] to Recipient [${recipient._id}] '${kudosTypeValue} - ${kudosReason}' :'`,
            e
        );
    }
}
