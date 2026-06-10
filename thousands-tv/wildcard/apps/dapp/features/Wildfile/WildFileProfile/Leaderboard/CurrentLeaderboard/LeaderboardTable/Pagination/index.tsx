import { Dispatch, SetStateAction, useContext } from "react";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Button, Box } from "@chakra-ui/react";
import axios from "axios";
import * as styles from "./styles";
import {
    ILeaderboard,
    ILeaderboardRow,
    WildcardApiResponse,
    LEADERBOARD_PAGE_SIZE,
} from "@repo/interfaces";

interface PaginationProps {
    leaderboardId: string;
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    setRows: Dispatch<SetStateAction<ILeaderboardRow[]>>;
}

/**
 * Renders a table pagination enables user to select previous and next page
 */
const Pagination = ({
    leaderboardId,
    page,
    setPage,
    setRows,
}: PaginationProps) => {
    const { leaderboardCounts } = useContext(ProfileContext);

    // Get total number of rows from specific leaderboard
    const totalNumRows =
        leaderboardCounts.find(
            (leaderboardCount) =>
                leaderboardCount.leaderboardId === leaderboardId
        )?.totalRows || 0;

    // Get total number of pages
    const totalNumPages = Math.ceil(totalNumRows / LEADERBOARD_PAGE_SIZE);

    /**
     * Handle fetchLeaderboard logic to set new leaderboard rows
     * @param fetchLeaderboardsResp api response
     */
    const handleFetchLeaderboard = (
        fetchLeaderboardsResp: WildcardApiResponse
    ) => {
        if (!fetchLeaderboardsResp.success) {
            return;
        }
        const fetchLeaderboards: ILeaderboard[] = fetchLeaderboardsResp.data;
        const currentLeaderboard: ILeaderboard = fetchLeaderboards[0];
        const currentLeaderboardRows: ILeaderboardRow[] =
            currentLeaderboard.leaderboardRows;
        setRows(currentLeaderboardRows);
    };

    /**
     * Callback fired when page is click to go to previous page and fetch previous page rows
     */
    const handleBackButtonClick = async () => {
        const res = await axios.get(
            `/api/fetchLeaderboards?pageNum=${
                page - 1
            }&leaderboardId=${leaderboardId}`
        );
        handleFetchLeaderboard(res.data);
        setPage(page - 1);
    };

    /**
     * Callback fired when page is click to go to next page and fetch next page rows
     */
    const handleNextButtonClick = async () => {
        const res = await axios.get(
            `/api/fetchLeaderboards?pageNum=${
                page + 1
            }&leaderboardId=${leaderboardId}`
        );
        handleFetchLeaderboard(res.data);
        setPage(page + 1);
    };

    return (
        <>
            <Button
                variant="ghost"
                onClick={handleBackButtonClick}
                sx={styles.paginationBtnSx}
                justifyContent="flex-end"
                isDisabled={page === 0}
                size="sm"
            >
                <ChevronLeftIcon />
            </Button>
            <Box sx={styles.paginationTextSx}>
                {page + 1} of {totalNumPages}
            </Box>
            <Button
                variant="ghost"
                onClick={handleNextButtonClick}
                sx={styles.paginationBtnSx}
                justifyContent="flex-start"
                isDisabled={page + 1 === totalNumPages}
                size="sm"
            >
                <ChevronRightIcon />
            </Button>
        </>
    );
};
export default Pagination;
