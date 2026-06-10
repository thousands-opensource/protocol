import { bulkUpdateManyBadge } from "@repo/schemas";
import { IUser, IBadge } from "@repo/interfaces";
import {
    getWildcardSwagContractAddress,
    getWildpassContractAddress,
} from "@src/util/environmentUtil";
import processSwagSetBadgeType from "./swagset/processSwagSetBadgeType";
import {
    getCommunityBadgeMetaInfo,
    getOGBadgeMetaInfo,
    getSwagSetBadgeMetaInfo,
    getWildpassBadgeMetaInfo,
} from "./badgeMeta";
import {
    BadgeIdToSwagSet,
    BadgeType,
    BadgeTypeToTokenOwners,
} from "./interface";
import {
    buildAddressToTokensOwnedHm,
    getAllUsers,
    consolidateTokensMap,
    getTokenOwners,
} from "./util";
import { logError, logInfo } from "@src/logger";
import { buildBadgeIdToSwagSetHm } from "./swagset/utils";
import processWildpassBadgeType from "./wildpass/processWildpassBadgeType";
import processCommunityBadgeType from "./community/processCommunityBadgeType";
import { WalletAddressToUserIdMap } from "@src/util/alchemyUtil";
import processOgBadgeType from "./og/processOgBadgeType";
import { ogAddresses } from "./ogAddresses";
import { getAllAssociatedWalletsForUser } from "@src/util/util";
import { getAddress } from "ethers/lib/utils";

// ***************** DB Write Ops ***************** //
/**
 * Bulk write an array of badge into db
 * @param badges - list of badge meta info
 */
async function bulkUpdateBadges(badges: IBadge[]): Promise<void> {
    try {
        const bulkWriteOps = [];
        for (const badge of badges) {
            const filter = { id: badge.id };
            const update = badge;
            bulkWriteOps.push({
                updateOne: {
                    filter,
                    update,
                    upsert: true,
                },
            });
        }

        const result = await bulkUpdateManyBadge(bulkWriteOps);
        logInfo(
            `Bulk update result: ${result.modifiedCount} documents modified and ${result.upsertedCount} documents upserted`
        );
    } catch (e) {
        logError(`Error during bulk update: ${e.message}`);
        return;
    }
}

export async function populateBadges() {
    logInfo(`Populating badges at ${Date()}...`);

    const swagBadges: IBadge[] = getSwagSetBadgeMetaInfo();
    const wildpassBadges: IBadge[] = getWildpassBadgeMetaInfo();
    const communityBadges: IBadge[] = getCommunityBadgeMetaInfo();
    const ogBadges: IBadge[] = getOGBadgeMetaInfo();
    // Badge Id to Swag Set Map (used for token ids comparison)
    const badgeIdToSwagSetsMap: BadgeIdToSwagSet = {};
    // Every candidate wallet address that needs to be looked up must be added here
    const allWalletAddressesSetToLookup = new Set<string>();
    //Start by adding all og addresses, they will all need to be looked up in user db
    ogAddresses.forEach((item) =>
        allWalletAddressesSetToLookup.add(getAddress(item))
    );

    try {
        // Build hash map for data preprocessing lookup
        // Build badgeid to swag set mapping
        await buildBadgeIdToSwagSetHm(swagBadges, badgeIdToSwagSetsMap);
        logInfo(
            `Successfully built total of ${
                Object.keys(badgeIdToSwagSetsMap).length
            } swagsets for lookup `
        );

        const wildcardSwagAddress: string = getWildcardSwagContractAddress();
        const wildpassAddress: string = getWildpassContractAddress();
        const badgeTypeToTokenOwnerMap: BadgeTypeToTokenOwners = {
            [BadgeType.SWAGSET]: {
                contractAddress: wildcardSwagAddress,
                // Swag Owner Map (does not imply they have a wildfile)
                walletAddressToTokenMap: {},
            },
            [BadgeType.WILDPASS]: {
                contractAddress: wildpassAddress,
                // Wildpass Owner Map (does not imply they have a wildfile)
                walletAddressToTokenMap: {},
            },
        };

        // Build different type of hashmap fo address to token
        for (const badgeType of Object.keys(badgeTypeToTokenOwnerMap)) {
            const { walletAddressToTokenMap, contractAddress } = getTokenOwners(
                badgeTypeToTokenOwnerMap,
                badgeType
            );
            await buildAddressToTokensOwnedHm(
                allWalletAddressesSetToLookup,
                walletAddressToTokenMap,
                contractAddress
            );
        }

        // Get all users than are involved
        const allUsers: IUser[] = await getAllUsers(
            allWalletAddressesSetToLookup
        );
        logInfo(
            `Loaded ${allUsers.length} user documents into memory to process badges`
        );

        // Consolidate the mappings so that all the addresses a user owns are combined
        for (const badgeType of Object.keys(badgeTypeToTokenOwnerMap)) {
            const { walletAddressToTokenMap } = getTokenOwners(
                badgeTypeToTokenOwnerMap,
                badgeType
            );
            badgeTypeToTokenOwnerMap[badgeType].walletAddressToTokenMap =
                consolidateTokensMap(allUsers, walletAddressToTokenMap);
        }

        const walletAddressToUserIdMap: WalletAddressToUserIdMap = {};
        // Process all swag and wildpass badges for all users
        for (const user of allUsers) {
            addAllAssociatedWalletsToUserIdMap(user, walletAddressToUserIdMap);
            processSwagSetBadgeType(
                swagBadges,
                badgeIdToSwagSetsMap,
                user,
                badgeTypeToTokenOwnerMap
            );
            processWildpassBadgeType(
                wildpassBadges,
                user,
                badgeTypeToTokenOwnerMap
            );
        }
        //Process the community badges - we already have wildfiles so no need to query users
        await processCommunityBadgeType(communityBadges);
        //Process the og minters - this is done outside the process wildpasses so we dont have to loop through ogAddresses for every user
        processOgBadgeType(ogBadges, walletAddressToUserIdMap);

        // Bulk update badges to db
        const allBadges = [
            ...swagBadges,
            ...wildpassBadges,
            ...communityBadges,
            ...ogBadges,
        ];
        await bulkUpdateBadges(allBadges);
    } catch (e) {
        logError(`Error populating badge: ${e.message}`);
        return;
    }

    logInfo(`Finish populating badges at ${Date()}`);
}

/**
 * Update map to add all user addresses to point to wildfile associated
 * @param user - user objects whose wallets we want to add as keys to the map
 * @param walletAddressToWildfileMap - a mapping of addresses to wildfiles
 */
function addAllAssociatedWalletsToUserIdMap(
    user: IUser,
    walletAddressToWildfileMap: WalletAddressToUserIdMap
) {
    const allUserAddresses = getAllAssociatedWalletsForUser(user);
    for (const address of allUserAddresses) {
        if (user.walletProvider?.wildfile?.initialWildfileId) {
            walletAddressToWildfileMap[address] = user._id.toString();
        }
    }
}
