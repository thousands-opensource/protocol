import { Dispatch, SetStateAction, useContext, useState } from "react";
import {
    Flex,
    Button,
    Box,
    Text,
    SystemStyleObject,
    Collapse,
    useDisclosure,
    Grid,
    GridItem,
    useBreakpointValue,
} from "@chakra-ui/react";
import LeaderboardTable from "./LeaderboardTable";
import { ColorObject } from "@/types";
import * as styles from "./styles";
import Pagination from "./LeaderboardTable/Pagination";
import { GlobalContext } from "@/contexts/globalContext";
import { getBadgeIconFromLeaderboardList } from "@/utils/util";
import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import { ALPHA_SERIES_LEARN_MORE_LINK } from "@/constants/constants";
import { ILeaderboard, ILeaderboardRow } from "@repo/interfaces";

interface CurrentLeaderboardProps {
    leaderboard: ILeaderboard;
    avatarThemeColor: ColorObject;
    setImageLoaded: Dispatch<SetStateAction<boolean>>;
    imageLoaded: boolean;
}

export interface LeaderboardHeaderProps {
    label: string;
    sx: SystemStyleObject;
}

const HEADERS: LeaderboardHeaderProps[] = [
    { label: "", sx: { ps: 0, pe: 1 } },
    { label: "Rank", sx: { ps: 1, pe: 2 } },
    { label: "User ID", sx: { ps: 0 } },
    { label: "Score", sx: { ps: 0, pe: 1 } },
];

/**
 * Renders a additional details about current leaderboard and custom leaderboard table with pagination
 */
const CurrentLeaderboard = ({
    leaderboard,
    imageLoaded,
    setImageLoaded,
    avatarThemeColor,
}: CurrentLeaderboardProps) => {
    const { loggedIn } = useContext(GlobalContext);
    // Custom hook handle common open/close/toggle scenarios
    const { isOpen, onToggle } = useDisclosure();
    // Specifies current page 0-based index
    const [page, setPage] = useState<number>(0);

    // List of ILeaderboardRow object
    const [rows, setRows] = useState<ILeaderboardRow[]>(
        leaderboard.leaderboardRows
    );

    const leaderboardScoringDetails = leaderboard.leaderboardScoringDetails;
    const columnStats = useBreakpointValue({ base: 1, sm: 2 });

    const renderStats = (
        key: string,
        scoringType: string,
        scorePoints: string
    ) => {
        return (
            <GridItem sx={styles.currentLeaderboardGridItemLabelSx} key={key}>
                <Flex sx={styles.currentLeaderboardGridItemFlexSx}>
                    <Box sx={styles.currentLeaderboardGridItemBoxSx}>
                        <Text
                            sx={
                                styles.currentLeaderboardGridItemScoringTypeTextSx
                            }
                        >
                            {scoringType}
                        </Text>
                    </Box>
                    <Box sx={styles.currentLeaderboardBoxScoringTypeSx}>
                        <Text sx={styles.currentLeaderboardTextScoringTypeSx}>
                            {scorePoints}
                        </Text>
                    </Box>
                </Flex>
            </GridItem>
        );
    };
    return (
        <Flex sx={styles.currentLeaderboardContainerSx}>
            <Flex sx={styles.currentLeaderboardHeaderContainerSx}>
                <Box sx={styles.currentLeaderboardHeaderSx}>
                    <ChakraNextImageSimple
                        sx={styles.currentLeaderboardBadgeSx}
                        src={getBadgeIconFromLeaderboardList(
                            leaderboard.leaderboardId
                        )}
                        alt="icon badge"
                        height={50}
                        width={50}
                    />
                    <Flex sx={styles.currentLeaderboardHeaderTitleContainerSx}>
                        <Text sx={styles.currentLeaderboardHeaderTitleSx}>
                            {leaderboard.name}
                        </Text>
                        <Button
                            variant="link"
                            sx={styles.currentLeaderboardInfoBtnSx}
                            onClick={onToggle}
                        >
                            Info
                        </Button>
                    </Flex>
                </Box>
                <Flex sx={styles.currentLeaderboardPaginationContainerSx}>
                    <Pagination
                        leaderboardId={leaderboard.leaderboardId}
                        page={page}
                        setPage={setPage}
                        setRows={setRows}
                    />
                </Flex>
            </Flex>
            <Collapse
                hidden={!isOpen}
                in={isOpen}
                animateOpacity
                transition={{
                    exit: { duration: 0.5 },
                    enter: { duration: 0.5 },
                }}
            >
                <Flex sx={styles.currentLeaderboardSubHeaderContainerSx}>
                    <Box sx={styles.currentLeaderboardSubHeaderSx}>
                        <Box sx={styles.currentLeaderboardBadgeSx} />
                        <Flex
                            sx={
                                styles.currentLeaderboardSubHeaderDescriptionContainerSx
                            }
                        >
                            <Box>
                                <Text
                                    sx={
                                        styles.currentLeaderboardSubHeaderDescriptionTitleSx
                                    }
                                >
                                    Description of Leaderboard
                                </Text>
                                <Text
                                    sx={
                                        styles.currentLeaderboardSubHeaderDescriptionSx
                                    }
                                >
                                    {leaderboard.description}
                                </Text>
                            </Box>
                            <Box w="100%">
                                <Text
                                    sx={
                                        styles.currentLeaderboardSubHeaderDescriptionTitleSx
                                    }
                                >
                                    Stats
                                </Text>

                                <>
                                    <Grid
                                        templateColumns={`repeat(${columnStats}, 1fr)`}
                                        sx={styles.currentLeaderboardGridSx}
                                    >
                                        {Array.from({
                                            length: columnStats || 0,
                                        }).map((_, index) => (
                                            <GridItem key={index}>
                                                <Flex
                                                    sx={
                                                        styles.currentLeaderboardGridItemSx
                                                    }
                                                >
                                                    <Text>Scoring Type</Text>
                                                    <Text>Points</Text>
                                                </Flex>
                                            </GridItem>
                                        ))}
                                    </Grid>
                                    <Grid
                                        templateColumns={`repeat(${columnStats}, 1fr)`}
                                        sx={styles.currentLeaderboardGridSx}
                                    >
                                        {leaderboardScoringDetails.map(
                                            (scoringDetail, index) => {
                                                const key = `${scoringDetail.scoringType}-${index}`;
                                                return (
                                                    <>
                                                        {renderStats(
                                                            `${key}-type`,
                                                            scoringDetail.label ||
                                                                scoringDetail.scoringType,
                                                            scoringDetail.points.toString()
                                                        )}
                                                    </>
                                                );
                                            }
                                        )}
                                    </Grid>
                                </>
                            </Box>
                            <Button
                                variant="outline"
                                size={["xs", "xs", "xs", "sm"]}
                                sx={
                                    styles.currentLeaderboardSubHeaderLearnMoreSx
                                }
                                onClick={() => {
                                    window.open(
                                        ALPHA_SERIES_LEARN_MORE_LINK,
                                        "_blank"
                                    );
                                }}
                            >
                                Learn More
                            </Button>
                        </Flex>
                    </Box>
                </Flex>
            </Collapse>
            <LeaderboardTable
                headers={HEADERS}
                rows={rows}
                leaderboardId={leaderboard.leaderboardId}
                leaderboardScoringDetails={
                    leaderboard.leaderboardScoringDetails
                }
                setImageLoaded={setImageLoaded}
                imageLoaded={imageLoaded}
                avatarThemeColor={avatarThemeColor}
                page={page}
            />
        </Flex>
    );
};

export default CurrentLeaderboard;
