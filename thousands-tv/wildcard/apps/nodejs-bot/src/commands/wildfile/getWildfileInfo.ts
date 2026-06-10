import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { logInfo } from "@src/logger";
import { WILDFILE_CONTRACT } from "@src/contracts/Wildfile";
import { ADDRESS } from "@src/constants";
import { isValidAddress } from "@src/util/blockchainUtil";
import {
    buildArbButtonLink,
    getDiscordUserReference,
} from "@src/util/discordUtil";
import { getDappBaseUrl } from "@src/util/environmentUtil";
import { IUser } from "@repo/interfaces";
import { findOneUserByQuery } from "@repo/schemas";

/**
 * Command handler for /wildfile get-wildfile-info
 * @param interaction
 */
export async function handleGetWildfileInfo(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Retrieving Wildfile info...",
        ephemeral: true,
    });

    let discordTag = interaction.user.tag;
    let address = interaction.options.getString(ADDRESS);
    let user: IUser;

    logInfo(
        `${discordTag} is retrieving Wildfile info for address '${address}'`
    );

    // if they didn't provide an address, look up this user's address
    if (!address) {
        // Find address from the interacting user's discord ID
        const discordId = interaction.user.id;
        user = await findOneUserByQuery({ "discordProvider.id": discordId });
        if (!user) {
            const err = `You do not have a linked wallet`;
            logInfo(err);
            await interaction.editReply(err);
            return;
        }

        address = user.walletProvider?.address;
    } else {
        user = await findOneUserByQuery({ "walletProvider.address": address });
        // it's ok if we don't find a user here. They still might have a Wildfile
    }

    // make sure the address is valid
    if (!isValidAddress(address)) {
        const errMsg = `***${address}*** is not a valid address`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    const wildfileId = await WILDFILE_CONTRACT.getWildfileId(address);
    if (wildfileId < 1) {
        const errMsg = `***${address}*** does not have a Wildfile`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // this address may have a Wildfile even if they don't have it linked to Discord
    const userReference = user.discordProvider?.id
        ? getDiscordUserReference(user.discordProvider.id)
        : "N/A";

    // check the user's privacy settings
    const showLinkedSocials = user?.preferences?.showLinkedSocials;

    // set the user's handles
    const twitchHandle = user?.twitchProvider?.name;
    const twitterHandle = user?.twitterProvider?.name;

    const wildfileInfoEmbed = buildWildfileEmbed(
        userReference,
        wildfileId,
        address,
        twitchHandle,
        twitterHandle,
        showLinkedSocials
    );
    const wildfileUrl = `${getDappBaseUrl()}/wildfile/${wildfileId}`;

    const viewWildfileButtonArb = buildArbButtonLink(
        "View Wildfile",
        wildfileUrl
    );

    await interaction.editReply({
        content: "",
        embeds: [wildfileInfoEmbed],
        components: [viewWildfileButtonArb],
    });
}

export function buildWildfileEmbed(
    userRef: string,
    wildfileId: number,
    address: string,
    twitchHandle: string,
    twitterHandle: string,
    showLinkedSocials: boolean
): EmbedBuilder {
    const wildfileEmbed = new EmbedBuilder()
        .setTitle(`Wildfile Info`)
        .addFields(
            {
                name: "Wildfile Id",
                value: `${wildfileId}`,
                inline: true,
            },
            {
                name: "Address",
                value: address,
                inline: false,
            }
        )
        .setTimestamp();
    if (showLinkedSocials) {
        wildfileEmbed.addFields(
            {
                name: "Discord User",
                value: userRef,
                inline: true,
            },
            {
                name: "Twitch",
                value: twitchHandle ? twitchHandle : "N/A",
                inline: true,
            },
            {
                name: "Twitter",
                value: twitterHandle ? twitterHandle : "N/A",
                inline: true,
            }
        );
    }

    return wildfileEmbed;
}
