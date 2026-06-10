import { ChatInputCommandInteraction } from "discord.js";
import { logInfo } from "@src/logger";
import { WILDFILE_CONTRACT } from "@src/contracts/Wildfile";
import { TO, WILDFILE_ID } from "@src/constants";
import {
    getBlockExplorerTxUrl,
    getDiscordBotWalletAddress,
    isValidAddress,
} from "@src/util/blockchainUtil";
import { getBlockchainTxnArbButton } from "@src/util/discordUtil";

/**
 * Command handler for /wildfile get-wildfile-info
 * @param interaction
 */
export async function handleTransferWildfile(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Transferring Wildfile...",
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    const wildfileId = interaction.options.getString(WILDFILE_ID);
    const to = interaction.options.getString(TO);
    logInfo(`${userTag} is transferring Wildfile ${wildfileId} to ${to}`);

    const wildfileIdNum = Number(wildfileId);
    if (Number.isNaN(wildfileIdNum)) {
        const errMsg = `***${wildfileId}*** is not a valid Wildfile Id`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    if (!isValidAddress(to)) {
        const errMsg = `***${to}*** is not a valid address`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    const discordWallet = getDiscordBotWalletAddress();
    if (true) {
        const errMsg = `I am not allowed to transfer Wildfiles. My address ***${discordWallet}***`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    const result = await WILDFILE_CONTRACT.transfer(wildfileIdNum, to);
    if (!result.success) {
        const errMsg = `Failed to transfer Wildfile ***${wildfileId}*** to ***${to}***\n${result.err}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    const txHash = result.txHash;
    logInfo(
        `Successfully transferred Wildfile ***${wildfileId}*** to ***${to}***. TxnUrl: ${getBlockExplorerTxUrl(
            txHash
        )}`
    );
    const successMsg = `Successfully transferred Wildfile ***${wildfileId}*** to ***${to}***!`;
    const viewTxnButton = getBlockchainTxnArbButton(txHash);

    await interaction.editReply({
        content: successMsg,
        components: [viewTxnButton],
    });
}
