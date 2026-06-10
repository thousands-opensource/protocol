import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
} from "discord.js";
import { escapeForCSV } from "@src/util/util";
import {
    DISCORD_IDS_INPUT_FIELD,
    GET_WILDFILE_IDS_FROM_DISCORD_IDS_MODAL_ID,
} from "../../constants";
import { addModalFieldParagraph } from "@src/util/modalUtil";
import fs from "fs";
import { findUsersByQuery } from "@repo/schemas";

/**
 * Command handler for creating modal to get discord ids /get-wildfile-ids-from-discord-ids
 * @param interaction
 */
export async function getWildfileIdsFromDiscordIdsModal(
    interaction: ChatInputCommandInteraction
) {
    let mb = new ModalBuilder()
        .setCustomId(GET_WILDFILE_IDS_FROM_DISCORD_IDS_MODAL_ID)
        .setTitle("Get Wildfile Ids From Discord Ids");
    addModalFieldParagraph(
        mb,
        DISCORD_IDS_INPUT_FIELD,
        "Input Discord Ids to Get Wildfile Ids",
        true,
        4000,
        1,
        "Enter your discord ids here - comma separated"
    );

    await interaction.showModal(mb);
}

/**
 * Build the csv to return for community team to see, which wildfile id is associated with each user
 * NOTE: THIS MUST BE REVISED IN THE CASE WILDFILES BECOME TRANSFERRABLE - DO NOT USE INITIALWILDFILEID PARAM
 * @param interaction - modal submit interaction
 */
export async function getWildfileIdsFromDiscordIdsCsv(
    interaction: ModalSubmitInteraction
) {
    await interaction.reply({
        content: "Gathering your wildfile ids csv...",
        ephemeral: true,
    });

    //get discord list and make sure to trim whitespace
    const discordListInput = interaction.fields.getTextInputValue(
        DISCORD_IDS_INPUT_FIELD
    );
    let discordIdList = discordListInput.split(",");
    for (let i = 0; i < discordIdList.length; i++) {
        discordIdList[i] = discordIdList[i].trim();
    }
    console.log("discordIdList", discordIdList);

    //Query the users in the discord list
    const query = { "discordProvider.id": { $in: discordIdList } };
    const users = await findUsersByQuery(query);
    console.log("users", users.length);

    //With our users now we format our rows - make sure each input user was found
    let rows: string[] = [];
    for (let discordId of discordIdList) {
        const user = users.find(
            (user) => user.discordProvider?.id === discordId
        );
        if (!user) {
            rows.push(
                `discordId: ${discordId} not associated with a user,${""},${""}`
            );
            continue;
        }
        const userWildFileId = user.walletProvider?.initialWildfileId || -1;
        discordId = escapeForCSV(user.discordProvider?.id || "");
        const discordTag = escapeForCSV(user.discordProvider?.discordTag || "");
        rows.push(`${discordId},${discordTag},${userWildFileId}`);
    }

    rows.unshift("Discord Id,Discord Tag,Wildfile Id");

    const formattedDate = new Date().toLocaleDateString().replace(/\//g, "-");
    const fileName = `wildfile-ids-${formattedDate}.csv`;
    const csv = rows.join("\n");
    fs.writeFileSync(fileName, csv, "utf-8");
    const attachment = new AttachmentBuilder(`./${fileName}`);

    const successMsg = `Successfully generated wildfile ids csv!`;
    console.log(successMsg);

    await interaction.editReply({
        content: successMsg,
        files: [attachment],
    });
    fs.rmSync(fileName);
}
