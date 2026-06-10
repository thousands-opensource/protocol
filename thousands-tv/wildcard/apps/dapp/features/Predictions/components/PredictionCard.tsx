import { Box, Flex, Text, Badge, useColorModeValue } from "@chakra-ui/react";
import { IUserRallyPrediction } from "@repo/interfaces";
import { useRouter } from "next/router";

interface PredictionCardProps {
    prediction: IUserRallyPrediction;
    rallyPredictionTitle?: string;
    clickable?: boolean;
}

const PredictionCard = ({ prediction, rallyPredictionTitle, clickable = true }: PredictionCardProps) => {
    const router = useRouter();
    const cardBg = useColorModeValue("whiteAlpha.200", "whiteAlpha.100");
    const cardHover = useColorModeValue("whiteAlpha.300", "whiteAlpha.200");
    const borderColor = useColorModeValue("purple.300", "purple.600");
    
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
        return `$${price.toFixed(2)}`;
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString();
    };

    const handleClick = () => {
        if (clickable && prediction.rallyPredictionId) {
            // Get the server code from the current URL
            const pathSegments = router.pathname.split('/');
            const serverCode = router.query.serverCode || pathSegments[1];
            
            // Navigate to the prediction detail page
            router.push(`/${serverCode}/forecasts/${prediction.rallyPredictionId}`);
        }
    };

    return (
        <Box
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
            p={{ base: 3, md: 4 }}
            transition="all 0.2s"
            cursor={clickable ? "pointer" : "default"}
            onClick={handleClick}
            _hover={{
                bg: cardHover,
                transform: clickable ? "translateY(-2px)" : "none",
                boxShadow: clickable ? "lg" : "none",
            }}
            w="100%"
        >
            <Flex direction="column" gap={3}>
                {rallyPredictionTitle && (
                    <Text fontSize="sm" fontWeight="bold" color="white" noOfLines={1}>
                        {rallyPredictionTitle}
                    </Text>
                )}
                
                <Flex justify="space-between" align="center">
                    <Badge
                        colorScheme={prediction.forOrAgainst ? "green" : "red"}
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                    >
                        {prediction.forOrAgainst ? "FOR" : "AGAINST"}
                    </Badge>
                    
                    <Text fontSize="sm" color="gray.300">
                        {formatDate(prediction.createdAt)}
                    </Text>
                </Flex>

                <Flex justify="space-between" align="center">
                    <Box>
                        <Text fontSize="xs" color="gray.400" mb={1}>
                            Amount
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="white">
                            {formatAmount(prediction.amount)}
                        </Text>
                    </Box>
                    
                    <Box textAlign="right">
                        <Text fontSize="xs" color="gray.400" mb={1}>
                            Price
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="white">
                            {formatPrice(prediction.price)}
                        </Text>
                    </Box>
                </Flex>

                <Box>
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.400">
                            Potential Return
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" color="purple.300">
                            {formatAmount(Math.round(prediction.amount * (1 / prediction.price)))}
                        </Text>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
};

export default PredictionCard;