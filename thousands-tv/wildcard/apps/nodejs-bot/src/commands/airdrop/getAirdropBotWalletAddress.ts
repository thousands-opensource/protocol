import { ChatInputCommandInteraction } from "discord.js";
import {
    getBlockExplorerUrl,
    getDiscordBotWalletAddress,
    getDiscordBotWalletBalance,
} from "../../util/blockchainUtil";
import { buildArbButtonLink } from "../../util/discordUtil";
import { logInfo } from "@src/logger";

/**
 * Command handler for /airdrop get-airdrop-bot-wallet-address
 * @param interaction
 */
export async function handleGetAirdropBotWalletAddressCommand(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Retrieving airdrop bot wallet address...",
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    logInfo(`${userTag} is retrieving airdrop bot wallet address`);

    const address = getDiscordBotWalletAddress();
    const url = `${getBlockExplorerUrl()}/address/${address}`;
    const explorerButton = buildArbButtonLink("View on block explorer", url);

    const balance = await getDiscordBotWalletBalance();

    const successMsg = `My wallet address is '${address}'. Balance: ${balance} MATIC`;
    logInfo(successMsg);
    await interaction.editReply({
        content: successMsg,
        components: [explorerButton],
    });
}
