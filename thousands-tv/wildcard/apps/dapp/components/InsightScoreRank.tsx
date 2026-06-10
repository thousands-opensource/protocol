import React from "react";
import { Flex, Text, HStack, Badge, Icon, FlexProps } from "@chakra-ui/react";
import { FaTrophy, FaRocket } from "react-icons/fa";
import { useInsightScoreLeaderboard } from "@/hooks/userInsightScores/useInsightScoreLeaderboard";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { useRouter } from "next/router";

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
    const router = useRouter();

    const { getUserEntry, getRankBadgeColor } = useInsightScoreLeaderboard({
        limit: 10,
        fetchLeaderboard: false
    });

    const { serverCode } = router.query as { serverCode: string };
    const toLeaderboard = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.FORECASTS.LEADERBOARD.url,
        { serverCode }
    );

    const userEntry = getUserEntry(userId);

    if (!userEntry) return null;

    const isOnLeaderboard = router.asPath.includes('/forecasts') && router.asPath.includes('tab=leaderboard');

    const defaultFlexProps: FlexProps = {
        flexDirection: smallVersion ? "row" : "column",
        gap: smallVersion ? 2 : 1,
        align: smallVersion ? "center" : "stretch",
        ...flexProps
    };

    const handleClick = !isOnLeaderboard ? () => router.push(toLeaderboard) : undefined;

    return (
        <Flex
            {...defaultFlexProps}
            onClick={handleClick}
            cursor={!isOnLeaderboard ? "pointer" : "default"}
        >
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