import { useContext } from "react";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import RankCard from "./RankCard";
import { getBackgroundColorFromLeaderboardList } from "@/utils/util";
import { Text } from "@chakra-ui/react";
import { UserLeaderboardPosition } from "@repo/interfaces";

export enum RankImprovementStatus {
    NO_CHANGE = 0,
    RANK_UP = 1,
    RANK_DOWN = 2,
}

interface MyRankingProps {
    isFitToAccordion?: boolean;
}

/**
 * Renders number of rank cards which specifies their place/position in respect to specific leaderboard
 */
const MyRanking = ({ isFitToAccordion = false }: MyRankingProps) => {
    const { pageOwnerLeaderboardPositions } = useContext(ProfileContext);

    let leaderboardPositions = pageOwnerLeaderboardPositions;

    // Check is the mode for fitting to accordion
    if (isFitToAccordion) {
        // "Main" tab can only fit up to 2 card components
        leaderboardPositions = pageOwnerLeaderboardPositions.slice(0, 2);
    }

    if (!leaderboardPositions || leaderboardPositions.length === 0) {
        return <Text opacity={0.5}>Not in current Leaderboards</Text>;
    }

    return leaderboardPositions.map(
        (leaderboardPosition: UserLeaderboardPosition) => {
            const myRanking = leaderboardPosition.userPosition;

            let rankImprovmentStatus: RankImprovementStatus =
                RankImprovementStatus.NO_CHANGE;
            if (myRanking.rank < myRanking.prevRank) {
                rankImprovmentStatus = RankImprovementStatus.RANK_UP;
            } else if (myRanking.rank > myRanking.prevRank) {
                rankImprovmentStatus = RankImprovementStatus.RANK_DOWN;
            }

            const leaderboardId = leaderboardPosition.leaderboardId;
            const backgroundColor =
                getBackgroundColorFromLeaderboardList(leaderboardId);
            return (
                <RankCard
                    key={`rankcard-${leaderboardId}-${leaderboardPosition.name}`}
                    rank={myRanking.rank}
                    leaderboardId={leaderboardId}
                    leaderboardLabel={leaderboardPosition.name}
                    score={myRanking.score}
                    rankImprovement={rankImprovmentStatus}
                    backgroundColor={backgroundColor}
                    isFitToAccordion={isFitToAccordion}
                />
            );
        }
    );
};

export default MyRanking;
