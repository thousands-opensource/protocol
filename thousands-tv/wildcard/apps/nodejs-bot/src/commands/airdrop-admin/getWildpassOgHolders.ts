import { alchemyPolygon } from "@src/index";
import { logError, logInfo } from "@src/logger";
import { getWildpassContractAddress } from "@src/util/environmentUtil";
import {
    AssetTransfersCategory,
    AssetTransfersResponse,
    AssetTransfersResult,
} from "alchemy-sdk";
import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";

interface WildpassIdToAddressMap {
    [wildpassId: number]: string;
}

/**
 * Command handler for /airdrop-admin get-wildpass-og-holders
 * @param interaction
 */
export async function getWildpassOgHolders(
    interaction: ChatInputCommandInteraction
) {
    const openingLog = `User: ${interaction.user?.tag} is getting all wallet addresses and wildfile id's of users who have held since mint day`;
    logInfo(openingLog);
    await interaction.reply({
        content: openingLog,
        ephemeral: true,
    });
    try {
        let allAssetTransfers: AssetTransfersResult[] = [];
        //call alchemy api and get all asset transfers
        let keepFetching = true;
        let pageKey;
        while (keepFetching) {
            const res: AssetTransfersResponse =
                await alchemyPolygon.core.getAssetTransfers({
                    fromBlock: "0x0",
                    contractAddresses: [getWildpassContractAddress()],
                    excludeZeroValue: true,
                    category: [AssetTransfersCategory.ERC721],
                    pageKey,
                });
            allAssetTransfers.push(...res.transfers);

            if (res.pageKey) {
                pageKey = res.pageKey;
            } else {
                keepFetching = false;
            }
        }

        //50,000 blocks after first wildpass minted (approx 1 day)
        const LAST_BLOCK_CONSIDERED_OG = 41781207;
        let transfersAfterLastOgBlock: AssetTransfersResult[] = [];

        //preprocess and find all the last to addresses before the last block
        let wildpassIdToAddressMap: WildpassIdToAddressMap = {};
        for (const transfer of allAssetTransfers) {
            if (Number(transfer.blockNum) < LAST_BLOCK_CONSIDERED_OG) {
                wildpassIdToAddressMap[Number(transfer.tokenId)] = transfer.to;
            } else {
                transfersAfterLastOgBlock.push(transfer);
            }
        }

        //If there was a transfer with this token id after the last og block, remove that key value from the object
        for (const transfer of transfersAfterLastOgBlock) {
            delete wildpassIdToAddressMap[Number(transfer.tokenId)];
        }

        //Create the csv of structure wildpassId,walletAddress
        let rows: string[] = [];
        for (const wildpassId of Object.keys(wildpassIdToAddressMap)) {
            rows.push(
                `${wildpassId},${wildpassIdToAddressMap[Number(wildpassId)]}`
            );
        }
        rows.unshift("Wildpass Id,Wallet Address");

        const formattedDate = new Date()
            .toLocaleDateString()
            .replace(/\//g, "-");
        const fileName = `wildpass-og-holders-${formattedDate}.csv`;
        const csv = rows.join("\n");
        fs.writeFileSync(fileName, csv, "utf-8");
        const attachment = new AttachmentBuilder(`./${fileName}`);

        const successMsg = `Successfully generated wildpass og holders csv!`;
        logInfo(successMsg);

        await interaction.editReply({
            content: successMsg,
            files: [attachment],
        });
        fs.rmSync(fileName);
    } catch (e) {
        const errMsg = "There was an error getting the og wildpass holders";
        logError(errMsg, e);
        await interaction.editReply(errMsg);
        return;
    }
}
