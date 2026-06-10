import { IUser } from "@repo/interfaces";
import {
    BadgeIdToSwagSet,
    TokenOwnersForContract,
    BadgeTypeToTokenOwners,
} from "../interface";
import { getTotalSwagOwnedInSet } from "./utils";
import { getTokenOwners } from "../util";
import { IBadge } from "@repo/interfaces";

/**
 * Process user who has an active completed swag set and give them a badge
 * @param badges - list of swagset Badge objects
 * @param badgeIdToSwagSetsMap - a mapping of badgeId:SwagSet objects
 * @param user - a User object
 * @param badgeTypeToTokenOwnerMap - a mapping of badge type to token owner mapping
 */
export default function processSwagSetBadgeType(
    badges: IBadge[],
    badgeIdToSwagSetsMap: BadgeIdToSwagSet,
    user: IUser,
    badgeTypeToTokenOwnerMap: BadgeTypeToTokenOwners
) {
    for (const badge of badges) {
        const badgeId = badge.id;
        const swagSet = badgeIdToSwagSetsMap[badgeId];
        if (!swagSet) {
            return;
        }

        const { walletAddressToTokenMap }: TokenOwnersForContract =
            getTokenOwners(badgeTypeToTokenOwnerMap, badge.type);

        const nftTokenIds = swagSet.tokenIds;
        const walletAddress = user.walletProvider?.address;
        if (
            !walletAddress ||
            !walletAddressToTokenMap[walletAddress] ||
            walletAddressToTokenMap[walletAddress].length === 0
        ) {
            return;
        }

        const totalOwned: number = getTotalSwagOwnedInSet(
            swagSet,
            walletAddressToTokenMap[walletAddress]
        );
        const completedSet = totalOwned === nftTokenIds.length;
        if (completedSet && user.walletProvider?.wildfile?.initialWildfileId) {
            badge.userIds.push(user._id.toString());
        }
    }
}
