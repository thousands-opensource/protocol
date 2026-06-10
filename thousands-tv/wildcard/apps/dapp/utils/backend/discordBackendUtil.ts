import { connectToDiscord } from "@/discord/connectToDiscord";
import { getDiscordGuildId, getDiscordToken } from "../environmentUtil";
import { Collection, GuildMember, Role } from "discord.js";
import { DiscordRole } from "@repo/interfaces";

// fetch discord roles of a user by discord id within a guild
export async function getUserTopDiscordRoles(discordId: string): Promise<{
    success: boolean;
    errMsg: string;
    roles?: DiscordRole[];
}> {
    const discordClient = await connectToDiscord();
    if (!discordClient) {
        return {
            success: false,
            errMsg: "Unable to connect to discord client.",
        };
    }
    const guildId = getDiscordGuildId();

    if (!guildId) {
        return {
            success: false,
            errMsg: "Guild ID not set.",
        };
    }

    const guild = await discordClient.guilds.fetch(guildId);
    await guild.members.fetch();
    const member: GuildMember | undefined = guild.members.cache.get(discordId);

    if (!member) {
        return {
            success: false,
            errMsg: `Unable to find guild member with discordId ${discordId}`,
        };
    }
    // Assuming the `sortedRoles` variable is of type Collection<string, Role>
    const roles = member.roles.cache;
    const sortedRoles: Collection<string, Role> = roles.sort(
        (a, b) => b.position - a.position
    );
    // Extract rawPosition, color, name, discordId, and guildId properties from sortedRoles
    const extractedRoles: DiscordRole[] = sortedRoles.map((role) => ({
        name: role.name,
        discordId: role.id,
        guildId: role.guild.id,
        rawPosition: role.rawPosition,
        color: role.color,
        hexColor: role.hexColor,
        id: role.id,
    }));
    const NUM_OF_ROLES = 3; // Number of roles to select
    const totalRoles = extractedRoles.length; // Get the number of roles the user has

    // Select the top x number of roles as the user's top roles
    const topRoles: DiscordRole[] =
        extractedRoles.slice(0, Math.min(NUM_OF_ROLES, totalRoles)) || [];
    return {
        success: true,
        errMsg: "",
        roles: topRoles,
    };
}
