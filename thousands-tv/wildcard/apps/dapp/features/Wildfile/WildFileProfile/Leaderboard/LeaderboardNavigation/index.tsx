import { Dispatch, SetStateAction } from "react";
import { LeaderboardTab } from "..";
import { Box, Button, Flex } from "@chakra-ui/react";
import * as styles from "./styles";
import { wildleagueBoldCondensed } from "@/utils/themeUtil";
import CurrentLeaderboardsSVG from "../HeaderSVG/CurrentLeaderboardsSVG";
import { ColorObject } from "@/types";

interface LeaderboardNavigationProps {
    activeLeaderboardTab: LeaderboardTab;
    setActiveLeaderboardTab: Dispatch<SetStateAction<LeaderboardTab>>;
    avatarThemeColor: ColorObject;
}

/**
 * Displays leaderboard navigation
 */
const LeaderboardNavigation = ({
    activeLeaderboardTab,
    setActiveLeaderboardTab,
    avatarThemeColor,
}: LeaderboardNavigationProps) => {
    /**
     * Change to new selected tab
     * @param tab index of the new selected tab
     */
    const handleLeaderboardTabChange = (tab: LeaderboardTab) => {
        setActiveLeaderboardTab(tab);
    };

    /**
     * Renders ghost button
     * @param text label
     * @param showcaseTab enum value
     * @returns button jsx
     */
    const renderGhostButton = (
        text: string,
        leaderboardTab: LeaderboardTab
    ) => {
        return (
            <Button
                variant={"ghost"}
                sx={styles.ghostBtnSx(activeLeaderboardTab === leaderboardTab)}
                onClick={() => handleLeaderboardTabChange(leaderboardTab)}
                className={wildleagueBoldCondensed.className}
                key={text}
            >
                {text}
            </Button>
        );
    };

    /**
     * Render a ghost button group
     * @returns list of button jsx
     */
    const renderLeaderboardsNavigation = () => {
        return ["A", "B", "C", "D", "E"].map(
            (leaderboard: string, index: number) => {
                return renderGhostButton(leaderboard, index);
            }
        );
    };

    return (
        <Flex id="leaderboard-navigation" sx={styles.leaderboardNavigation}>
            <Box>
                <CurrentLeaderboardsSVG avatarThemeColor={avatarThemeColor} />
            </Box>
            {/* No categories & put on hold */}
            {/* <Flex sx={styles.btnGroupSx}>{renderLeaderboardsNavigation()}</Flex> */}
        </Flex>
    );
};
export default LeaderboardNavigation;
