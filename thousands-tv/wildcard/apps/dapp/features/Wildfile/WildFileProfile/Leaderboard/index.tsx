import { Dispatch, SetStateAction, useContext, useState } from "react";
import { Box, Flex, TableContainer } from "@chakra-ui/react";
import LeaderboardNavigation from "./LeaderboardNavigation";
import MyRanking from "./MyRanking";
import { ColorObject } from "@/types";
import ProfileContext from "../../WildfileContext";
import { ILeaderboard } from "@repo/interfaces";
import CurrentLeaderboard from "./CurrentLeaderboard";
import * as styles from "./styles";
import {
    ALPHA_SERIES_ZERO_BG_COLOR,
    ALPHA_SERIES_ZERO_LEADERBOARD_ID,
    DREAM_HACK_BG_COLOR,
    DREAM_HACK_LEADERBOARD_ID,
    EVENT_LEADERBOARD_ID,
    NFT_LEADERBOARD_ID,
} from "@/constants/constants";
import MyRankingSVG from "./HeaderSVG/MyRankingSVG";
import AlphaSeriesOneRegular from "@/public/images/WildfileAssets/Leaderboard/AlphaSeriesOneRegular.svg";
import AlphaSeriesOneSmall from "@/public/images/WildfileAssets/Leaderboard/AlphaSeriesOneSmall.svg";
import DreamHackRegular from "@/public/images/WildfileAssets/Leaderboard/DreamHackRegular.svg";
import DreamHackSmall from "@/public/images/WildfileAssets/Leaderboard/DreamHackSmall.svg";

export enum LeaderboardTab {
    A = 0,
    B = 1,
    C = 2,
    D = 3,
    E = 4,
}

// The order how we want to present the leaderboards
export const LEADERBOARDS: {
    leaderboardId: string;
    backgroundColor: string;
    getIconSrc: (isFitToAccordion: boolean) => string;
}[] = [
    {
        leaderboardId: ALPHA_SERIES_ZERO_LEADERBOARD_ID,
        backgroundColor: ALPHA_SERIES_ZERO_BG_COLOR,
        getIconSrc: (isFitToAccordion: boolean) =>
            isFitToAccordion
                ? AlphaSeriesOneSmall.src
                : AlphaSeriesOneRegular.src,
    },
    {
        leaderboardId: DREAM_HACK_LEADERBOARD_ID,
        backgroundColor: DREAM_HACK_BG_COLOR,
        getIconSrc: (isFitToAccordion: boolean) =>
            isFitToAccordion ? DreamHackSmall.src : DreamHackRegular.src,
    },
    {
        leaderboardId: NFT_LEADERBOARD_ID,
        backgroundColor: ALPHA_SERIES_ZERO_BG_COLOR,
        getIconSrc: (isFitToAccordion: boolean) =>
            isFitToAccordion
                ? AlphaSeriesOneSmall.src
                : AlphaSeriesOneRegular.src,
    },
    {
        leaderboardId: EVENT_LEADERBOARD_ID,
        backgroundColor: ALPHA_SERIES_ZERO_BG_COLOR,
        getIconSrc: (isFitToAccordion: boolean) =>
            isFitToAccordion
                ? AlphaSeriesOneSmall.src
                : AlphaSeriesOneRegular.src,
    },
];

interface LeaderboardProps {
    avatarThemeColor: ColorObject;
    setImageLoaded: Dispatch<SetStateAction<boolean>>;
    imageLoaded: boolean;
}

/**
 * Renders leaderboard panel/content regarding about my ranking and current leaderboards under leaderboard tab
 */
const Leaderboard = ({
    avatarThemeColor,
    setImageLoaded,
    imageLoaded,
}: LeaderboardProps) => {
    // activeLeaderboardTab specifies active leader category tab
    const [activeLeaderboardTab, setActiveLeaderboardTab] =
        useState<LeaderboardTab>(LeaderboardTab.A);

    const { leaderboards, pageOwnerLeaderboardPositions } =
        useContext(ProfileContext);

    /**
     * Render My Ranking components
     * @returns My Ranking svg and jsx component otherwise nothing
     */
    const renderMyRanking = () => {
        if (
            !pageOwnerLeaderboardPositions ||
            pageOwnerLeaderboardPositions.length === 0
        ) {
            return <></>;
        }

        return (
            <Flex id="my-rankings" sx={styles.myRankingContainerSx}>
                <Box>
                    <MyRankingSVG avatarThemeColor={avatarThemeColor} />
                </Box>
                <Flex sx={styles.myRankingWrapperSx}>
                    <MyRanking />
                </Flex>
            </Flex>
        );
    };

    if (!leaderboards || leaderboards.length === 0) {
        return <></>;
    }

    return (
        <Flex sx={styles.leaderboardContainerSx}>
            {renderMyRanking()}
            <Flex
                id="current-leaderboard"
                sx={styles.currentLeaderboardContainerSx}
            >
                <LeaderboardNavigation
                    activeLeaderboardTab={activeLeaderboardTab}
                    setActiveLeaderboardTab={setActiveLeaderboardTab}
                    avatarThemeColor={avatarThemeColor}
                />
                <TableContainer sx={styles.tableContainerSx}>
                    {LEADERBOARDS.map((currleaderboard) => {
                        const leaderboard = leaderboards.find(
                            (leaderboard: ILeaderboard) => {
                                return (
                                    leaderboard.leaderboardId ===
                                    currleaderboard.leaderboardId
                                );
                            }
                        );

                        if (!leaderboard) {
                            return <></>;
                        }

                        return (
                            <CurrentLeaderboard
                                key={`table-${leaderboard.leaderboardId}-${leaderboard.name}`}
                                leaderboard={leaderboard}
                                avatarThemeColor={avatarThemeColor}
                                imageLoaded={imageLoaded}
                                setImageLoaded={setImageLoaded}
                            />
                        );
                    })}
                </TableContainer>
            </Flex>
        </Flex>
    );
};

export default Leaderboard;
