import { Dispatch, SetStateAction, useContext } from "react";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { Tfoot, Tr, Divider, Th } from "@chakra-ui/react";
import { LeaderboardHeaderProps } from "../..";
import { ColorObject } from "@/types";
import * as styles from "./styles";
import Row from "../Row";
import {
    ILeaderboardScoringDetail,
    UserLeaderboardPosition,
} from "@repo/interfaces";

interface FooterProps {
    headers: LeaderboardHeaderProps[];
    leaderboardId: string;
    setImageLoaded: Dispatch<SetStateAction<boolean>>;
    imageLoaded: boolean;
    page: number;
    avatarThemeColor: ColorObject;
    leaderboardScoringDetails: ILeaderboardScoringDetail[];
}

/**
 * Renders a custom footer to discover user rank's place
 */
const Footer = ({
    headers,
    leaderboardId,
    imageLoaded,
    setImageLoaded,
    page,
    avatarThemeColor,
    leaderboardScoringDetails,
}: FooterProps) => {
    const { pageOwnerLeaderboardPositions } = useContext(ProfileContext);

    // Find page owner specific position in the leaderboard
    const leaderboardPosition = pageOwnerLeaderboardPositions.find(
        (leaderboardPosition: UserLeaderboardPosition) => {
            return leaderboardPosition.leaderboardId === leaderboardId;
        }
    );

    if (!leaderboardPosition) {
        return <></>;
    }

    const row = leaderboardPosition.userPosition;
    return (
        <Tfoot>
            <Tr>
                {headers.map(
                    (header: LeaderboardHeaderProps, index: number) => {
                        return (
                            <Th
                                sx={styles.tableHeaderSx}
                                key={`${header.label}-${index}`}
                            >
                                <Divider sx={styles.dividerSx} />
                            </Th>
                        );
                    }
                )}
            </Tr>
            <Row
                row={row}
                imageLoaded={imageLoaded}
                setImageLoaded={setImageLoaded}
                page={page}
                avatarThemeColor={avatarThemeColor}
                leaderboardScoringDetails={leaderboardScoringDetails}
            />
        </Tfoot>
    );
};

export default Footer;
