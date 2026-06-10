import { Collection, GuildMember, PartialGuildMember, Role } from "discord.js";
import {
    addUserToAirdrop,
    notifyIfEligibleUsersExceedsBotTokens,
} from "../airdrop";
import { getGuild } from "./discordUtil";
import { logError, logInfo } from "@src/logger";
import { findAirdropsByQuery } from "@repo/schemas";

export function isAirdropAdmin(member: GuildMember): boolean {
    return hasRole(member, process.env.AIRDROP_ADMIN_ROLE_ID);
}

export async function getAirdropAdminRole(): Promise<Role> {
    return await getRole(process.env.AIRDROP_ADMIN_ROLE_ID);
}

export function hasRole(member: GuildMember, roleId: string): boolean {
    return member.roles.cache.has(roleId);
}

export async function roleExists(roleId: string): Promise<boolean> {
    const role: Role = await getRole(roleId);
    if (role) {
        return true;
    }

    return false;
}

export async function getRole(roleId: string): Promise<Role> {
    const guild = await getGuild();
    // this automatically checks the role cache
    return await guild.roles.fetch(roleId);
}

/**
 * Returns a collection of the guild members who have the given role
 * @param roleId role to check
 * @returns collection of guild members with the given role
 */
export async function getMembersWithRole(
    roleId: string
): Promise<Collection<string, GuildMember>> {
    const startTime = Date.now();
    try {
        const guild = await getGuild();
        // find all members with the given role
        const role = guild.roles.cache.get(roleId);
        if (!role) {
            logInfo(`No role found for role id: ${roleId}`);
            return new Collection<string, GuildMember>();
        }
        return role.members;
    } catch (e) {
        const timeElapsed = Date.now() - startTime;
        logError(
            `Unable to get members with roleId: ${roleId} after ${timeElapsed}ms`,
            e
        );
        return new Collection<string, GuildMember>();
    }
}

/**
 * Return the guild member by discordId
 * @param guildId - id of guild to fetch member from
 * @param discordId - id of member to fetch
 * @returns - guild member
 */
export async function getMember(
    discordId: string
): Promise<GuildMember | null> {
    try {
        const guild = await getGuild();
        let member = guild.members.cache.get(discordId);
        if (!member) {
            member = await guild.members.fetch(discordId);
        }
        return member;
    } catch (error) {
        logError(`Failed to fetch member: ${discordId}`, error);
        return null;
    }
}

/**
 * Called when a user has been updated in the guild (like when a role is added or removed)
 * @param oldMember - member object before the update (previous member version)
 * @param newMember - member object after the update (current member version)
 */
export async function handleRoleChange(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
) {
    const userTag = newMember.user.tag;
    logInfo(
        `Detected guild member update for user ${userTag}, checking if an airdrop-eligible role was added`
    );

    const prevRoles = oldMember.roles.cache;
    const currRoles = newMember.roles.cache;
    // if previous roles size was less than current, a role was added
    const wasRoleAdded = prevRoles.size < currRoles.size;
    if (!wasRoleAdded) {
        logInfo(
            `No airdrop necessary for user ${userTag}, a role was not added`
        );
        return;
    }

    // find which role was added, and perform airdrop if necessary
    currRoles.forEach(async (role) => {
        if (!prevRoles.has(role.id)) {
            const roleId = role.id;
            const roleName = role.name;
            logInfo(
                `Handling role '${roleName}' (id: ${roleId}) added to user ${userTag}`
            );

            // see if there are  active airdrops for this role
            const airdropDocs = await findAirdropsByQuery({
                active: true,
                roleRequiredId: roleId,
            });
            if (airdropDocs.length === 0) {
                logInfo(`No active airdrops associated with role ${roleName}`);
                return;
            }
            for (const airdropDoc of airdropDocs) {
                await addUserToAirdrop(newMember, airdropDoc);
                // check if we've reached limit for available tokens to claim
                await notifyIfEligibleUsersExceedsBotTokens(airdropDoc);
            }
        }
    });
}
