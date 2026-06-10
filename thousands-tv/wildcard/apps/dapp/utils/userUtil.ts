import { emptyPfp } from "@/constants/constants";
import {
    AccountProvider,
    ClaimedSwagSet,
    GasBudgetTxnType,
    ISwagSet,
    IUser,
    PfpMetadata,
    PostedWildevent,
} from "@repo/interfaces";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import { OwnedNft } from "alchemy-sdk";
import { getActivePfpUrl } from "@repo/utils";

/**
 * See if user has address in "additionalWallets"
 * @param address - address to check
 * @param user - user object from mongo
 * @returns true if address is in "additionalWallets" of user object
 */
export function isAdditionalWallet(address: string, user: IUser): boolean {
    if (!user?.walletProvider?.additionalWallets) {
        return false;
    }
    return user?.walletProvider?.additionalWallets?.indexOf(address) >= 0;
}

/**
 * See if user has address in "walletAddress" or "additionalWallets"
 * @param address - address to check
 * @param user - user object from mongo
 * @returns true if address is associated to user object
 */
export function isAssociatedWallet(
    address: string,
    user: IUser | null
): boolean {
    if (!user?.walletProvider) {
        return false;
    }
    return (
        address === user?.walletProvider?.address ||
        isAdditionalWallet(address, user)
    );
}

/**
 * Create a query to find a user with an address in "walletAddress" or "additionalWallets"
 * under the new walletProvider structure.
 * @param address - address for query
 * @returns a query for MongoDB to look up a user
 */
export function queryForAssociatedWallets(
    address: string | undefined | string[]
) {
    if (!address) return {}; // If no address is provided, return an empty query

    return {
        $or: [
            { "walletProvider.address": address },
            {
                "walletProvider.additionalWallets": {
                    $in: Array.isArray(address) ? address : [address],
                },
            },
        ],
    };
}

/**
 * Get all wallet addresses we have associated with user
 * @param user - user from mongo
 * @returns a list of wallet addresses as strings
 */
export function getAllAssociatedWalletsForUser(user: IUser): string[] {
    let associatedAddresses = user?.walletProvider?.additionalWallets
        ? [...user?.walletProvider?.additionalWallets] // <-- use a spread operator so that associatedAddresses is only a COPY of user.additional wallets and doesn't mutate the actual user?.wallet?.additionalWallets
        : [];
    associatedAddresses.unshift(user?.walletProvider?.address!);
    return associatedAddresses;
}

/**
 * Checks if page user owner
 * @param logged
 * @param address
 * @param pageOwnerUser
 * @returns true if page user owner
 */
export function checkPageOwnerUser(
    loggedIn: boolean | undefined,
    address: `0x${string}` | undefined,
    pageOwnerUser: IUser
) {
    const isOwner =
        loggedIn &&
        Boolean(address && isAssociatedWallet(address, pageOwnerUser));

    return isOwner;
}

/**
 * Formats gas expenditure type to human readable string
 * @param gasExpenditureType - gas expenditure type tp reformat
 * @returns string
 */
export function formatGasExpenditureName(
    gasExpenditureType: GasBudgetTxnType
): string {
    if (gasExpenditureType === "linkedWallet") {
        return "Linked An Additional Wallet";
    } else if (gasExpenditureType === "unlinkedWallet") {
        return "Removed A Linked Wallet";
    } else if (gasExpenditureType === "setPfp") {
        return "Updated Profile Picture";
    } else if (gasExpenditureType === "completedSwagSet") {
        return "Completed Swag Set";
    }
    return gasExpenditureType;
}

/**
 * Gets Pfp metadata object
 * @param user user object from mongo
 * @returns Pfp metadata object
 */
export const getUserPfp = (user: IUser) => {
    const isPfpUndefined =
        !user?.walletProvider?.pfp ||
        JSON.stringify(user?.walletProvider?.pfp) === "{}";
    const pfp: PfpMetadata = isPfpUndefined
        ? {
            ...emptyPfp,
            imageUrl: user?.preferences?.defaultProfileImageUrl ?? ""
        }
        : (user?.walletProvider?.pfp as PfpMetadata);
    return pfp;
};

/**
 * Get total number of swag pins user owns in a set
 * @param swagSet - swag set to check against
 * @param userSwagPins - swag pins owned by user
 * @returns number
 */
export const getTotalSwagOwnedInSet = (
    swagSet: ISwagSet,
    userSwagPins: OwnedNft[]
): number => {
    let total = 0;
    for (const tokenId of swagSet.tokenIds) {
        if (userSwagPins.some((swagPin) => swagPin.tokenId === tokenId)) {
            total++;
        }
    }
    return total;
};

/**
 * Check if wildfile id has claimed swag set
 * @param swagSet - swag set to check
 * @param claimedSwagSets - list of swag sets this user has claimed
 * @returns boolean
 */
export const findClaimedSwagSetWildevent = (
    swagSet: ISwagSet,
    claimedSwagSets: ClaimedSwagSet[]
): PostedWildevent | null => {
    const title = swagSet.title;
    for (const claimedSwagSet of claimedSwagSets) {
        if (claimedSwagSet.title === title) {
            return claimedSwagSet.postedWildevent;
        }
    }
    return null;
};

/**
 * Get the user's provider object based on their preferred provider.
 * @param user - The user object to get the provider for.
 * @returns The user's provider object, or null if the preferred provider is not found.
 */
export const getUserProviderFromPreferredProvider = (
    user: IUser
): AccountProvider | undefined => {
    switch (user.preferredProvider) {
        case "twitter":
            return user.twitterProvider;
        case "discord":
            return user.discordProvider;
        case "twitch":
            return user.twitchProvider;
        case "beamable":
            return user.beamableProvider;
        case "google":
            return user.googleProvider;
        default:
            break;
    }
};

/**
 * Utility function to get a higher quality Twitter profile image URL.
 * @param {string} imageUrl - The URL of the user's Twitter profile image.
 * @returns {string} The higher quality Twitter profile image URL. e.g. (400x400)
 */
export const getTwitterImage = (imageUrl: string): string => {
    if (!imageUrl) {
        return imageUrl;
    }

    if (imageUrl.includes("pbs.twimg.com")) {
        return imageUrl.replace("_normal", "_400x400");
    }

    return imageUrl;
};

/**
 * Returns the user's profile picture URL.
 * @param user - The user object to get the profile picture for.
 * @returns The user's profile picture URL, or the default silhouette image if the user does not have a PFP or preferred provider.
 */
export const getUserProfilePicture = (user: IUser | null) => {
    if (!user) {
        return Silhoutte.src;
    }

    const activePfpUrl = getActivePfpUrl(user);
    if (activePfpUrl) {
        return activePfpUrl;
    }

    const pfp = getUserPfp(user);
    if (pfp?.imageUrl) {
        return pfp.imageUrl;
    }

    return getUserProviderPicture(user);
};

/**
 * Returns the user's provider picture URL.
 * @param user - The user object to get the provider picture for.
 * @returns The user's provider picture URL, or the default silhoutte image if the user does not have a provider or preferred provider.
 */
export const getUserProviderPicture = (user: IUser | null) => {
    if (!user) {
        return Silhoutte.src;
    }
    const provider = getUserProviderFromPreferredProvider(user);
    if (provider?.image) {
        return provider.image;
    }
    return Silhoutte.src;
};
