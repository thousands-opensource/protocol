import {
    Box,
    Text,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Heading,
    Badge,
    VStack,
    HStack,
    Skeleton,
    Alert,
    AlertIcon,
    useColorModeValue,
    Divider,
} from "@chakra-ui/react";
import { useClosedForecastStats } from "@/hooks/useClosedForecastStats";

interface ClosedForecastStatsProps {
    rallyPredictionId: string;
    optionAText: string;
    optionBText: string;
    optionAColor: string;
    optionBColor: string;
}

const ClosedForecastStats = ({
    rallyPredictionId,
    optionAText,
    optionBText,
    optionAColor,
    optionBColor,
}: ClosedForecastStatsProps) => {
    const cardBg = useColorModeValue("whiteAlpha.300", "whiteAlpha.200");
    const statBg = useColorModeValue("whiteAlpha.200", "whiteAlpha.100");
    
    const { stats, loading, error } = useClosedForecastStats(rallyPredictionId);

    if (loading) {
        return (
            <Box
                bg={cardBg}
                p={{ base: 4, md: 6 }}
                borderRadius="lg"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
            >
                <VStack spacing={4} align="stretch">
                    <Skeleton height="40px" />
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        gap={4}
                    >
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} height="80px" />
                        ))}
                    </Grid>
                </VStack>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error" bg={cardBg} borderRadius="lg">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    if (!stats) {
        return null; // Don't render anything if forecast is not closed
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    const renderAwaitingWinnerOverlay = () => (
        <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.800"
            backdropFilter="blur(8px)"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={10}
        >
            <VStack spacing={4}>
                <Heading size="md" color="white" textAlign="center">
                    Forecast Ended
                </Heading>
                <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                    Awaiting winner declaration
                </Text>
            </VStack>
        </Box>
    );

    const renderWinnerBadge = () => {
        if (!stats.winnerText) return null;

        return (
            <Box textAlign="center">
                <Text color="whiteAlpha.800" fontSize="sm" mb={2}>
                    Winner
                </Text>
                <Badge
                    bg={stats.resolvedChoice ? optionBColor : optionAColor}
                    color="white"
                    fontSize="md"
                    px={4}
                    py={2}
                    borderRadius="full"
                >
                    {stats.winnerText}
                </Badge>
            </Box>
        );
    };

    const renderStatisticsGrid = () => (
        <Grid
            templateColumns={{
                base: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
            }}
            gap={4}
        >
            {/* Correct Calls */}
            <GridItem>
                <Stat bg={statBg} p={4} borderRadius="md" height="100%">
                    <StatLabel color="whiteAlpha.700" fontSize="xs">
                        Correct Calls
                    </StatLabel>
                    <StatNumber color="green.300" fontSize="xl">
                        {stats.correctCalls}
                    </StatNumber>
                </Stat>
            </GridItem>

            {/* Incorrect Calls */}
            <GridItem>
                <Stat bg={statBg} p={4} borderRadius="md" height="100%">
                    <StatLabel color="whiteAlpha.700" fontSize="xs">
                        Incorrect Calls
                    </StatLabel>
                    <StatNumber color="red.300" fontSize="xl">
                        {stats.incorrectCalls}
                    </StatNumber>
                </Stat>
            </GridItem>

            {/* Total WC Pool */}
            <GridItem>
                <Stat bg={statBg} p={4} borderRadius="md" height="100%">
                    <StatLabel color="whiteAlpha.700" fontSize="xs">
                        Total $WC Pool
                    </StatLabel>
                    <StatNumber color="yellow.300" fontSize="xl">
                        {formatNumber(stats.totalWCEarned)}
                    </StatNumber>
                    <StatHelpText color="whiteAlpha.600" fontSize="xs" mt={1}>
                        earned
                    </StatHelpText>
                </Stat>
            </GridItem>

            {/* Duration */}
            <GridItem>
                <Stat bg={statBg} p={4} borderRadius="md" height="100%">
                    <StatLabel color="whiteAlpha.700" fontSize="xs">
                        Duration
                    </StatLabel>
                    <StatNumber color="blue.300" fontSize="xl">
                        {stats.duration}
                    </StatNumber>
                    <StatHelpText color="whiteAlpha.600" fontSize="xs" mt={1}>
                        days
                    </StatHelpText>
                </Stat>
            </GridItem>

            {/* Largest Correct Call */}
            <GridItem>
                <Stat bg={statBg} p={4} borderRadius="md" height="100%">
                    <StatLabel color="whiteAlpha.700" fontSize="xs">
                        Largest Correct Call
                    </StatLabel>
                    <StatNumber color="green.300" fontSize="xl">
                        {formatNumber(stats.largestCorrectCall)}
                    </StatNumber>
                    <StatHelpText color="whiteAlpha.600" fontSize="xs" mt={1}>
                        credits
                    </StatHelpText>
                </Stat>
            </GridItem>

            {/* Largest Incorrect Call */}
            <GridItem>
                <Stat bg={statBg} p={4} borderRadius="md" height="100%">
                    <StatLabel color="whiteAlpha.700" fontSize="xs">
                        Largest Incorrect Call
                    </StatLabel>
                    <StatNumber color="red.300" fontSize="xl">
                        {formatNumber(stats.largestIncorrectCall)}
                    </StatNumber>
                    <StatHelpText color="whiteAlpha.600" fontSize="xs" mt={1}>
                        credits
                    </StatHelpText>
                </Stat>
            </GridItem>
        </Grid>
    );

    const renderDateRange = () => (
        <Box bg={statBg} p={4} borderRadius="md">
            <HStack justify="space-between" wrap="wrap" spacing={4}>
                <VStack align="start" spacing={1}>
                    <Text color="whiteAlpha.700" fontSize="xs">
                        Start Date
                    </Text>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                        {formatDate(stats.startDate)}
                    </Text>
                </VStack>
                <VStack align="end" spacing={1}>
                    <Text color="whiteAlpha.700" fontSize="xs">
                        End Date
                    </Text>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                        {formatDate(stats.endDate)}
                    </Text>
                </VStack>
            </HStack>
        </Box>
    );

    const renderForecastContent = () => {
        const isAwaitingWinner = stats.resolvedChoice === null || stats.resolvedChoice === undefined;

        return (
            <>
                {isAwaitingWinner && renderAwaitingWinnerOverlay()}
                
                <VStack spacing={6} align="stretch">
                    {/* Header Section */}
                    <VStack spacing={3}>
                        <Box w="100%" textAlign={{ base: "center", md: "left" }}>
                            <Heading size="md" color="white">
                                Forecast Results
                            </Heading>
                        </Box>
                        {renderWinnerBadge()}
                    </VStack>

                    <Divider borderColor="whiteAlpha.300" />

                    {renderStatisticsGrid()}
                    {renderDateRange()}
                </VStack>
            </>
        );
    };

    return (
        <Box
            bg={cardBg}
            p={{ base: 4, md: 6 }}
            borderRadius="lg"
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            position="relative"
        >
            {renderForecastContent()}
        </Box>
    );
};

export default ClosedForecastStats;