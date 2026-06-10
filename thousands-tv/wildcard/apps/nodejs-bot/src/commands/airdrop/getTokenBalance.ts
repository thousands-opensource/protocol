import { isValidAddress } from "@src/util/blockchainUtil";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { BigNumber } from "ethers";
import { ADDRESS, TOKEN_ID } from "../../constants";
import { WILDCARD_SWAG_CONTRACT } from "../../contracts/WildcardSwag";
import { logInfo } from "@src/logger";

/**
 * Command handler for /airdrop get-token-balance
 * @param interaction
 */
export async function handleGetTokenBalanceCommand(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Retrieving token balance...",
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    const address = interaction.options.getString(ADDRESS);
    const tokenIdStr = interaction.options.getString(TOKEN_ID);
    logInfo(
        `${userTag} is retrieving token ID '${tokenIdStr}' balance for address '${address}`
    );

    // make sure the token ID is actually a number. It cannot be a 'number' option type because tokenIds can be too large
    if (!Number(tokenIdStr)) {
        const errMsg = `Invalid Token ID '${tokenIdStr}'. It must be a positive number`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    if (!isValidAddress(address)) {
        const errMsg = `'${address}' is not a valid address`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    const tokenIdBN = BigNumber.from(tokenIdStr);
    const tokenBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        address,
        tokenIdBN
    );
    const tokenBalance = tokenBalanceBN.toNumber();

    const tokenBalanceEmbed = new EmbedBuilder()
        .addFields({
            name: "Address",
            value: address,
            inline: true,
        })
        .addFields({
            name: "Token ID",
            value: tokenIdStr,
            inline: true,
        })
        .addFields({
            name: "Token Balance",
            value: tokenBalance.toString(),
            inline: true,
        });

    logInfo(
        `Token ID '${tokenIdStr}' balance for address '${address}' is ${tokenBalance}`
    );
    await interaction.editReply({
        content: "",
        embeds: [tokenBalanceEmbed],
    });
}
