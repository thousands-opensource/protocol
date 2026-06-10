import { Dispatch, SetStateAction, useContext } from "react";
import { HexagonSVGAvatarPFP } from "@/components/SVGImages";
import {
    Box,
    Collapse,
    Text,
    Grid,
    GridItem,
    Td,
    Flex,
} from "@chakra-ui/react";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import { getAvatarThemeColor, gilroyMedium } from "@/utils/themeUtil";
import { ColorObject } from "@/types";
import * as styles from "./styles";
import {
    ILeaderboardRow,
    ILeaderboardScoringDetail,
    LeaderboardPointCategories,
    LeaderboardStats,
} from "@repo/interfaces";
import { getUserIdProfileRoute } from "@/utils/routeUtil";
interface CollapsibleRowProps {
    row: ILeaderboardRow;
    isOpen: boolean;
    setImageLoaded: Dispatch<SetStateAction<boolean>>;
    imageLoaded: boolean;
    leaderboardScoringDetails: ILeaderboardScoringDetail[];
    avatarThemeColor: ColorObject;
}

// Put on hold
const CollapsibleRow = ({
    row,
    isOpen,
    leaderboardScoringDetails,
    imageLoaded,
    setImageLoaded,
    avatarThemeColor,
}: CollapsibleRowProps) => {
    const userStats: LeaderboardStats = row.userStats;

    /**
     * Go to profile page under 'main' tab
     */
    const goToProfile = () => {
        window.open(`${getUserIdProfileRoute(row.userId)}/?tab=main`, "_blank");
    };

    return (
        <Box sx={styles.collapsibleRowSx(isOpen)}>
            <Td colSpan={5} sx={styles.tableDataSx}>
                <Collapse in={isOpen}>
                    <Text sx={styles.userStatsSx} textTransform="uppercase">
                        User Stats
                    </Text>
                    <Grid
                        templateColumns={["repeat(2, 1fr)", "repeat(2, 1fr)"]}
                        sx={styles.gridSx}
                    >
                        {leaderboardScoringDetails.map(
                            (scoringDetail: ILeaderboardScoringDetail) => {
                                const scoreType =
                                    scoringDetail.scoringType as LeaderboardPointCategories;

                                // scoreType does not exist in stats
                                if (!userStats.hasOwnProperty(scoreType)) {
                                    return null;
                                }

                                const label = scoringDetail?.label
                                    ? scoringDetail.label
                                    : scoreType;
                                const score = userStats[scoreType]
                                    ? userStats[scoreType]
                                    : 0;
                                return (
                                    <GridItem
                                        sx={styles.gridItemSx}
                                        key={scoreType}
                                    >
                                        <Text
                                            fontFamily={
                                                gilroyMedium.style.fontFamily
                                            }
                                        >
                                            {label}
                                        </Text>
                                        <Text sx={styles.gridItemValueSx}>
                                            {score}
                                        </Text>
                                    </GridItem>
                                );
                            }
                        )}
                    </Grid>
                    <Flex sx={styles.visitWildfileContainerSx}>
                        <HexagonSVGAvatarPFP
                            srcUrl={row.pfpUrl || Silhoutte.src}
                            scaleFactor={0.95} // custom scale for the image to fit inside the hexagon border
                            setImageLoaded={setImageLoaded}
                            imageLoaded={imageLoaded}
                            h={"21px"}
                            w={"21px"}
                            id={"leaderboard"}
                        />
                        <Text
                            sx={styles.visitWildfileSx}
                            casing="uppercase"
                            onClick={goToProfile}
                            color={getAvatarThemeColor(avatarThemeColor)}
                        >
                            Click to visit user #{row.userId}
                        </Text>
                    </Flex>
                </Collapse>
            </Td>
        </Box>
    );
};

export default CollapsibleRow;
