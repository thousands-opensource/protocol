import { Avatar, Box, Flex, Stack, Text } from "@chakra-ui/react";
import { FiArrowDown, FiArrowUp, FiMinus } from "react-icons/fi";
import { shorten } from "@/utils/util";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";

export interface FranchiseEntry {
    rank: number;
    userId: string;
    earnings: number;
    previousRank?: number | null;
    walletProvider?: {
        address?: string;
        pfp?: {
            imageUrl?: string;
        };
    };
    preferences?: {
        displayName?: string;
        activePfpImageUrl?: string;
    };
}

interface FranchiseIndexLeaderboardProps {
    leaderboard: FranchiseEntry[];
    currentUserId?: string;
    onSelect: (userId: string) => void;
    limit?: number;
    isLoading?: boolean;
}

const FranchiseIndexLeaderboard = ({
    leaderboard,
    currentUserId,
    onSelect,
    limit,
    isLoading = false,
}: FranchiseIndexLeaderboardProps) => {
    if (isLoading) {
        return null;
    }

    const normalizedCurrentUserId = currentUserId?.toLowerCase() ?? "";
    const maxNonMyRows =
        typeof limit === "number" ? Math.max(limit, 0) : undefined;
    let nonMyRowsCount = 0;

    const visibleRows =
        typeof maxNonMyRows === "number"
            ? leaderboard.filter((entry) => {
                  const isMyRow =
                      normalizedCurrentUserId &&
                      entry.userId?.toLowerCase() ===
                          normalizedCurrentUserId;
                  if (isMyRow) {
                      return true;
                  }

                  if (nonMyRowsCount < maxNonMyRows) {
                      nonMyRowsCount += 1;
                      return true;
                  }

                  return false;
              })
            : leaderboard;

    if (visibleRows.length === 0) {
        return (
            <Text color="whiteAlpha.800" textAlign="center">
                No franchise activity yet. Check back after the next competition!
            </Text>
        );
    }

    const getFranchiseLabel = (entry: FranchiseEntry) => {
        const displayName = entry.preferences?.displayName?.trim();
        if (displayName) {
            return displayName;
        }

        const address = entry.walletProvider?.address;
        if (address) {
            return shorten(address, { isAddress: true });
        }

        return shorten(entry.userId, { length: 12 });
    };

    const getWalletAddressLabel = (entry: FranchiseEntry) => {
        const address = entry.walletProvider?.address;
        if (address) {
            return shorten(address, { isAddress: true });
        }

        return "";
    };

    const getRankDelta = (entry: FranchiseEntry) => {
        if (typeof entry.previousRank !== "number") {
            return null;
        }
        if (!Number.isFinite(entry.rank)) {
            return null;
        }
        return entry.previousRank - entry.rank;
    };

    return (
        <Stack spacing={4}>
            {visibleRows.map((entry) => {
                const isMyRow =
                    normalizedCurrentUserId &&
                    entry.userId?.toLowerCase() === normalizedCurrentUserId;
                const rankDelta = getRankDelta(entry);
                return (
                    <Flex
                        key={entry.rank}
                        align="center"
                        justify="space-between"
                        px={4}
                        py={3}
                        borderRadius="lg"
                        bg={
                            isMyRow
                                ? "rgba(255,255,255,0.4)"
                                : "rgba(255,255,255,0.08)"
                        }
                        border="1px solid"
                        borderColor={
                            isMyRow
                                ? "rgba(255,255,255,0.85)"
                                : "rgba(255,255,255,0.1)"
                        }
                        boxShadow={
                            isMyRow
                                ? "0 0 0 2px rgba(255,255,255,0.5), 0 12px 28px rgba(255,255,255,0.18)"
                                : "none"
                        }
                        cursor="pointer"
                        onClick={() => onSelect(entry.userId)}
                        _hover={{
                            bg: isMyRow
                                ? "rgba(255,255,255,0.5)"
                                : "rgba(255,255,255,0.15)",
                            borderColor: isMyRow
                                ? "rgba(255,255,255,1)"
                                : "rgba(255,255,255,0.25)",
                        }}
                    >
                        <Flex align="center" gap={4}>
                            <Box
                                minW="54px"
                                textAlign="center"
                                fontWeight="bold"
                                fontSize="lg"
                                color="white"
                            >
                                #{entry.rank}
                            </Box>
                            <Avatar
                                size="sm"
                                src={
                                    entry.walletProvider?.pfp?.imageUrl ||
                                    Silhoutte.src
                                }
                                name={getFranchiseLabel(entry)}
                            />
                            <Stack spacing={0}>
                                <Text color="white" fontSize="md">
                                    {getFranchiseLabel(entry)}
                                </Text>
                                <Text fontSize="sm" color="whiteAlpha.700">
                                    Wallet: {getWalletAddressLabel(entry)}
                                </Text>
                            </Stack>
                        </Flex>
                        {rankDelta === null ? (
                            <Flex
                                align="center"
                                gap={1}
                                color="whiteAlpha.600"
                                minW="72px"
                                justify="flex-end"
                            >
                                <FiMinus />
                            </Flex>
                        ) : rankDelta > 0 ? (
                            <Flex
                                align="center"
                                gap={2}
                                color="green.300"
                                fontWeight="semibold"
                                minW="72px"
                                justify="flex-end"
                            >
                                <FiArrowUp />
                                <Text fontSize="sm">
                                    {rankDelta}
                                </Text>
                            </Flex>
                        ) : rankDelta < 0 ? (
                            <Flex
                                align="center"
                                gap={2}
                                color="red.300"
                                fontWeight="semibold"
                                minW="72px"
                                justify="flex-end"
                            >
                                <FiArrowDown />
                                <Text fontSize="sm">
                                    {Math.abs(rankDelta)}
                                </Text>
                            </Flex>
                        ) : (
                            <Flex
                                align="center"
                                gap={1}
                                color="whiteAlpha.600"
                                minW="72px"
                                justify="flex-end"
                            >
                                <FiMinus />
                            </Flex>
                        )}
                        {/*}
                        <Text
                            fontSize="xl"
                            fontWeight="semibold"
                            color="white"
                        >
                            {entry.rank > 0 ? `${entry.rank}` : "N/A"}
                        </Text>
                        */}
                    </Flex>
                );
            })}
        </Stack>
    );
};

export default FranchiseIndexLeaderboard;
