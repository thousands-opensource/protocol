import { IUser } from "@repo/interfaces";
import {
    TokenBalance,
    BadgeTypeToTokenOwners,
    TokenOwnersForContract,
} from "../interface";
import { getWildpassColor, processWildpassBadge } from "./utils";
import { getTokenOwners } from "../util";
import { IBadge } from "@repo/interfaces";

/**
 * Process user fulfilled/met the specific badge requirements/conditions and give them a badge
 * @param badges - a list of wildpass Badge objects
 * @param user  - a User object
 * @param badgeTypeToTokenOwnerMap - a mapping of badge type to token owner mapping
 */
export default function processWildpassBadgeType(
    badges: IBadge[],
    user: IUser,
    badgeTypeToTokenOwnerMap: BadgeTypeToTokenOwners
) {
    for (const badge of badges) {
        const walletAddress = user.walletProvider?.address;
        if (!walletAddress) {
            return;
        }

        const { walletAddressToTokenMap }: TokenOwnersForContract =
            getTokenOwners(badgeTypeToTokenOwnerMap, badge.type);
        const wildpassTokens: TokenBalance[] =
            walletAddressToTokenMap[walletAddress];

        if (!wildpassTokens || wildpassTokens.length === 0) {
            return;
        }

        const wildpassColorSet = new Set<string>();
        for (const token of wildpassTokens) {
            const tokenId: number = parseInt(token.tokenId);
            const wildpassColor: string | null = getWildpassColor(tokenId);
            if (!wildpassColor) {
                continue;
            }

            wildpassColorSet.add(wildpassColor);
        }

        const result: boolean = processWildpassBadge(
            user,
            badge.id,
            wildpassColorSet
        );
        if (result && user.walletProvider?.wildfile?.initialWildfileId) {
            badge.userIds.push(user._id.toString());
        }
    }
}
