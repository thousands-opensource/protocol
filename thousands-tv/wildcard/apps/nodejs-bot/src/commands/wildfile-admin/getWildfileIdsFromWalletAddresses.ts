import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
} from "discord.js";
import {
    GET_WILDFILE_IDS_FROM_ADDRESSES_MODAL_ID,
    WALLET_ADDRESSES_INPUT_FIELD,
} from "../../constants";
import { addModalFieldParagraph } from "@src/util/modalUtil";
import fs from "fs";
import { logError, logInfo } from "@src/logger";
import { getAddress } from "ethers/lib/utils";
import { findUsersByQuery } from "@repo/schemas";

/**
 * Command handler for creating modal to get wildfile ids /get-wildfile-ids-from-addresses
 * @param interaction
 */
export async function getWildfileIdsFromWalletAddressesModal(
    interaction: ChatInputCommandInteraction
) {
    let mb = new ModalBuilder()
        .setCustomId(GET_WILDFILE_IDS_FROM_ADDRESSES_MODAL_ID)
        .setTitle("Get Wildfile Ids From Wallet Addresses");
    addModalFieldParagraph(
        mb,
        WALLET_ADDRESSES_INPUT_FIELD,
        "Input Wallet Addresses to Get Wildfile Ids",
        true,
        4000,
        1,
        "Enter your Wallet Addresses here - comma separated"
    );

    await interaction.showModal(mb);
}

/**
 * Build the csv to return for community team to see, which wildfile id is associated with each user by address
 * NOTE: THIS MUST BE REVISED IN THE CASE WILDFILES BECOME TRANSFERRABLE - DO NOT USE INITIALWILDFILEID PARAM
 * @param interaction - modal submit interaction
 */
export async function getWildfileIdsFromWalletAddressesCsv(
    interaction: ModalSubmitInteraction
) {
    logInfo("Getting wildfiles from wallet addresses");
    await interaction.reply({
        content: "Gathering your wildfile ids csv...",
        ephemeral: true,
    });
    try {
        //get address list and make sure to trim whitespace
        const addressListInput = interaction.fields.getTextInputValue(
            WALLET_ADDRESSES_INPUT_FIELD
        );
        let addressList = addressListInput.split(",");
        for (let i = 0; i < addressList.length; i++) {
            addressList[i] = getAddress(addressList[i].trim());
        }

        //Query the users in the wallet address list
        const query = {
            $or: [
                { "walletProvider.address": { $in: addressList } },
                { "walletProvider.additionalWallets": { $in: addressList } },
            ],
        };
        const users = await findUsersByQuery(query);
        logInfo(`users length: ${users.length}`);

        //With our users now we format our rows - make sure each input user was found
        let rows: string[] = [];
        for (let user of users) {
            if (!user.walletProvider?.wildfile?.initialWildfileId) {
                rows.push(
                    `${user.discordProvider?.discordTag} - this person does not have a initialWildfileId`
                );
                continue;
            }
            rows.push(`${user.walletProvider?.wildfile?.initialWildfileId}`);
        }

        rows.unshift("Wildfile Id");

        const formattedDate = new Date()
            .toLocaleDateString()
            .replace(/\//g, "-");
        const fileName = `wildfile-ids-${formattedDate}.csv`;
        const csv = rows.join("\n");
        fs.writeFileSync(fileName, csv, "utf-8");
        const attachment = new AttachmentBuilder(`./${fileName}`);

        const successMsg = `Successfully generated wildfile ids csv from addresses! Found ${users.length} users from ${addressList.length} addresses.`;
        logInfo(successMsg);

        await interaction.editReply({
            content: successMsg,
            files: [attachment],
        });
        fs.rmSync(fileName);
    } catch (e) {
        logError("Something went wrong getting wildfile ids from addresses", e);
    }
}
