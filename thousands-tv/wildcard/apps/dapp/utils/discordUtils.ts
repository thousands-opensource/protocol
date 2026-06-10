import { THEME_COLOR_METALLIC_GREY } from "@/constants/constants";
import { Role } from "discord.js";

/**
 * Converts a decimal color value to its hexadecimal representation.
 * @param decimalColor - The decimal color value to convert.
 * @returns The hexadecimal representation of the color value.
 */
export const decimalToHexColor = (decimalColor: number): string => {
    /**
     * If the decimalColor is 0, return the color (cloud grey) - default discord role color.
     * Otherwise, convert the decimalColor to its hexadecimal representation
     * and return it with a "#" prefix.
     */
    if (decimalColor === 0) {
        return THEME_COLOR_METALLIC_GREY;
    }
    const hexColorValue: string = `#${decimalColor.toString(16)}`;
    return hexColorValue;
};
