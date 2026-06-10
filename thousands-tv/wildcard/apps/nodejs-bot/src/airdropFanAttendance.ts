import { GuildMember } from "discord.js";
import { logInfo } from "@src/logger";
import {
    AirdropFanAttendanceDoc,
    updateOneAirdropFanAttendanceDB,
} from "@repo/schemas";
import { AirdropEligibleUser } from "@repo/interfaces";

/**
 * Handles adding a fan into the airdrop fan attendance eligible users list
 * @param airdropFanAttendanceDoc - airdropFanAttendance doc to check and update
 * @param member - member to add
 */
export async function addUserToAirdropFanAttendanceEligibleUsers(
    airdropFanAttendanceDoc: AirdropFanAttendanceDoc,
    member: GuildMember
) {
    const discordId = member.user.id;
    const userTag = member.user.tag;

    // see if this user is already on the list of eligible users
    const aeuIds =
        airdropFanAttendanceDoc.airdropEligibleUsers?.map(
            (aeu) => aeu.discordId
        ) || [];
    const alreadyAdded = aeuIds.includes(discordId);

    if (alreadyAdded) {
        logInfo(`${userTag} is already on the list of airdrop eligible users.`);
        return;
    }

    // store this user's claim airdrop data
    const airdropFanAttendanceEligibleUser: AirdropEligibleUser = {
        discordTag: userTag,
        discordId,
        hasClaimed: false,
    };
    const updatedFanAttendanceAirdropDoc =
        await updateOneAirdropFanAttendanceDB(airdropFanAttendanceDoc._id, {
            $push: { airdropEligibleUsers: airdropFanAttendanceEligibleUser },
        });
    logInfo(
        `Successfully added ${userTag} to list of airdrop fan attendance eligible users. For fan attendance airdrop id: ${airdropFanAttendanceDoc._id}`
    );
    return updatedFanAttendanceAirdropDoc;
}
