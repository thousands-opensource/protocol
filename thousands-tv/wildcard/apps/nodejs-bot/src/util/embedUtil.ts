import { DEFAULT_EMBED_IMAGE_URL } from "@src/constants";
import { AirdropDoc } from "@repo/schemas";
import { logInfo } from "@src/logger";
import {
    DISCORD_MAX_STRING_LENGTH,
    editMessage,
    formatDateDiscord,
    getBroadcastMessage,
} from "@src/util/discordUtil";
import { getMembersWithRole, getRole } from "@src/util/roleUtil";
import { Embed, EmbedBuilder } from "discord.js";
import { getDiscordGuildId } from "./environmentUtil";
import {
    IAirdrop,
    IAirdropFanAttendance,
    IDiscordEvent,
} from "@repo/interfaces";

const ELIGIBLE = "Eligible";
const CLAIMED = "Claimed";
export const STATUS = "Status";
export const CONCLUDES = "Concludes";

/**
 * Builds the embed for an airdrop including fetching embed stats e.g. eligible and claimed
 * @param airdrop - airdrop document
 * @param removedRoleName - string to use in case a role can't be found because it was deleted
 * @returns - airdrop embed builder
 */
export async function buildAirdropEmbed(
    airdropDoc: IAirdrop,
    removedRoleName?: string
): Promise<EmbedBuilder> {
    // see what the current eligible/claimed numbers should be
    const numEligible = airdropDoc.airdropEligibleUsers.length;
    // check how many people have claimed this airdrop
    const hasClaimedArr = airdropDoc.airdropEligibleUsers?.filter(
        (aeu) => aeu.hasClaimed
    );
    const numClaimed = hasClaimedArr.length;
    return await buildAirdropEmbedWithStats(
        airdropDoc,
        numEligible,
        numClaimed,
        removedRoleName
    );
}

/**
 * Builds the embed for an airdrop
 * @param airdrop - airdrop document
 * @param numEligible - number of users who are eligible for this airdrop (who have the required role)
 * @param numClaimed - number of users who have claimed this airdrop so far
 * @param removedRoleName - string to use in case a role can't be found because it was deleted
 * @returns
 */
export async function buildAirdropEmbedWithStats(
    airdrop: IAirdrop,
    numEligible: number,
    numClaimed: number,
    removedRoleName?: string
): Promise<EmbedBuilder> {
    const roleRequired = await getRole(airdrop.roleRequiredId);
    let roleString;
    if (roleRequired) {
        roleString = roleRequired.toString();
    } else if (removedRoleName) {
        roleString = `***${removedRoleName}***`;
    } else {
        roleString = `@deleted-role`;
    }
    const airdropEmbed = new EmbedBuilder()
        .setThumbnail(airdrop.tokenMetadata.image || DEFAULT_EMBED_IMAGE_URL)
        .setTitle(`Airdrop Alert!`)
        .addFields({
            name: "Role required",
            value: roleString,
            inline: true,
        })
        .addFields({
            name: "Reward Swag",
            value: `***${airdrop.tokenMetadata.name || airdrop.tokenId}***`,
            inline: true,
        })
        .addFields({
            name: "Swag Token ID",
            value: airdrop.tokenId,
            inline: false,
        })
        .addFields({
            name: STATUS,
            value: airdrop.active ? "Active" : "Concluded",
            inline: true,
        })
        .addFields({
            name: ELIGIBLE,
            value: `${numEligible}`,
            inline: true,
        })
        .addFields({
            name: CLAIMED,
            value: `${numClaimed}`,
            inline: true,
        })
        .setTimestamp();

    // show the airdrop conlude date if the airdrop is still active
    if (airdrop.active && airdrop.concludesAt) {
        const concludesAtFormatted = formatDateDiscord(airdrop.concludesAt);
        airdropEmbed.addFields({
            name: CONCLUDES,
            value: concludesAtFormatted,
            inline: false,
        });
    }

    return airdropEmbed;
}

/**
 * Build new in game live event airdropFanAttendance embed
 * @param airdropFanAttendance - airdropFanAttendance document
 * @param discordEvent - discord event document
 * @returns - airdropFanAttendance message embed builder
 */
export async function buildAirdropEmbedWithStatsFanVis(
    airdropFanAttendance: IAirdropFanAttendance,
    discordEventCreated: IDiscordEvent
): Promise<EmbedBuilder> {
    const guildId = await getDiscordGuildId();
    const channelId = discordEventCreated.channelId;
    const eventUrl = `https://discord.com/channels/${guildId}/${channelId}`;

    const airdropFanAttendanceEmbed = new EmbedBuilder()
        .setThumbnail(
            airdropFanAttendance.tokenMetadata.image || DEFAULT_EMBED_IMAGE_URL
        )
        .setTitle(`In Game Airdrop Live Event 🎉`)
        .addFields({
            name: "Event Name",
            value: discordEventCreated.name,
            inline: false,
        })
        .addFields({
            name: "Game Reward Swag",
            value: `***${
                airdropFanAttendance.tokenMetadata.name ||
                airdropFanAttendance.tokenId
            }***`,
            inline: true,
        })
        .addFields({
            name: "Event Time",
            value: formatDateDiscord(discordEventCreated.scheduledStartTime),
            inline: false,
        })
        .addFields({
            name: "View Event",
            value: `[Click Here](${eventUrl})`,
            inline: false,
        })

        .setTimestamp();

    return airdropFanAttendanceEmbed;
}

/**
 * Builds an eventCreation embed to send to the creator of the in game airdrop
 * @param discordEvent - discord event document
 * @returns - eventCreation message embed builder
 */
export async function buildFanVisEmbedEventCreation(
    discordEvent: IDiscordEvent
): Promise<EmbedBuilder> {
    const guildId = await getDiscordGuildId();
    const channelId = discordEvent.channelId;

    const eventUrl = `https://discord.com/channels/${guildId}/${channelId}`;

    const fanVisEmbed = new EmbedBuilder()
        .setTitle(`New Live Event Scheduled`)
        .addFields({
            name: "Event Name",
            value: discordEvent.name,
            inline: false,
        })
        .addFields({
            name: "Session Code",
            value: discordEvent.sessionCode,
            inline: true,
        })
        .addFields({
            name: "Event Time",
            value: formatDateDiscord(discordEvent.scheduledStartTime),
            inline: false,
        })
        .addFields({
            name: "View Event",
            value: `[Click Here](${eventUrl})`,
            inline: false,
        })

        .setTimestamp();

    return fanVisEmbed;
}

/**
 * Updates the embed for the given airdrop
 * @param airdropDoc - airdrop doc whose embed to update
 */
export async function updateAirdropEmbed(airdropDoc: AirdropDoc) {
    const broadcastMessageId = airdropDoc.broadcastMessageId;
    const airdropMsg = await getBroadcastMessage(
        airdropDoc.broadcastChannelId,
        airdropDoc.broadcastMessageId
    );
    if (!airdropMsg) {
        logInfo(
            `Failed to update airdrop embed for active airdrop ${airdropDoc._id}, broadcast message not found ${broadcastMessageId}`
        );
        return;
    }

    if (!airdropMsg.embeds || airdropMsg.embeds.length < 1) {
        logInfo(
            `Failed to update airdrop embed for active airdrop ${airdropDoc._id}, embed in broadcast message not found ${broadcastMessageId}`
        );
        return;
    }

    const oldContent = airdropMsg.content;
    const oldComponents = airdropMsg.components;
    const oldEmbedFields = airdropMsg.embeds[0].fields;
    // see what the previous eligible/claimed numbers are in the embed (they are actually stored as strings)
    let prevNumEligible = "";
    let prevNumClaimed = "";
    for (const field of oldEmbedFields) {
        if (field.name === ELIGIBLE) {
            prevNumEligible = field.value;
        } else if (field.name === CLAIMED) {
            prevNumClaimed = field.value;
        }
    }

    // see what the current eligible/claimed numbers should be
    const eligibleMembers = await getMembersWithRole(airdropDoc.roleRequiredId);
    const numEligible = eligibleMembers.size;
    // check how many people have claimed this airdrop
    const hasClaimedArr = airdropDoc.airdropEligibleUsers?.filter(
        (aeu) => aeu.hasClaimed
    );

    // numClaimed can only get larger (this handles scenario/race condtion where getMembersWithRole returns 0 members because a role was deleted)
    const numClaimed =
        hasClaimedArr.length > Number(prevNumClaimed)
            ? hasClaimedArr.length
            : Number(prevNumClaimed);

    // if the counts haven't changed, no need to update the embed (they are stored as strings in the embed)
    if (
        prevNumEligible === `${numEligible}` &&
        prevNumClaimed === `${numClaimed}`
    ) {
        return;
    }

    const embed = await buildAirdropEmbedWithStats(
        airdropDoc,
        numEligible,
        numClaimed
    );
    const forceFetch = true;
    await editMessage(
        airdropMsg,
        {
            content: oldContent,
            components: oldComponents,
            embeds: [embed],
        },
        forceFetch
    );
}

/**
 * Updates a field on an embed and returns the updated embed, if field doesn't exist returns the unchanged embed
 * @param airdrop - airdrop with broadcast message to get embed from
 * @param fieldsToUpdate - object containing keys of embed field names to update and whose values are the values to update the field value to, i.e. {["Status"]: "active", ["Role required"]: "test"}
 * @returns - airdrop embed
 */
export async function updateAirdropEmbedFields(
    airdropDoc: AirdropDoc,
    fieldsToUpdate: { [key: string]: string }
): Promise<Embed> {
    const broadcastMessageId = airdropDoc.broadcastMessageId;
    const airdropMsg = await getBroadcastMessage(
        airdropDoc.broadcastChannelId,
        airdropDoc.broadcastMessageId
    );
    if (!airdropMsg) {
        logInfo(
            `Failed to update airdrop embed for airdrop ${airdropDoc._id}, broadcast message not found ${broadcastMessageId}`
        );
        return;
    }

    if (!airdropMsg.embeds || airdropMsg.embeds.length < 1) {
        logInfo(
            `Failed to update airdrop embed for airdrop ${airdropDoc._id}, embed in broadcast message not found ${broadcastMessageId}`
        );
        return;
    }
    const embed = airdropMsg.embeds[0];
    for (const field of embed.fields) {
        // check if field name is a key in our object of fields to update
        if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, field.name)) {
            field.value = fieldsToUpdate[field.name];
        }
    }
    return embed;
}

export type EmbedFieldArrayType = string[][];

/**
 * Partitions data ensuring no field in any sub-array exceeds the specified length limit for discord
 * Maintains the order and index-wise correspondence of data across lists
 * @param embedFieldArray An array of arrays, where each sub-array holds data that corresponds index-wise across lists.
 * @returns An array of arrays, each sub-array representing a partition that respects the specified limit.
 */
export function partitionEmbedFieldData(
    embedFieldArray: EmbedFieldArrayType
): EmbedFieldArrayType[] {
    // If the embed field arrays differ in size, throw an error
    const embedArrayLength = embedFieldArray[0].length;
    if (
        embedFieldArray.some(
            (fieldArray) => fieldArray.length !== embedArrayLength
        )
    ) {
        throw new Error(
            "All field arrays must have the same length to partition data"
        );
    }

    const partitionedData: EmbedFieldArrayType[] = [];
    let currentFieldPartitions: EmbedFieldArrayType = embedFieldArray.map(
        (): string[] => []
    ); // An array of arrays, each sub-array representing a partition that respects the specified limit
    let currentLengths: number[] = embedFieldArray.map(() => 0);

    for (let i = 0; i < embedArrayLength; i++) {
        const newItemLengths = embedFieldArray.map(
            (fieldArray, _) => fieldArray[i].length + 2 // Adding 2 for comma and space
        );

        const exceedLimit = newItemLengths.some(
            (length, idx) =>
                currentLengths[idx] + length > DISCORD_MAX_STRING_LENGTH
        );

        if (exceedLimit) {
            // Push current partitions and reset if adding the current item would exceed the limit
            partitionedData.push(currentFieldPartitions);
            // Start new partition arrays
            currentFieldPartitions = embedFieldArray.map((list) => [list[i]]);
            // Reset lengths count
            currentLengths = newItemLengths;
        } else {
            // Add current items to partitions
            embedFieldArray.forEach((list, idx) => {
                currentFieldPartitions[idx].push(list[i]);
                currentLengths[idx] += newItemLengths[idx];
            });
        }
    }

    // Add the last partition
    if (currentFieldPartitions[0].length > 0) {
        partitionedData.push(currentFieldPartitions);
    }

    return partitionedData;
}
