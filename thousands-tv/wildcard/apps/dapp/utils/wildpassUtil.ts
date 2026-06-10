import { ColorObject } from "@/types";
import { OwnedNft } from "alchemy-sdk";

/**
 * Wildpass trait colors map with associated hex values (sorted alphabetically)
 */
export const wildpassTraitColorsMap: ColorObject[] = [
    {
        colorName: "Alabaster",
        hexValue: "#FFFFFF",
    },
    {
        colorName: "Amber",
        hexValue: "#F98450",
    },
    {
        colorName: "Azure",
        hexValue: "#5AB5C1",
    },
    {
        colorName: "Blush",
        hexValue: "#E96CF4",
    },
    {
        colorName: "Emerald",
        hexValue: "#86CB00",
    },
    {
        colorName: "Gold",
        hexValue: "#F7B31C",
    },
    {
        colorName: "Scarlet",
        hexValue: "#F45858",
    },
    {
        colorName: "Violet",
        hexValue: "#9B64E2",
    },
];

// Wildpass trait colors enum
export enum WildpassTraitColorEnum {
    ALABASTER = "Alabaster",
    AMBER = "Amber",
    AZURE = "Azure",
    BLUSH = "Blush",
    EMERALD = "Emerald",
    GOLD = "Gold",
    SCARLET = "Scarlet",
    VIOLET = "Violet",
}

// Default allowed theme colors enum
export enum DefaultAllowedThemeColorsEnum {
    ALABASTER = "Alabaster",
}

/**
 * Returns the allowed theme colors by enum
 * @param color - Color Object
 * @returns - theme color name
 */
export function getAllowedThemeColorsByEnum(color: ColorObject) {
    switch (color.colorName) {
        case WildpassTraitColorEnum.ALABASTER:
            return "Alabaster";
        case WildpassTraitColorEnum.AMBER:
            return "Amber";
        case WildpassTraitColorEnum.AZURE:
            return "Azure";
        case WildpassTraitColorEnum.BLUSH:
            return "Blush";
        case WildpassTraitColorEnum.EMERALD:
            return "Emerald";
        case WildpassTraitColorEnum.GOLD:
            return "Gold";
        case WildpassTraitColorEnum.SCARLET:
            return "Scarlet";
        case WildpassTraitColorEnum.VIOLET:
            return "Violet";
        default:
            return "Alabaster";
    }
}

// Default white color object (Rendered as Alabaster by default)
export const alabasterColorObj: ColorObject = {
    colorName: "Alabaster",
    hexValue: "#FFFFFF",
};

/**
 * Get the default allowed theme color object by color name
 * @param colorName - color name to search for
 * @returns - color object of allowed theme color
 */
export function getAllowedThemeColorObjectByColorName(
    colorName: any
): ColorObject {
    if (!colorName) {
        return alabasterColorObj;
    }

    const colorInWildpass = wildpassTraitColorsMap.find(
        (colorObj) => colorObj.colorName === colorName
    );

    if (colorInWildpass) {
        return colorInWildpass || alabasterColorObj;
    }

    return alabasterColorObj; // Color not found in either array default to white
}

/**
 * Get all the wildpass trait color matches which a wildpass holder owns (alphabetical order)
 * @param wildpasses - owned wildpasses info by wallet address (via wildpasses context / alchemy api)
 * @returns array of color objects of matched colors by owned wildpasses
 */
export const getColorMatchOfOwnedWildpassTraitColorsObj = (
    wildpasses: OwnedNft[]
): ColorObject[] => {
    const foundMatchedColorsObj: ColorObject[] = [];

    // Extract the matched trait color metadata (owned by a holder) from wildpasses
    wildpasses.forEach((wildpass) => {
        const color = wildpass.raw.metadata?.attributes?.find(
            (attribute: Record<string, any>) => attribute.trait_type === "Color"
        )?.value;

        if (!color) {
            return;
        }

        const matchedColorObj = wildpassTraitColorsMap.find(
            (colorObj) => colorObj.colorName === color
        );

        if (
            matchedColorObj &&
            !foundMatchedColorsObj.includes(matchedColorObj)
        ) {
            foundMatchedColorsObj.push(matchedColorObj);
        }
    });
    return foundMatchedColorsObj;
};
