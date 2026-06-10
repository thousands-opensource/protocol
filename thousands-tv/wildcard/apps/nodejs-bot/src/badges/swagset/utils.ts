import { findSwagSetsByQuery } from "@repo/schemas";
import { BadgeIdToSwagSet, TokenBalance } from "../interface";
import { IBadge, ISwagSet } from "@repo/interfaces";

/**
 * Build badge id to swag set mapping
 * @param badges - an array of Badge object
 * @param badgeIdToSwagSetsMap - an empty mapping of badgeId:SwagSet object
 */
export async function buildBadgeIdToSwagSetHm(
    badges: IBadge[],
    badgeIdToSwagSetsMap: BadgeIdToSwagSet
): Promise<void> {
    const swagSets: ISwagSet[] = await findSwagSetsByQuery({});
    for (const badge of badges) {
        const badgeId = badge.id;
        const swagSetTitle = badge.swagSetTitle;
        if (!swagSetTitle) {
            continue;
        }

        const swagSet: ISwagSet = swagSets.find((swagSet) => {
            return swagSet.title.toLowerCase() === swagSetTitle.toLowerCase();
        });
        if (!swagSet) {
            continue;
        }

        if (!badgeIdToSwagSetsMap[badgeId]) {
            badgeIdToSwagSetsMap[badgeId] = swagSet;
        }
    }
}

/**
 * Get total swag owned in a swag set
 * @param swagSet - a SwagSet object
 * @param swagTokens - an array of TokenBalance object
 * @returns total owned swags in swag set
 */
export function getTotalSwagOwnedInSet(
    swagSet: ISwagSet,
    swagTokens: TokenBalance[]
): number {
    let total = 0;
    for (const tokenId of swagSet.tokenIds) {
        // TODO: Can be improved with hashmap lookup instead of arry search e.g. walletAddrToTokenMap[addr][tokenId]
        const hasSwagToken = swagTokens.some(
            (swagToken) => swagToken.tokenId === tokenId
        );
        if (hasSwagToken) {
            total += 1;
        }
    }
    return total;
}
