import { Dispatch, SetStateAction, useContext } from "react";
import { Flex, Button, Box, Text } from "@chakra-ui/react";
import * as styles from "./styles";
import { SHOWCASES } from "@/constants/constants";
import ShowcaseHeaderSVG from "../ShowcaseHeaderSVG";
import { ShowcaseTab } from "..";
import { gilroySemiBold, wildleagueBoldCondensed } from "@/utils/themeUtil";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { getTotalSwagOwnedInSet } from "@/utils/userUtil";
import { ColorObject } from "@/types";

interface ShowcaseNavigationProps {
    activeShowcaseTab: ShowcaseTab;
    setActiveShowcaseTab: Dispatch<SetStateAction<ShowcaseTab>>;
    avatarThemeColor: ColorObject;
}

/**
 * Displays user's showcase identification and showcase button group tabs
 */
const ShowcaseNavigation = ({
    activeShowcaseTab,
    setActiveShowcaseTab,
    avatarThemeColor,
}: ShowcaseNavigationProps) => {
    const { swagSets, swagPins } = useContext(ProfileContext);

    /**
     * Get string representation of total owned swag pins over total swag pins of all the sets
     * @returns string representation total owned swag pins over total swag pins of all the sets
     */
    const getTotalOwnedSwagPinsInPreAlphaCollectionString = () => {
        let totalOwnedSwagPins = 0;
        let totalSwagInSet = 0;
        swagSets.forEach((swagSet) => {
            totalOwnedSwagPins += getTotalSwagOwnedInSet(swagSet, swagPins);
            totalSwagInSet += swagSet.tokenIds.length;
        });

        return `${totalOwnedSwagPins.toString()}/${totalSwagInSet.toString()}`;
    };

    // List of different showcase: "Pre-Alpha", "Extra Life" (Coming Soon)
    const ownedSwagShowcaseCountList = [
        getTotalOwnedSwagPinsInPreAlphaCollectionString(),
    ];

    /**
     * Change to new selected tab
     * @param tab index of the new selected tab
     */
    const handleShowcaseTabChange = (tab: ShowcaseTab) => {
        setActiveShowcaseTab(tab);
    };

    /**
     * Renders ghost button
     * @param text label
     * @param showcaseTab enum value
     * @returns button jsx
     */
    const renderGhostButton = (
        text: string,
        ownedSwagCount: string,
        showcaseTab: ShowcaseTab
    ) => {
        return (
            <Button
                variant={"ghost"}
                sx={styles.ghostBtnSx(activeShowcaseTab === showcaseTab)}
                onClick={() => handleShowcaseTabChange(showcaseTab)}
                className={wildleagueBoldCondensed.className}
                key={text}
            >
                {text}{" "}
                <Text
                    className={gilroySemiBold.className}
                    sx={styles.ownedSwagCountSx}
                >
                    {ownedSwagCount}
                </Text>
            </Button>
        );
    };

    /**
     * Render a ghost button group
     * @returns list of button jsx
     */
    const renderShowcasesNavigation = () => {
        return SHOWCASES.map((showcase: string, index: number) => {
            return renderGhostButton(
                showcase,
                ownedSwagShowcaseCountList[index],
                index
            );
        });
    };

    return (
        <Flex id="showcaseNavigationFlex" sx={styles.showcaseNavigationFlexSx}>
            <Box>
                <ShowcaseHeaderSVG avatarThemeColor={avatarThemeColor} />
            </Box>
            <Flex sx={styles.btnGroupSx}>{renderShowcasesNavigation()}</Flex>
        </Flex>
    );
};
export default ShowcaseNavigation;
