import React from "react";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Badge,
    Skeleton,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    VStack,
    HStack,
    Flex,
    Icon,
    Tooltip,
} from "@chakra-ui/react";
import { useInsightScoreLeaderboard } from "@/hooks/userInsightScores/useInsightScoreLeaderboard";
import { LeaderboardEntry } from "@/pages/api/userInsightScores/getInsightScoreLeaderboard";
import {
    FaTrophy,
    FaMedal,
    FaFire,
    FaBullseye,
    FaRocket,
} from "react-icons/fa";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

interface InsightScoreLeaderboardProps {
    limit?: number;
    showRankIcons?: boolean;
}

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1:
            return { icon: FaTrophy, color: "gold" };
        case 2:
            return { icon: FaMedal, color: "silver" };
        case 3:
            return { icon: FaMedal, color: "#CD7F32" };
        default:
            return null;
    }
};

const getScoreBadgeColor = (score: number) => {
    if (score >= 1000) return "purple";
    if (score >= 500) return "green";
    if (score >= 250) return "blue";
    if (score >= 100) return "orange";
    return "gray";
};

const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 80) return "green";
    if (accuracy >= 70) return "blue";
    if (accuracy >= 60) return "orange";
    return "red";
};

export const InsightScoreLeaderboard = ({
    limit = 10,
    showRankIcons = true
}: InsightScoreLeaderboardProps) => {
    const { leaderboard, currentUserEntry, loading, error } = useInsightScoreLeaderboard({ limit });
    const { userDB } = useWildfileUserContext();

    if (loading) {
        return (
            <VStack spacing={4} w="full">
                <Flex justify="center" align="center" gap={2}>
                    <Icon as={FaRocket} color="purple.400" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="white">
                        Insight Score Leaderboard
                    </Text>
                </Flex>
                <Box w="full">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} height="60px" mb={2} />
                    ))}
                </Box>
            </VStack>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                    <AlertTitle>Error loading leaderboard!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Box>
            </Alert>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                    <AlertTitle>No data available</AlertTitle>
                    <AlertDescription>
                        No insight scores have been calculated yet. Make some
                        forecasts and wait for them to resolve!
                    </AlertDescription>
                </Box>
            </Alert>
        );
    }

    return (
        <VStack spacing={6} w="full" align="stretch">
            <Flex justify="center" align="center" gap={2}>
                <Icon as={FaRocket} color="purple.400" boxSize={8} />
                <Text fontSize="2xl" fontWeight="bold" color="white">
                    Insight Score Leaderboard
                </Text>
            </Flex>

            <Box
                borderRadius="lg"
                overflow="hidden"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.200"
            >
                <Table variant="simple" size="md">
                    <Thead bg="whiteAlpha.100">
                        <Tr>
                            <Th color="white" fontSize="sm">
                                Rank
                            </Th>
                            <Th color="white" fontSize="sm">
                                User
                            </Th>
                            <Th color="white" fontSize="sm" isNumeric>
                                <Tooltip label="Total points earned from forecasts">
                                    <Text cursor="help">Score</Text>
                                </Tooltip>
                            </Th>
                            <Th color="white" fontSize="sm" isNumeric>
                                <Tooltip label="Percentage of correct forecasts">
                                    <Text cursor="help">Accuracy</Text>
                                </Tooltip>
                            </Th>
                            <Th color="white" fontSize="sm" isNumeric>
                                <Tooltip label="Total number of forecasts made">
                                    <Text cursor="help">Forecasts</Text>
                                </Tooltip>
                            </Th>
                            <Th color="white" fontSize="sm" isNumeric>
                                <Tooltip label="Longest streak of correct forecasts">
                                    <Text cursor="help">Best Streak</Text>
                                </Tooltip>
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {leaderboard.map((entry: LeaderboardEntry) => {
                            const rankIcon = showRankIcons
                                ? getRankIcon(entry.rank)
                                : null;
                            const isCurrentUser =
                                userDB?._id?.toString() === entry.userId;

                            return (
                                <Tr
                                    key={entry.userId}
                                    _hover={{ bg: "whiteAlpha.50" }}
                                    transition="background-color 0.2s"
                                    bg={
                                        isCurrentUser
                                            ? "blue.800"
                                            : "transparent"
                                    }
                                    borderLeft={
                                        isCurrentUser ? "4px solid" : "none"
                                    }
                                    borderLeftColor={
                                        isCurrentUser
                                            ? "blue.400"
                                            : "transparent"
                                    }
                                    position="relative"
                                >
                                    <Td>
                                        <HStack spacing={2}>
                                            {rankIcon ? (
                                                <Icon
                                                    as={rankIcon.icon}
                                                    color={rankIcon.color}
                                                    boxSize={5}
                                                />
                                            ) : null}
                                            <Text
                                                color="white"
                                                fontWeight={
                                                    entry.rank <= 3
                                                        ? "bold"
                                                        : "normal"
                                                }
                                                fontSize={
                                                    entry.rank <= 3
                                                        ? "lg"
                                                        : "md"
                                                }
                                            >
                                                {entry.rank}
                                            </Text>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            <Text
                                                color="white"
                                                fontWeight="medium"
                                                fontSize="md"
                                                noOfLines={1}
                                            >
                                                {entry.displayName +
                                                    (isCurrentUser
                                                        ? " (You)"
                                                        : "")}
                                            </Text>
                                            {entry.currentStreak > 0 && (
                                                <Tooltip
                                                    label="Current consecutive correct calls"
                                                    placement="top"
                                                    hasArrow
                                                    closeDelay={500}
                                                >
                                                    <HStack spacing={1}>
                                                        <Icon
                                                            as={FaFire}
                                                            color="orange.400"
                                                            boxSize={3}
                                                        />
                                                        <Text
                                                            color="orange.400"
                                                            fontSize="xs"
                                                        >
                                                            {
                                                                entry.currentStreak
                                                            }{" "}
                                                            streak
                                                        </Text>
                                                    </HStack>
                                                </Tooltip>
                                            )}
                                        </VStack>
                                    </Td>
                                    <Td isNumeric>
                                        <Badge
                                            colorScheme={getScoreBadgeColor(
                                                entry.totalInsightScore
                                            )}
                                            variant="solid"
                                            fontSize="sm"
                                            px={3}
                                            py={1}
                                            borderRadius="md"
                                        >
                                            {entry.totalInsightScore.toLocaleString()}
                                        </Badge>
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-end" spacing={2}>
                                            <Badge
                                                colorScheme={getAccuracyBadgeColor(
                                                    entry.accuracyPercentage
                                                )}
                                                variant="solid"
                                                fontSize="sm"
                                                px={3}
                                                py={1}
                                                borderRadius="md"
                                            >
                                                {entry.accuracyPercentage.toFixed(
                                                    1
                                                )}
                                                %
                                            </Badge>
                                            <Icon
                                                as={FaBullseye}
                                                color="gray.400"
                                                boxSize={3}
                                            />
                                        </HStack>
                                    </Td>
                                    <Td isNumeric>
                                        <VStack spacing={0} align="end">
                                            <Text
                                                color="white"
                                                fontWeight="medium"
                                            >
                                                {entry.totalPredictions}
                                            </Text>
                                            <Text
                                                color="gray.400"
                                                fontSize="xs"
                                            >
                                                {entry.correctPredictions}W/
                                                {entry.totalPredictions -
                                                    entry.correctPredictions}
                                                L
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-end" spacing={2}>
                                            <Text
                                                color={
                                                    entry.bestStreak >= 5
                                                        ? "green.400"
                                                        : "white"
                                                }
                                                fontWeight={
                                                    entry.bestStreak >= 5
                                                        ? "bold"
                                                        : "normal"
                                                }
                                            >
                                                {entry.bestStreak}
                                            </Text>
                                            {entry.bestStreak >= 5 && (
                                                <Icon
                                                    as={FaFire}
                                                    color="green.400"
                                                    boxSize={3}
                                                />
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            );
                        })}

                        {currentUserEntry && !leaderboard.some(entry => entry.userId === currentUserEntry.userId) && (
                            <>
                                <Tr>
                                    <Td colSpan={6} p={2}>
                                        <Box h="1px" bg="gray.600" w="full" />
                                    </Td>
                                </Tr>
                                <Tr
                                    key={currentUserEntry.userId}
                                    bg="whiteAlpha.100"
                                    _hover={{ bg: "whiteAlpha.150" }}
                                    transition="background-color 0.2s"
                                    borderLeft="3px solid"
                                    borderLeftColor="blue.400"
                                >
                                    <Td>
                                        <HStack spacing={2}>
                                            <Text
                                                color="blue.400"
                                                fontWeight="bold"
                                                fontSize="md"
                                            >
                                                {currentUserEntry.rank}
                                            </Text>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            <HStack>
                                                <Text
                                                    color="blue.400"
                                                    fontWeight="bold"
                                                    fontSize="md"
                                                    noOfLines={1}
                                                >
                                                    {
                                                        currentUserEntry.displayName
                                                    }
                                                </Text>
                                                <Text
                                                    color="blue.400"
                                                    fontSize="xs"
                                                >
                                                    (You)
                                                </Text>
                                            </HStack>
                                            {currentUserEntry.currentStreak >
                                                0 && (
                                                    <Tooltip
                                                        label="Current consecutive correct forecasts (only shown if last forecast was correct)"
                                                        placement="top"
                                                        hasArrow
                                                        closeDelay={500}
                                                    >
                                                        <HStack spacing={1}>
                                                            <Icon
                                                                as={FaFire}
                                                                color="orange.400"
                                                                boxSize={3}
                                                            />
                                                            <Text
                                                                color="orange.400"
                                                                fontSize="xs"
                                                            >
                                                                {
                                                                    currentUserEntry.currentStreak
                                                                }{" "}
                                                                streak
                                                            </Text>
                                                        </HStack>
                                                    </Tooltip>
                                                )}
                                        </VStack>
                                    </Td>
                                    <Td isNumeric>
                                        <Badge
                                            colorScheme={getScoreBadgeColor(
                                                currentUserEntry.totalInsightScore
                                            )}
                                            variant="solid"
                                            fontSize="sm"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                        >
                                            {currentUserEntry.totalInsightScore.toLocaleString()}
                                        </Badge>
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-end" spacing={2}>
                                            <Badge
                                                colorScheme={getAccuracyBadgeColor(currentUserEntry.accuracyPercentage)}
                                                variant="solid"
                                                fontSize="sm"
                                                px={2}
                                                py={1}
                                                borderRadius="md"
                                            >
                                                {currentUserEntry.accuracyPercentage.toFixed(1)}%
                                            </Badge>
                                            <Icon as={FaBullseye} color="gray.400" boxSize={3} />
                                        </HStack>
                                    </Td>
                                    <Td isNumeric>
                                        <VStack spacing={0} align="end">
                                            <Text color="white" fontWeight="medium">
                                                {currentUserEntry.totalPredictions}
                                            </Text>
                                            <Text color="gray.400" fontSize="xs">
                                                {currentUserEntry.correctPredictions}W/{currentUserEntry.totalPredictions - currentUserEntry.correctPredictions}L
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td isNumeric>
                                        <HStack spacing={1} justify="flex-end">
                                            <Text
                                                color="white"
                                                fontSize="md"
                                                fontWeight={
                                                    currentUserEntry.bestStreak >=
                                                        5
                                                        ? "bold"
                                                        : "normal"
                                                }
                                            >
                                                {currentUserEntry.bestStreak}
                                            </Text>
                                            {currentUserEntry.bestStreak >=
                                                5 && (
                                                    <Icon
                                                        as={FaFire}
                                                        color="green.400"
                                                        boxSize={3}
                                                    />
                                                )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            </>
                        )}
                    </Tbody>
                </Table>
            </Box>

            {leaderboard.length === limit && (
                <Text color="gray.400" fontSize="sm" textAlign="center">
                    Showing top {limit} users
                </Text>
            )}
        </VStack>
    );
};

