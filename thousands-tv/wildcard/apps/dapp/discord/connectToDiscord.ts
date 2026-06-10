import { getDiscordToken } from "@/utils/environmentUtil";
import { Client, GatewayIntentBits, Partials } from "discord.js";

/**
 * Discord client used to connect to discord
 */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

export const connectToDiscord = async () => {
    try {
        console.log("connecting to discord");
        if (!client.user) {
            console.log("discord client not found, logging in");
            await client.login(getDiscordToken());
            console.log("finished logging in to discord");
            return client;
        }
        return client;
    } catch (e) {
        console.error("Failed to establish connection to discord client", e);
    }
};
