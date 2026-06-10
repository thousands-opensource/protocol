import { WalletAddressToUserIdMap } from "@src/util/alchemyUtil";
import { logError } from "@src/logger";
import { ogAddresses } from "../ogAddresses";
import { OGBadgeId } from "../interface";
import { IBadge } from "@repo/interfaces";

/**
 * Process user fulfilled/met the specific badge requirements/conditions and give them a badge
 * @param badges - a list of og Badge objects
 * @param walletAddressToUserIdMap - a mapping of addresses to user ids
 */
export default function processOgBadgeType(
    badges: IBadge[],
    walletAddressToUserIdMap: WalletAddressToUserIdMap
) {
    for (const badge of badges) {
        const badgeId = badge.id;
        switch (badgeId) {
            case OGBadgeId.OG_MINTER:
                processOgMinter(badge, walletAddressToUserIdMap);
                return;
            default:
                logError(`Not processing the correct og badge type`);
                return;
        }
    }
}

/**
 * Process the og minter badge
 * @param badge - og minter badge object to update the list of user ids
 * @param walletAddressToUserIdMap - a mapping of addresses to user ids
 */
function processOgMinter(
    badge: IBadge,
    walletAddressToUserIdMap: WalletAddressToUserIdMap
) {
    let ogUserIdsSet = new Set<string>();
    for (const ogAddress of ogAddresses) {
        const candidateUserId = walletAddressToUserIdMap[ogAddress];
        ogUserIdsSet.add(candidateUserId);
    }
    //Turn set into array
    const ogWildfilesArr = Array.from(ogUserIdsSet);
    badge.userIds = ogWildfilesArr;
}
