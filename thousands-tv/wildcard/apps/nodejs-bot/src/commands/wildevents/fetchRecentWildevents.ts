import { ChatInputCommandInteraction } from "discord.js";
import { logInfo } from "@src/logger";
import { WILDEVENT_REGISTRY_CONTRACT } from "@src/contracts/wildevents/WildeventRegistry";
import { Wildevent } from "@src/types";
import { NUM_WILDEVENTS, WILDEVENT_TYPE } from "@src/constants";
import { decodeLinkedSocialWildevents } from "@src/util/wildevents/linkedSocialUtil";
import { decodeArchivedLeaderboardWildevents } from "@src/util/wildevents/archivedLeaderboardUtil";
import { ARCHIVED_LEADERBOARD, LINKED_SOCIAL } from "@repo/interfaces";

/**
 * Command handler for /wildevents fetch-recent-wildevents
 * @param interaction
 */
export async function handleFetchRecentWildevents(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Fetching recent Wildevents...",
        ephemeral: true,
    });

    const wildeventType = interaction.options.getString(WILDEVENT_TYPE);
    let numWildeventsToFetch = interaction.options.getNumber(NUM_WILDEVENTS);

    const userTag = interaction.user.tag;

    logInfo(
        `${userTag} is fetching ${numWildeventsToFetch} recent Wildevents of type '${wildeventType}'`
    );

    // make sure user entered a valid number
    if (numWildeventsToFetch < 1 || Number.isNaN(numWildeventsToFetch)) {
        const errMsg = `***${numWildeventsToFetch}*** is not a valid number. Please enter a positive number`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // make sure the Wildevent type is registered
    const isRegistered =
        await WILDEVENT_REGISTRY_CONTRACT.isWildeventTypeRegistered(
            wildeventType
        );
    if (!isRegistered) {
        const allWildeventTypes =
            await WILDEVENT_REGISTRY_CONTRACT.getWildeventTypes();
        const allWildeventTypesStr = allWildeventTypes
            .map((wildeventType: string) => `***${wildeventType}***`)
            .join(", ");
        const msg = `***${wildeventType}*** is not a registered Wildevent type. The registered Wildevent types are:\n\t- ${allWildeventTypesStr}`;
        logInfo(msg);
        await interaction.editReply(msg);
        return;
    }

    // fetch the number Wildevents
    const totalWildevents = await WILDEVENT_REGISTRY_CONTRACT.getNumWildevents(
        wildeventType
    );
    if (totalWildevents === 0) {
        const errMsg = `There are no ***${wildeventType}*** Wildevents`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // if trying to fetch more than there are, just fetch all of them
    if (numWildeventsToFetch > totalWildevents) {
        numWildeventsToFetch = totalWildevents;
    }

    // fetch the Wildevents
    const endIndex = totalWildevents - 1;
    const startIndex = totalWildevents - numWildeventsToFetch;
    const wildevents: Wildevent[] =
        await WILDEVENT_REGISTRY_CONTRACT.getWildeventsBatch(
            wildeventType,
            startIndex,
            endIndex
        );

    let msg = `***${numWildeventsToFetch}*** most recent ***${wildeventType}*** Wildevents:\n`;
    switch (wildeventType) {
        case LINKED_SOCIAL:
            msg += await decodeLinkedSocialWildevents(wildevents);
            break;
        case ARCHIVED_LEADERBOARD:
            msg += await decodeArchivedLeaderboardWildevents(wildevents);
            break;
        default:
            msg += `Unknown Wildevent type ***${wildeventType}***`;
            break;
    }

    logInfo(msg);
    await interaction.editReply(msg);
}
