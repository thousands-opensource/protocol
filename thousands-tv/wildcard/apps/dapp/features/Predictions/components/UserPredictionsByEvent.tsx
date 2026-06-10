import {
    Box,
    Text,
    VStack,
    HStack,
    Spinner,
    Center,
    Button,
    Flex,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    Badge,
    Select,
} from "@chakra-ui/react";
import { useUserPredictionsByEvent } from "@/hooks/useRallyPredictions";
import { RepeatIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { IUserRallyPrediction } from "@repo/interfaces";

interface UserPredictionsByEventProps {
    predictions: IUserRallyPrediction[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    rallyPredictionTitle?: string;
    rallyATeam: string;
    rallyBTeam: string;
    rallyATeamColor: string;
    rallyBTeamColor: string;
}

const UserPredictionsByEvent = ({
    rallyPredictionTitle,
    rallyATeam,
    rallyBTeam,
    rallyATeamColor,
    rallyBTeamColor,
    predictions,
    loading,
    error,
    refetch,
}: UserPredictionsByEventProps) => {
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    if (loading) {
        return (
            <Center py={8}>
                <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.600"
                    color="purple.500"
                    size="lg"
                />
            </Center>
        );
    }

    if (error) {
        return (
            <Box textAlign="center" py={8}>
                <Text color="red.400" mb={4}>
                    Error: {error}
                </Text>
                <Button
                    leftIcon={<RepeatIcon />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={refetch}
                    size="sm"
                >
                    Retry
                </Button>
            </Box>
        );
    }

    if (predictions.length === 0) {
        return (
            <Box textAlign="center" py={8} bg="whiteAlpha.50" borderRadius="md">
                <Text color="gray.400" fontSize="md">
                    You have not made any calls for this forecast yet
                </Text>
            </Box>
        );
    }

    // Calculate statistics
    const totalAmount = predictions.reduce((sum, pred) => sum + pred.amount, 0);
    const forPredictions = predictions.filter((p) => p.forOrAgainst);
    const againstPredictions = predictions.filter((p) => !p.forOrAgainst);
    const avgPrice =
        predictions.reduce((sum, pred) => sum + pred.price, 0) /
        predictions.length;

    return (
        <Box w="full">
            <Box mb={6}>
                <Flex 
                    direction={{ base: "column", md: "row" }}
                    justify="space-between" 
                    align={{ base: "stretch", md: "center" }}
                    mb={4}
                    gap={{ base: 3, md: 0 }}
                >
                    <Box>
                        <Text color="white" fontSize={{ base: "md", md: "lg" }} fontWeight="bold">
                            Your Calls for This Forecast
                        </Text>
                        {rallyPredictionTitle && (
                            <Text color="gray.400" fontSize="sm">
                                {rallyPredictionTitle}
                            </Text>
                        )}
                    </Box>
                    <Flex 
                        direction={{ base: "row", md: "row" }}
                        gap={2}
                        width={{ base: "full", md: "auto" }}
                    >
                        <Select
                            size="sm"
                            value={sortOrder}
                            onChange={(e) =>
                                setSortOrder(
                                    e.target.value as "latest" | "oldest"
                                )
                            }
                            bg="whiteAlpha.100"
                            borderColor="whiteAlpha.300"
                            color="white"
                            width={{ base: "full", md: "150px" }}
                            flex={{ base: "1", md: "initial" }}
                            _hover={{ borderColor: "whiteAlpha.400" }}
                        >
                            <option
                                value="latest"
                                style={{ background: "#2D3748" }}
                            >
                                Latest First
                            </option>
                            <option
                                value="oldest"
                                style={{ background: "#2D3748" }}
                            >
                                Oldest First
                            </option>
                        </Select>
                        <Button
                            leftIcon={<RepeatIcon />}
                            colorScheme="purple"
                            variant="ghost"
                            onClick={refetch}
                            size="sm"
                        >
                            Refresh
                        </Button>
                    </Flex>
                </Flex>

                <Flex 
                    direction={{ base: "column", sm: "row" }}
                    wrap={{ base: "nowrap", sm: "wrap" }}
                    gap={{ base: 3, md: 6 }}
                    mb={6}
                >
                    <Stat 
                        bg="whiteAlpha.100" 
                        p={3} 
                        borderRadius="md"
                        flex={{ base: "1 1 48%", md: "0 1 auto" }}
                        minW={{ base: "0", md: "120px" }}
                    >
                        <StatLabel color="gray.400" fontSize="xs">
                            Total Calls
                        </StatLabel>
                        <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
                            {predictions.length}
                        </StatNumber>
                    </Stat>
                    <Stat 
                        bg="whiteAlpha.100" 
                        p={3} 
                        borderRadius="md"
                        flex={{ base: "1 1 48%", md: "0 1 auto" }}
                        minW={{ base: "0", md: "120px" }}
                    >
                        <StatLabel color="gray.400" fontSize="xs">
                            Total Amount
                        </StatLabel>
                        <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
                            {totalAmount.toLocaleString()}
                        </StatNumber>
                    </Stat>
                    <Stat 
                        bg="whiteAlpha.100" 
                        p={3} 
                        borderRadius="md" 
                        h={{ base: "auto", md: "69px" }}
                        flex={{ base: "1 1 48%", md: "0 1 auto" }}
                        minW={{ base: "0", md: "150px" }}
                    >
                        <StatLabel color="gray.400" fontSize="xs">
                            Call
                        </StatLabel>
                        <StatNumber fontSize={{ base: "xs", md: "sm" }}>
                            <Text color={rallyATeamColor} as="span">
                                {againstPredictions.length} {rallyATeam}
                            </Text>
                            <Text color="gray.400" as="span">
                                {" "}
                                /{" "}
                            </Text>
                            <Text color={rallyBTeamColor} as="span">
                                {forPredictions.length} {rallyBTeam}
                            </Text>
                        </StatNumber>
                    </Stat>
                    <Stat 
                        bg="whiteAlpha.100" 
                        p={3} 
                        borderRadius="md"
                        flex={{ base: "1 1 48%", md: "0 1 auto" }}
                        minW={{ base: "0", md: "120px" }}
                    >
                        <StatLabel color="gray.400" fontSize="xs">
                            Conviction
                        </StatLabel>
                        <StatNumber color="white" fontSize={{ base: "md", md: "lg" }}>
                            {avgPrice.toFixed(2)}
                        </StatNumber>
                    </Stat>
                </Flex>
            </Box>

            <VStack spacing={3} align="stretch">
                {/* Sort predictions based on selected order */}
                {[...predictions]
                    .sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0).getTime();
                        const dateB = new Date(b.createdAt || 0).getTime();
                        return sortOrder === "latest"
                            ? dateB - dateA
                            : dateA - dateB;
                    })
                    .map((prediction) => {
                        const formatDate = (date: Date | undefined) => {
                            if (!date) return "N/A";
                            return new Date(date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                        };

                        const formatPrice = (price: number) => {
                            return `${price.toFixed(2)}`;
                        };

                        const formatAmount = (amount: number) => {
                            return amount < 1 ? "FREE" : amount.toLocaleString()
                        };

                        const potentialReturn = Math.round(
                            prediction.amount * (1 / prediction.price)
                        );

                        return (
                            <Box
                                key={prediction._id?.toString()}
                                bg="whiteAlpha.100"
                                borderRadius="md"
                                p={4}
                                transition="all 0.2s"
                                _hover={{
                                    bg: "whiteAlpha.200",
                                    transform: "translateX(2px)",
                                }}
                            >
                                <Flex
                                    direction={{ base: "column", sm: "row" }}
                                    justify="space-between"
                                    align={{ base: "stretch", sm: "center" }}
                                    gap={3}
                                >
                                    <Flex 
                                        direction={{ base: "column", sm: "row" }}
                                        gap={{ base: 2, sm: 4 }}
                                        flex="1" 
                                        minW="0"
                                        align={{ base: "start", sm: "center" }}
                                    >
                                        <Badge
                                            bgColor={
                                                prediction.forOrAgainst
                                                    ? rallyBTeamColor
                                                    : rallyATeamColor
                                            }
                                            fontSize="sm"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                        >
                                            {prediction.forOrAgainst
                                                ? rallyBTeam
                                                : rallyATeam}
                                        </Badge>

                                        <Flex 
                                            direction={{ base: "row", sm: "row" }}
                                            gap={{ base: 3, sm: 4 }}
                                            flex="1"
                                        >
                                            <Box>
                                                <Text
                                                    fontSize="xs"
                                                    color="gray.400"
                                                >
                                                    Credits
                                                </Text>
                                                <Text
                                                    fontSize={{ base: "xs", sm: "sm" }}
                                                    color="white"
                                                    fontWeight="bold"
                                                >
                                                    {formatAmount(
                                                        prediction.amount
                                                    )}
                                                </Text>
                                            </Box>

                                            <Box>
                                                <Text
                                                    fontSize="xs"
                                                    color="gray.400"
                                                >
                                                    Conviction
                                                </Text>
                                                <Text
                                                    fontSize={{ base: "xs", sm: "sm" }}
                                                    color="white"
                                                    fontWeight="bold"
                                                >
                                                    {formatPrice(prediction.price)}
                                                </Text>
                                            </Box>

                                            <Box>
                                                <Text
                                                    fontSize="xs"
                                                    color="gray.400"
                                                >
                                                    Potential
                                                </Text>
                                                <Text
                                                    fontSize={{ base: "xs", sm: "sm" }}
                                                    color="purple.300"
                                                    fontWeight="bold"
                                                >
                                                    {formatAmount(potentialReturn)}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    </Flex>

                                    <Text fontSize="xs" color="gray.300" flexShrink={0}>
                                        {formatDate(prediction.createdAt)}
                                    </Text>
                                </Flex>
                            </Box>
                        );
                    })}
            </VStack>
        </Box>
    );
};

export default UserPredictionsByEvent;
