import {
    ALABASTER,
    AMBER,
    AZURE,
    BLUSH,
    EMERALD,
    GOLD,
    NUM_UNIQUE_WILDPASS,
    SCARLET,
    VIOLET,
} from "@src/constants";
import { IUser } from "@repo/interfaces";
import { WildpassHolder } from "../interface";

/**
 * Check whether user fulfilled/met specific badge requirement/condition
 * @param user - User object
 * @param badgeId - badge id
 * @param wildpassColorSet - collection of wildpass color
 * @returns true or false if specific badge requirements or conditions are fulfilled/met
 */
export function processWildpassBadge(
    user: IUser,
    badgeId: string,
    wildpassColorSet: Set<string>
): boolean {
    switch (badgeId) {
        case WildpassHolder.WILDPASS_HOLDER:
            return holdAtLeastOneWildpass(wildpassColorSet);
        case WildpassHolder.FULL_SPECTRUM_WILDPASS_HOLDER:
            return holdFullSpectrumOfWildpass(wildpassColorSet);
        default:
            return false;
    }
}

/**
 * Check user has at least one unique wildpass
 * @param wildpassColorSet - collection of unique wildpass color
 * @returns true if set has at least one unique wildpass else false
 */
function holdAtLeastOneWildpass(wildpassColorSet: Set<string>): boolean {
    return wildpassColorSet.size > 0;
}

/**
 * Check user has full spectrum/set of 8 unique wildpass
 * @param wildpassColorSet - collection of unique wildpass color
 * @returns true if set has exactly 8 unique wildpass else fase
 */
function holdFullSpectrumOfWildpass(wildpassColorSet: Set<string>): boolean {
    return wildpassColorSet.size === NUM_UNIQUE_WILDPASS;
}

/**
 * Get wildpass color
 * @param tokenId - wildpass token id
 * @returns wildpass unique color string
 */
export function getWildpassColor(tokenId: number): string | null {
    const color = tokenId % NUM_UNIQUE_WILDPASS;
    switch (color) {
        case 0:
            return AZURE;
        case 1:
            return GOLD;
        case 2:
            return SCARLET;
        case 3:
            return VIOLET;
        case 4:
            return AMBER;
        case 5:
            return EMERALD;
        case 6:
            return ALABASTER;
        case 7:
            return BLUSH;
        default:
            return null;
    }
}
