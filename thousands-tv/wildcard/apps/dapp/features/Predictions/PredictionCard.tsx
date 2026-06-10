import { Box, Button, Text, Flex, Badge, VStack } from "@chakra-ui/react";
import { IRallyPrediction } from "@repo/interfaces";
import Image from "next/image";
import { useRouter } from "next/router";

interface PredictionCardProps {
    prediction: IRallyPrediction;
    isCompleted?: boolean;
    userHasCalled?: boolean;
}
const PredictionCard = ({
    prediction,
    isCompleted = false,
    userHasCalled = false,
}: PredictionCardProps) => {
    const router = useRouter();

    // Check if prediction is actually completed (by resolution or end date)
    const isActuallyCompleted =
        isCompleted ||
        prediction.resolvedChoice !== undefined ||
        new Date(prediction.endDate) < new Date();

    const isCalled = prediction.resolvedChoice !== undefined;

    const airdropComplete = prediction.airdropComplete ?? false;

    const handleOptionClick = (isOptionB: boolean) => {
        // Navigate to the prediction detail page
        const serverCode =
            router.query.serverCode || router.pathname.split("/")[1];
        // Could use isOptionB for tracking user's selection in future
        router.push(`/${serverCode}/forecasts/${prediction._id}`);
    };

    return (
        <Flex
            w={{ base: "100%", md: "320px" }}
            h={{ base: "auto", md: "380px" }}
            minH={{ base: "360px", md: "380px" }}
            bg="linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.02) 70%, transparent 100%), rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(15px)"
            borderRadius="16px"
            color="white"
            flexDirection="column"
            overflow="hidden"
            boxShadow="0 0 0 1px rgba(255, 255, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)"
            position="relative"
        >
            {/* Called Badge - Top Left Flush Tab */}
            {(userHasCalled || isActuallyCompleted) && (
                <Badge
                    position="absolute"
                    top={3}
                    left={0}
                    bg="white"
                    color="black"
                    fontSize="xs"
                    px={3}
                    py={0.5}
                    borderRadius="0 9999px 9999px 0"
                    fontWeight="bold"
                    zIndex={10}
                    boxShadow="md"
                >
                    {airdropComplete ? "Airdropped" : isCalled ? "Called" : "Ended"}
                </Badge>
            )}

            {/* Header Section */}
            <VStack
                spacing={2}
                pt={4}
                pb={3}
                px={4}
                minH="135px"
                justify="flex-start"
                align="center"
            >
                <Text
                    fontSize="12px"
                    fontWeight="bold"
                    letterSpacing="2px"
                    color="whiteAlpha.800"
                    textAlign="center"
                >
                    META ORACLE
                </Text>

                <Text
                    fontSize={{ base: "16px", md: "18px" }}
                    fontWeight="bold"
                    mt={3}
                    textAlign="center"
                    color="white"
                    lineHeight="1.2"
                    px={2}
                    noOfLines={3}
                    overflow="hidden"
                    textOverflow="ellipsis"
                >
                    {prediction.title}
                </Text>
            </VStack>

            {/* Image Section with Arrow Icons */}
            <Box position="relative" w="100%" h="200px" overflow="hidden">
                {prediction.imageUrl && (
                    <Image
                        width={320}
                        height={160}
                        alt="prediction-image"
                        src={prediction.imageUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )}
            </Box>

            {/* Action Buttons Section - Centered in remaining space */}
            <Flex
                direction="column"
                justify="center"
                flex="1"
                px={4}
                py={4}
                minH="80px"
            >
                <Flex justify="center" w="100%">
                    <Button
                        minW="160px"
                        h="30px"
                        px={8}
                        bg={isActuallyCompleted ? "gray.500" : "blue.500"}
                        color="white"
                        fontWeight="bold"
                        fontSize="14px"
                        borderRadius="full"
                        _hover={{
                            bg: isActuallyCompleted ? "gray.600" : "blue.600",
                            transform: "translateY(-1px)",
                        }}
                        transition="all 0.2s"
                        onClick={() => handleOptionClick(false)}
                    >
                        {isActuallyCompleted ? isCalled ? "View Results" : "View" : "Make a Call"}
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};
export default PredictionCard;
