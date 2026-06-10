import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { HexagonSVGAvatarPFP } from "@/components/SVGImages";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { Tr, Td, Image, useMediaQuery, useDisclosure } from "@chakra-ui/react";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import { ColorObject } from "@/types";
import { getTrophyImg, shorten } from "@/utils/util";
import * as styles from "./styles";
import CollapsibleRow from "../CollapsibleRow";
import { ILeaderboardRow, ILeaderboardScoringDetail } from "@repo/interfaces";

interface RowProps {
    row: ILeaderboardRow;
    setImageLoaded: Dispatch<SetStateAction<boolean>>;
    imageLoaded: boolean;
    page: number;
    avatarThemeColor: ColorObject;
    leaderboardScoringDetails: ILeaderboardScoringDetail[];
}

/**
 * Renders a custom row for the custom leaderboard table
 */
const Row = ({
    row,
    setImageLoaded,
    imageLoaded,
    page,
    avatarThemeColor,
    leaderboardScoringDetails,
}: RowProps) => {
    const { pageOwnerUser } = useContext(ProfileContext);
    const { isOpen, onToggle } = useDisclosure();

    const [isSmallerThan480] = useMediaQuery("(max-width: 480px)", {
        ssr: true,
        fallback: false,
    });

    /**
     * Render shorten variation player name
     * @param row ILeaderboard object
     * @returns shorten variation of player name
     */
    const renderPlayerName = (row: ILeaderboardRow) => {
        if (isSmallerThan480) {
            return (
                shorten(row?.displayName, {
                    length: 15,
                }) || shorten(row.userId)
            );
        }

        return shorten(row?.displayName) || shorten(row.userId);
    };

    // For every page change, do not expand the row
    useEffect(() => {
        if (isOpen) {
            onToggle();
        }
    }, [page]);

    return (
        <>
            <Tr
                sx={styles.tableRowSx(
                    row.userId,
                    pageOwnerUser._id?.toString() || "",
                    row.rank,
                    avatarThemeColor
                )}
                onClick={onToggle}
            >
                <Td sx={styles.trophyTableCellSx}>
                    {row.rank < 4 && (
                        <Image
                            alt={"trophy"}
                            src={getTrophyImg("table", row.rank)}
                            sx={styles.trophySx}
                        />
                    )}
                </Td>
                <Td sx={styles.rankTableCellSx}>{row.rank}</Td>
                <Td sx={styles.playerTableCellSx}>
                    <HexagonSVGAvatarPFP
                        srcUrl={row.pfpUrl || Silhoutte.src}
                        scaleFactor={0.95} // custom scale for the image to fit inside the hexagon border
                        setImageLoaded={setImageLoaded}
                        imageLoaded={imageLoaded}
                        h={"20px"}
                        w={"20px"}
                        id={"leaderboard"}
                    />
                    {renderPlayerName(row)}
                </Td>
                <Td sx={styles.scoreTableCellSx}>{row.score}</Td>
            </Tr>
            <CollapsibleRow
                row={row}
                isOpen={isOpen}
                leaderboardScoringDetails={leaderboardScoringDetails}
                imageLoaded={imageLoaded}
                setImageLoaded={setImageLoaded}
                avatarThemeColor={avatarThemeColor}
            />
        </>
    );
};
export default Row;
