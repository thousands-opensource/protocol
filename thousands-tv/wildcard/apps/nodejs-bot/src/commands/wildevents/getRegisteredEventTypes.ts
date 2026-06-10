import { ChatInputCommandInteraction } from "discord.js";
import { logInfo } from "@src/logger";
import { WILDEVENT_REGISTRY_CONTRACT } from "@src/contracts/wildevents/WildeventRegistry";

/**
 * Command handler for /wildevents get-registered-event-types
 * @param interaction
 */
export async function handleGetRegisteredEventTypes(
    interaction: ChatInputCommandInteraction
) {
    await interaction.reply({
        content: "Retrieving registered Wildevent types...",
        ephemeral: true,
    });

    const userTag = interaction.user.tag;
    logInfo(`${userTag} is retrieving Wildevent types`);
    const eventTypes = await WILDEVENT_REGISTRY_CONTRACT.getWildeventTypes();
    if (!eventTypes || eventTypes.length === 0) {
        const msg = "There are no registered Wildevent types";
        logInfo(msg);
        await interaction.editReply(msg);
        return;
    }

    let registeredWildevents = "Registered Wildevents:";
    for (let i = 0; i < eventTypes.length; i += 1) {
        const eventType = eventTypes[i];
        const eventSchema =
            await WILDEVENT_REGISTRY_CONTRACT.getWildeventSchema(eventType);
        const events = await WILDEVENT_REGISTRY_CONTRACT.getWildevents(
            eventType
        );
        registeredWildevents += `
- Type: ***${eventType}***
- Schema: ***${eventSchema}***
- Event Count: ***${events.length}***
`;
    }

    logInfo(registeredWildevents);
    await interaction.editReply(registeredWildevents);
}
