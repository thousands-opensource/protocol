import {
    Box,
    Text,
    VStack,
    HStack,
    Spinner,
    Center,
    Button,
    Flex,
    Badge,
    Select,
} from "@chakra-ui/react";
import { useUserPredictions } from "@/hooks/useRallyPredictions";
import { RepeatIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useRouter } from "next/router";

const UserPredictionsList = () => {
    const { predictions, loading, error, refetch } = useUserPredictions();
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const router = useRouter();

    if (loading) {
        return (
            <Center py={10}>
                <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.600"
                    color="purple.500"
                    size="xl"
                />
            </Center>
        );
    }

    if (error) {
        return (
            <Box textAlign="center" py={10}>
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
            <Box textAlign="center" py={10}>
                <Text color="gray.400" fontSize="lg">
                    You have not made any calls yet.
                </Text>
                <Text color="gray.500" fontSize="sm" mt={2}>
                    Start by making a call on available forecasts
                </Text>
            </Box>
        );
    }

    const handlePredictionClick = (predictionId: string) => {
        const { serverCode } = router.query;
        router.push(`/${serverCode}/forecasts/${predictionId}`);
    };

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
        return amount < 1 ? "FREE" : amount.toLocaleString();
    };

    // Group predictions by rallyPredictionId for statistics
    const groupedPredictions = predictions.reduce((acc, prediction) => {
        const key = prediction.rallyPredictionId.toString();
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(prediction);
        return acc;
    }, {} as Record<string, typeof predictions>);

    return (
        <Box w="full" px={4}>
            <Box mb={6}>
                <Flex 
                    direction={{ base: "column", md: "row" }}
                    justify="space-between" 
                    align={{ base: "stretch", md: "center" }}
                    mb={4}
                    gap={{ base: 3, md: 0 }}
                >
                    <Box>
                        <Text color="white" fontSize="xl" fontWeight="bold">
                            Your Calls
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                            Total: {predictions.length} call
                            {predictions.length !== 1 ? "s" : ""} across{" "}
                            {Object.keys(groupedPredictions).length} forecast
                            {Object.keys(groupedPredictions).length !== 1
                                ? "s"
                                : ""}
                        </Text>
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
                        const potentialReturn = Math.round(
                            prediction.amount * (1 / prediction.price)
                        );
                        return (
                            <Flex
                                direction={{ base: "column", sm: "row" }}
                                justify="space-between"
                                align={{ base: "stretch", sm: "center" }}
                                gap={3}
                                key={prediction._id?.toString()}
                                bg="whiteAlpha.100"
                                borderRadius="md"
                                p={4}
                                transition="all 0.2s"
                                cursor="pointer"
                                onClick={() =>
                                    handlePredictionClick(
                                        prediction.rallyPredictionId.toString()
                                    )
                                }
                                _hover={{
                                    bg: "whiteAlpha.200",
                                    transform: "translateX(2px)",
                                }}                                
                            >
                                <Flex
                                    sx={{
                                        flexDirection: "column",
                                        justifyContent: "flex-start",
                                    }}
                                    direction={{ base: "column", sm: "row" }}
                                    gap={{ base: 2, sm: 4 }}
                                    flex="1" 
                                    minW="0"                                    
                                >
                                    <Box
                                        id="question-text"
                                        sx={{
                                            fontSize: "18px",
                                        }}
                                    >
                                        {prediction.questionText}
                                    </Box>
                                    <Flex
                                        direction={{ base: "column", sm: "row" }}
                                        gap={{ base: 2, sm: 4 }}
                                        flex="1" 
                                        minW="0"
                                        align={{ base: "start", sm: "center" }}
                                    >                                        
                                        <Badge
                                            bgColor={
                                                prediction.selectedOptionColor
                                            }
                                            fontSize="sm"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                        >
                                            {prediction.selectedOptionText}
                                        </Badge>                                        
                                        <Box>
                                            <Text
                                                fontSize="xs"
                                                color="gray.400"
                                            >
                                                Credits
                                            </Text>
                                            <Text
                                                fontSize="sm"
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
                                                fontSize="sm"
                                                color="white"
                                                fontWeight="bold"
                                            >
                                                {formatPrice(
                                                    prediction.price
                                                )}
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
                                                fontSize="sm"
                                                color="purple.300"
                                                fontWeight="bold"
                                            >
                                                {formatAmount(
                                                    potentialReturn
                                                )}
                                            </Text>
                                        </Box>                                        
                                    </Flex>
                                </Flex>
                                <Text fontSize="xs" color="gray.300">
                                    {formatDate(prediction.createdAt)}
                                </Text>
                            </Flex>
                        );
                    })}
            </VStack>
        </Box>
    );
};

export default UserPredictionsList;
