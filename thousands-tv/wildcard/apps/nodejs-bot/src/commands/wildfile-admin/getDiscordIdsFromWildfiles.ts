import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
} from "discord.js";
import { escapeForCSV } from "@src/util/util";
import {
    GET_DISCORD_IDS_MODAL_ID,
    WILDFILE_IDS_INPUT_FIELD,
} from "../../constants";
import { alchemyPolygon } from "@src/index";

import { addModalFieldParagraph } from "@src/util/modalUtil";
import fs from "fs";
import { getWildfileContractAddress } from "@src/util/environmentUtil";
import { getOwnersForContract } from "@src/util/alchemyUtil";
import { getAddress } from "viem";
import { findUsersByQuery } from "@repo/schemas";

/**
 * Command handler for creating modal to get discord ids /get-discord-ids-from-wildfiles
 * @param interaction
 */
export async function getDiscordIdsFromWildfileIdsModal(
    interaction: ChatInputCommandInteraction
) {
    let mb = new ModalBuilder()
        .setCustomId(GET_DISCORD_IDS_MODAL_ID)
        .setTitle("Get Discord Ids from Wildfile Ids");
    addModalFieldParagraph(
        mb,
        WILDFILE_IDS_INPUT_FIELD,
        "Input Wildfile Ids to Get Discord Ids",
        true,
        4000,
        1,
        "Enter your wildfile ids here - comma separated"
    );

    await interaction.showModal(mb);
}

interface WalletAddressToUserIdMap {
    [walletAddress: string]: string;
}

interface WildFileToAddressMap {
    [wildfileId: string]: string;
}

/**
 * Build the csv to return for community team to see who owns which wildfile id
 * @param interaction - modal submit interaction
 */
export async function getDiscordIdsFromWildfileIdsCsv(
    interaction: ModalSubmitInteraction
) {
    await interaction.reply({
        content: "Gathering your discord ids csv...",
        ephemeral: true,
    });

    //Get all wildfile owners in a few calls
    const wildfileAddress = getWildfileContractAddress();
    let wildfileOwners = await getOwnersForContract(
        alchemyPolygon,
        wildfileAddress
    );

    //Create a map from wildfile -> wallet address, so we only process this list once
    let wildFileToAddressMap: WildFileToAddressMap = {};
    for (let wildfileOwner of wildfileOwners) {
        const currOwnerAddress = getAddress(wildfileOwner.ownerAddress);
        const wildfileId = parseInt(
            wildfileOwner.tokenBalances[0].tokenId,
            16
        ).toString();
        wildFileToAddressMap[wildfileId] = currOwnerAddress;
    }

    //Create a wallet address map to easily index into walletAddress -> token id. Create wallet list to query mongo
    let walletAddressToWildFileMap: WalletAddressToUserIdMap = {};
    let walletAddressList: string[] = [];
    const wildfileIdInput = interaction.fields.getTextInputValue(
        WILDFILE_IDS_INPUT_FIELD
    );

    const wildfileIdList = wildfileIdInput.split(",");
    for (const wildfileId of wildfileIdList) {
        const wildfileIdTrimmed = wildfileId.trim();
        const wildfileAddr = wildFileToAddressMap[wildfileIdTrimmed];
        walletAddressToWildFileMap[wildfileAddr] = wildfileIdTrimmed;
        walletAddressList.push(wildfileAddr);
    }

    console.log("walletAddressToWildFileMap", walletAddressToWildFileMap);
    console.log("walletAddressList", walletAddressList);

    const query = { "walletProvider.address": { $in: walletAddressList } };
    const users = await findUsersByQuery(query);

    console.log("users", users.length);

    //With our users now we format our rows - make sure each input user was found
    let rows: string[] = [];
    for (const walletAddress of walletAddressList) {
        const user = users.find(
            (user) => user.walletProvider?.address === walletAddress
        );
        if (!user) {
            rows.push(
                `wallet: ${walletAddress} and id: ${
                    walletAddressToWildFileMap[walletAddress]
                } not associated with user,${""},${""}`
            );
            continue;
        }
        const userWildFileId =
            walletAddressToWildFileMap[user.walletProvider?.address] || -1;
        const discordId = escapeForCSV(user.discordProvider?.discordId || "");
        const discordTag = escapeForCSV(user.discordProvider?.discordTag || "");
        rows.push(`${userWildFileId},${discordId},${discordTag}`);
    }

    rows.unshift("Wildfile Id,Discord Id,Discord Tag");

    const formattedDate = new Date().toLocaleDateString().replace(/\//g, "-");
    const fileName = `discord-ids-${formattedDate}.csv`;
    const csv = rows.join("\n");
    fs.writeFileSync(fileName, csv, "utf-8");
    const attachment = new AttachmentBuilder(`./${fileName}`);

    const successMsg = `Successfully generated discord ids csv!`;
    console.log(successMsg);

    await interaction.editReply({
        content: successMsg,
        files: [attachment],
    });
    fs.rmSync(fileName);
}
