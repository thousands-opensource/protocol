import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import { logError, logInfo } from "@src/logger";
import { FilterQuery } from "mongoose";
import { getOwnersForContract } from "@src/util/alchemyUtil";
import { alchemyPolygon } from "@src/index";
import { getWildfileContractAddress } from "@src/util/environmentUtil";
import fs from "fs";
import { escapeForCSV } from "@src/util/util";
import { IUser } from "@repo/interfaces";
import { countUsersDocument, findUsersByQuery } from "@repo/schemas";

export async function generateHelikaReport(
    interaction: ChatInputCommandInteraction
) {
    console.log("Generating Helika Report");
    await interaction.reply({
        content: "Generating Helika Report...",
        ephemeral: true,
    });

    const query: FilterQuery<IUser> = {
        $and: [
            { "walletProvider.address": { $nin: [null, ""] } },
            { "discordProvider.id": { $nin: [null, ""] } },
            { "walletProvider.wildfile.mintTxn": { $nin: [null, ""] } },
        ],
    };
    let attachment: AttachmentBuilder;
    const formattedDate = new Date().toLocaleDateString().replace(/\//g, "-");
    const fileName = `helika-report-${formattedDate}.csv`;
    try {
        // Get total number of user from matching query
        const totalEligibleUsersCount = await countUsersDocument(query);
        let totalEligibleUsers: IUser[] = [];

        // Batch 500 eligible users till it exceeds total eligible users
        let iteration = 0;
        const batchSize = 500;
        while (iteration * batchSize < totalEligibleUsersCount) {
            const eligibleUsers: IUser[] = await findUsersByQuery(
                query,
                {
                    "walletProvider.address": 1,
                    "discordProvider.id": 1,
                    "discordProvider.discordTag": 1,
                },
                { limit: batchSize, skip: iteration * batchSize }
            );

            totalEligibleUsers = totalEligibleUsers.concat(eligibleUsers);
            iteration += 1;
        }
        const wildfileAddress = getWildfileContractAddress();
        let wildfileOwners = await getOwnersForContract(
            alchemyPolygon,
            wildfileAddress
        );

        //Set all the addresses to lowercase and turn into a map instead of array
        let wildFileOwnerMap: any = {};
        for (let wildfileOwner of wildfileOwners) {
            const currOwnerAddress = wildfileOwner.ownerAddress.toLowerCase();
            wildFileOwnerMap[currOwnerAddress] = parseInt(
                wildfileOwner.tokenBalances[0].tokenId,
                16
            );
        }

        //Create csv rows
        let rows: string[] = [];
        for (let i = 0; i < totalEligibleUsers.length; i++) {
            //set the wallet addresses to lower case
            let eligibleUser: IUser = totalEligibleUsers[i];
            const currEligibleUserAddress =
                eligibleUser.walletProvider?.address?.toLowerCase();

            //configure and add user to info to csv
            let userWildFileId = wildFileOwnerMap[currEligibleUserAddress];
            if (!userWildFileId) {
                logInfo(
                    `Failed to fetch wildfile id for user ${eligibleUser.discordProvider?.discordTag} while generating helika report`
                );
                continue;
            }

            const username = escapeForCSV(
                eligibleUser.discordProvider?.discordTag
            );
            rows.push(
                `${userWildFileId},${username},${eligibleUser.discordProvider?.id}`
            );
        }

        rows = rows.sort((rowA, rowB) => {
            const wildfileIdA = Number(rowA.split(",")[0]);
            const wildfileIdB = Number(rowB.split(",")[0]);
            return wildfileIdA < wildfileIdB ? -1 : 1;
        });
        rows.unshift("Wildfile Id,Discord Name,Discord Id");

        const csv = rows.join("\n");
        fs.writeFileSync(fileName, csv, "utf-8");
        attachment = new AttachmentBuilder(`./${fileName}`);
    } catch (e) {
        const errMsg = `Error generating the Helika report ${e.message}`;
        logError(errMsg, e);
        await interaction.editReply({
            content: errMsg,
        });
        return;
    }
    const successMsg = `Successfully generated Helika report!`;
    console.log(successMsg);
    await interaction.editReply({
        content: successMsg,
        files: [attachment],
    });
    fs.rmSync(fileName);
}
