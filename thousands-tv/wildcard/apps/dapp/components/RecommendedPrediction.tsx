import React, { useEffect, useState } from "react";
import {
    Box,
    Text,
    VStack,
    HStack,
    Badge,
    Button,
    Spinner,
    useColorModeValue,
    Image,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IRallyPrediction } from "@repo/interfaces";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface RecommendedPredictionProps {
    currentPredictionId: string;
    serverCode: string;
}

const RecommendedPrediction: React.FC<RecommendedPredictionProps> = ({
    currentPredictionId,
    serverCode,
}) => {
    const [recommendedPrediction, setRecommendedPrediction] = useState<IRallyPrediction | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const cardBg = useColorModeValue("whiteAlpha.200", "whiteAlpha.100");
    const borderColor = useColorModeValue("whiteAlpha.400", "whiteAlpha.300");

    useEffect(() => {
        const fetchRecommendedPrediction = async () => {
            try {
                setLoading(true);
                const response = await axiosAuthClientInstance.get("/api/rallyPredictions/getNewestActivePrediction");

                if (response.data.success && response.data.prediction) {
                    if (response.data.prediction._id !== currentPredictionId) {
                        setRecommendedPrediction(response.data.prediction);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch recommended prediction:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendedPrediction();
    }, [currentPredictionId]);

    const handleNavigate = () => {
        if (recommendedPrediction) {
            router.push(`/${serverCode}/forecasts/${recommendedPrediction._id}`);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <Box
                bg={cardBg}
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
                textAlign="center"
            >
                <Spinner size="sm" color="white" />
                <Text color="white" fontSize="sm" mt={2}>
                    Finding active forecasts...
                </Text>
            </Box>
        );
    }

    if (!recommendedPrediction) {
        return (
            <Box
                bg={cardBg}
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
                textAlign="center"
            >
                <Text color="gray.400" fontSize="sm">
                    No other active forecasts available
                </Text>
            </Box>
        );
    }

    return (
        <Box
            bg={cardBg}
            p={4}
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            cursor="pointer"
            _hover={{
                bg: "whiteAlpha.300",
                transform: "translateY(-1px)",
                transition: "all 0.2s",
            }}
            onClick={handleNavigate}
            role="button"
            tabIndex={0}
        >
            <VStack spacing={3} align="stretch">
                <HStack justify="space-between" align="start">
                    <Text color="white" fontSize="sm" fontWeight="medium">
                        Try This Instead
                    </Text>
                    <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                        ACTIVE
                    </Badge>
                </HStack>

                <HStack spacing={3} align="center">
                    {recommendedPrediction.imageUrl && (
                        <Box
                            w="40px"
                            h="40px"
                            borderRadius="md"
                            overflow="hidden"
                            flexShrink={0}
                        >
                            <Image
                                src={recommendedPrediction.imageUrl}
                                alt={recommendedPrediction.title}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                            />
                        </Box>
                    )}

                    <VStack align="start" spacing={1} flex={1}>
                        <Text
                            color="white"
                            fontSize="sm"
                            fontWeight="medium"
                            noOfLines={2}
                            lineHeight="1.3"
                        >
                            {recommendedPrediction.title}
                        </Text>
                        <Text color="gray.400" fontSize="xs">
                            Expires: {formatDate(recommendedPrediction.endDate)}
                        </Text>
                    </VStack>
                </HStack>

                <Button
                    size="sm"
                    colorScheme="green"
                    variant="solid"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate();
                    }}
                >
                    Make a Call →
                </Button>
            </VStack>
        </Box>
    );
};

export default RecommendedPrediction;
