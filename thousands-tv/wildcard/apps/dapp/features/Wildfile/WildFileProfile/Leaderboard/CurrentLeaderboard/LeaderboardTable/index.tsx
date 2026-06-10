import { Dispatch, SetStateAction, useContext } from "react";
import { Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { ColorObject } from "@/types";
import Row from "./Row";
import { LeaderboardHeaderProps } from "..";
import * as styles from "./styles";
import Footer from "./Footer";
import {
    ILeaderboardRow,
    ILeaderboardScoringDetail,
    LEADERBOARD_PAGE_SIZE,
} from "@repo/interfaces";

interface LeaderboardTableProps {
    leaderboardId: string;
    headers: LeaderboardHeaderProps[];
    rows: ILeaderboardRow[];
    setImageLoaded: Dispatch<SetStateAction<boolean>>;
    imageLoaded: boolean;
    avatarThemeColor: ColorObject;
    page: number;
    leaderboardScoringDetails: ILeaderboardScoringDetail[];
}

/**
 * Renders custom leaderboard table
 */
const LeaderboardTable = ({
    leaderboardId,
    headers,
    rows,
    setImageLoaded,
    imageLoaded,
    avatarThemeColor,
    page,
    leaderboardScoringDetails,
}: LeaderboardTableProps) => {
    const { pageOwnerUser } = useContext(ProfileContext);

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, LEADERBOARD_PAGE_SIZE - rows.length) : 0;

    /**
     * Renders footer component when my rank is not within current page
     * @returns Footer jsx
     */
    const renderFooter = () => {
        const isMyRankInCurrentRows = rows.some((row: ILeaderboardRow) => {
            return row.userId === pageOwnerUser._id?.toString();
        });

        if (!isMyRankInCurrentRows) {
            return (
                <Footer
                    headers={headers}
                    leaderboardId={leaderboardId}
                    avatarThemeColor={avatarThemeColor}
                    imageLoaded={imageLoaded}
                    setImageLoaded={setImageLoaded}
                    page={page}
                    leaderboardScoringDetails={leaderboardScoringDetails}
                />
            );
        }

        return <></>;
    };

    return (
        <Table sx={styles.tableSx}>
            <Thead>
                <Tr>
                    {headers.map(
                        (header: LeaderboardHeaderProps, index: number) => {
                            return (
                                <Th
                                    key={index}
                                    sx={styles.tableHeaderSx(
                                        avatarThemeColor,
                                        header.sx
                                    )}
                                >
                                    {header.label}
                                </Th>
                            );
                        }
                    )}
                </Tr>
            </Thead>
            <Tbody sx={styles.tableBodySx}>
                {rows.map((row: ILeaderboardRow, index: number) => {
                    return (
                        <Row
                            key={index}
                            row={row}
                            page={page}
                            imageLoaded={imageLoaded}
                            setImageLoaded={setImageLoaded}
                            avatarThemeColor={avatarThemeColor}
                            leaderboardScoringDetails={
                                leaderboardScoringDetails
                            }
                        />
                    );
                })}
                {Array.from(Array(emptyRows).keys()).map((value) => {
                    return (
                        <Tr key={`${leaderboardId}-${value}`}>
                            <Td colSpan={5} />
                        </Tr>
                    );
                })}
            </Tbody>
            {renderFooter()}
        </Table>
    );
};

export default LeaderboardTable;
