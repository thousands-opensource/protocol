import { ColorObject } from "@/types";
import {
    alabasterColorObj,
    wildpassTraitColorsMap,
} from "@/utils/wildpassUtil";
import { Button, Flex, Grid, GridItem, Text } from "@chakra-ui/react";
import * as styles from "./styles";

/**
 * Interface for the ColorSelectGrid
 */
interface ThemeColorSelectGridProps {
    setColorSelected: (color: ColorObject) => void; // local state for preview theme color rendering
    colorSelected: ColorObject;
}

/**
 * ColorSelectGrid component for selecting avatar theme colors.
 * @param {ThemeColorSelectGridProps} - Component props containing `setAvatarThemeColor`, `avatarThemeColor`
 * @returns - Theme Color Select Grid
 */
export const ThemeColorSelectGrid = ({
    setColorSelected,
    colorSelected,
}: ThemeColorSelectGridProps) => {
    /**
     * Render wildpass traits theme color grid select
     * @dev - append alabaster (default color) to the ownedMatchingWildpassColors array if the does not already include it
     */
    const WildpassTraitsColorGrid = wildpassTraitColorsMap.map(
        (colorObj, index) => {
            const isSelected = colorSelected.hexValue === colorObj.hexValue; // should be the value from avatarThemeColor

            return (
                <GridItem
                    key={index}
                    sx={styles.themeColorSelectGridItemSx}
                    onClick={() => setColorSelected(colorObj)}
                >
                    <Flex sx={styles.themeColorTileSx}>
                        <Button
                            sx={styles.themeColorSelectButtonSx(
                                colorObj.hexValue,
                                isSelected
                            )}
                        />
                        <Text
                            sx={styles.themeColorTextSx(isSelected)}
                        >{`${colorObj.colorName} `}</Text>
                    </Flex>
                </GridItem>
            );
        }
    );

    return (
        <Flex sx={styles.themeColorSelectParentSx}>
            <Grid
                templateColumns="repeat(2, 1fr)"
                sx={styles.themeColorSelectGridSx}
            >
                {WildpassTraitsColorGrid}
            </Grid>
        </Flex>
    );
};
