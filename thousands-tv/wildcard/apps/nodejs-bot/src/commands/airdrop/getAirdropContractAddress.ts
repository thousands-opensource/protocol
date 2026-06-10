import {
    getWildcardSwagContractAddress,
    getOpenSeaCollectionUrl,
} from "@src/util/environmentUtil";
import { ChatInputCommandInteraction } from "discord.js";
import { getBlockExplorerUrl } from "../../util/blockchainUtil";
import { buildArbButtonLink } from "../../util/discordUtil";
import { logInfo } from "@src/logger";

/**
 * Command handler for /airdrop get-airdrop-contract-address
 * @param interaction
 */
export async function handleGetAirdropContractAddressCommand(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Retrieving airdrop contract address",
        ephemeral: true,
    });

    logInfo(`${interaction.user.tag} is retrieving airdrop contract address`);

    const address = await getWildcardSwagContractAddress();
    if (!address) {
        await interaction.editReply(
            "A smart contract address for airdrops has not been set"
        );
        return;
    }

    const addressUrl = `${getBlockExplorerUrl()}/address/${address}`;
    const viewContractButton = buildArbButtonLink("View contract", addressUrl);
    const viewCollectionButton = buildArbButtonLink(
        "View collection",
        getOpenSeaCollectionUrl()
    );

    await interaction.editReply({
        content: `The airdrop smart contract address '${address}'`,
        components: [viewContractButton, viewCollectionButton],
    });
}
