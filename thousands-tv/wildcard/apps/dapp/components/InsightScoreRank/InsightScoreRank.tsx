import React from "react";
import { Flex, Text, HStack, Badge, Icon, FlexProps } from "@chakra-ui/react";
import { FaTrophy, FaRocket } from "react-icons/fa";
import { useInsightScoreLeaderboard } from "@/hooks/userInsightScores/useInsightScoreLeaderboard";

interface InsightScoreRankProps extends FlexProps {
    userId?: string;
    showAccuracy?: boolean;
    accuracyFormat?: "short" | "long";
    smallVersion?: boolean;
}

export const InsightScoreRank = ({
    userId,
    showAccuracy = true,
    accuracyFormat = "short",
    smallVersion = false,
    ...flexProps
}: InsightScoreRankProps) => {
    const { getUserEntry, getRankBadgeColor } = useInsightScoreLeaderboard({
        limit: 10,
        fetchLeaderboard: false
    });

    const userEntry = getUserEntry(userId);

    if (!userEntry) return null;

    const defaultFlexProps: FlexProps = {
        flexDirection: smallVersion ? "row" : "column",
        gap: smallVersion ? 2 : 1,
        align: smallVersion ? "center" : "stretch",
        ...flexProps
    };

    return (
        <Flex {...defaultFlexProps}>
            {!smallVersion && (
                <Text fontSize="x-small" color="gray.400">
                    Insight Score Rank
                </Text>
            )}
            <HStack spacing={2}>
                <Badge
                    colorScheme={getRankBadgeColor(userEntry.rank)}
                    variant="solid"
                    fontSize={smallVersion ? "xs" : "sm"}
                    px={smallVersion ? 2 : 3}
                    py={1}
                    borderRadius="md"
                >
                    #{userEntry.rank}
                </Badge>
                <Icon
                    as={userEntry.rank <= 3 ? FaTrophy : FaRocket}
                    color={userEntry.rank <= 3 ? "gold" : "purple.400"}
                    boxSize={smallVersion ? 3 : 4}
                />
                <Text fontSize={smallVersion ? "xs" : "small"} color="white">
                    {userEntry.totalInsightScore.toLocaleString()} points
                </Text>
            </HStack>
            {showAccuracy && !smallVersion && (
                <Text fontSize="xs" color="gray.400">
                    {accuracyFormat === "long"
                        ? `${userEntry.accuracyPercentage.toFixed(1)}% accuracy • ${userEntry.correctPredictions}/${userEntry.totalPredictions} predictions`
                        : `${userEntry.accuracyPercentage.toFixed(1)}% accuracy (${userEntry.correctPredictions}/${userEntry.totalPredictions})`
                    }
                </Text>
            )}
        </Flex>
    );
};

export default InsightScoreRank;
