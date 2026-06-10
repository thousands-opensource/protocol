import React from "react";
import { Box, Flex, Text, Image } from "@chakra-ui/react";
import { GOLDEN_RATIO } from "@/constants/constants";
import { poppinsBold, poppinsMedium, poppinsRegular } from "@/utils/themeUtil";

interface CreditsPointDisplayProps {
    redCreditsSpent: number;
    blueCreditsSpent: number;
    redAvgPurchasePrice: number;
    blueAvgPurchasePrice: number;
    formatNumber: (value: number) => string | number;
    getYourPredictionBonusPoints: (
        creditsSpent: number,
        averagePurchasePrice: number
    ) => string | number;
}

/**
 * Function to format credits for display
 */
export const formatCredits = (value: any) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) return "0";

    if (numValue >= 1000) {
        return (numValue / 1000).toFixed(1) + "k";
    }

    return String(numValue);
};

/**
 * PointsCreditsDisplay - Component to display points and credits
 */
export const CreditsPointDisplay: React.FC<CreditsPointDisplayProps> = ({
    redCreditsSpent,
    blueCreditsSpent,
    redAvgPurchasePrice,
    blueAvgPurchasePrice,
    formatNumber,
    getYourPredictionBonusPoints,
}) => {
    const SECTION_COLOR_BG = "#1f1f1f";
    const SECTION_COLOR_BORDER = "gray.700";

    // Smaller font sizes to ensure fit in a row
    const SMALL = { base: "9px", sm: "10px", md: "11px" };
    const SMALL_TEXT = { base: "11px", sm: "10px", md: "13px" };

    const MED = { base: "9px", sm: "10px", md: "11px" };

    // Calculate values based on provided props
    const basePoints = (redCreditsSpent + blueCreditsSpent) * GOLDEN_RATIO;
    const redBonus = getYourPredictionBonusPoints(
        redCreditsSpent,
        redAvgPurchasePrice
    );
    const blueBonus = getYourPredictionBonusPoints(
        blueCreditsSpent,
        blueAvgPurchasePrice
    );
    const totalCreditsSpent = redCreditsSpent + blueCreditsSpent;

    return (
        <Flex
            flexDirection="row"
            w="full"
            borderRadius="md"
            justifyContent="space-between"
            gap={1}
            overflow="hidden"
        >
            {/* Credits Spent section - more compact */}
            <Flex
                mr={1}
                px={0.5}
                borderRadius="3px"
                alignItems="center"
                minWidth="fit-content"
                minW={"120px"}
                justifyContent={"space-between"}
                bg={SECTION_COLOR_BG}
            >
                <Text
                    mt={"1px"}
                    // fontSize={"9px"}
                    fontSize={SMALL}
                    className={poppinsRegular.className}
                    color="gray.400"
                    fontWeight="normal"
                    mr={1}
                    noOfLines={1}
                >
                    Spent
                </Text>

                <Flex flexDirection="row" alignItems="center">
                    <Text
                        className={poppinsBold.className}
                        color="white"
                        fontSize={SMALL_TEXT}
                        fontWeight="bold"
                        mr="1px"
                    >
                        {formatCredits(totalCreditsSpent)}
                    </Text>
                    <Box ml="1px" mb="1px">
                        <Image
                            src="/images/Credits/coin-large.webp"
                            alt="Credits"
                            boxSize="9px"
                            objectFit="contain"
                        />
                    </Box>
                </Flex>
            </Flex>

            {/* Points section - more compact */}
            <Flex
                w="100%"
                gap={1}
                alignItems="center"
                borderRadius="3px"
                bg={SECTION_COLOR_BG}
                p={0.5}
                px={1}
                overflow="hidden"
            >
                <Text
                    mt={"1px"}
                    // fontSize={"9px"}
                    fontSize={SMALL}
                    className={poppinsRegular.className}
                    color="gray.400"
                    fontWeight="normal"
                    mr={0}
                >
                    Points
                </Text>

                <Flex
                    flexDirection={"row"}
                    justifyContent={"center"}
                    flexGrow={1}
                >
                    <Flex
                        width="100%"
                        align="center"
                        flexWrap="nowrap"
                        overflow="hidden"
                        justifyContent="space-between"
                    >
                        <Text
                            className={poppinsMedium.className}
                            color="white"
                            fontSize={SMALL_TEXT}
                            fontWeight="semibold"
                            whiteSpace="nowrap"
                            textAlign="center"
                            flex="1"
                        >
                            +{String(formatNumber(basePoints))}
                        </Text>
                            
                        <Text
                            className={poppinsMedium.className}
                            color="#F56565"
                            fontSize={SMALL_TEXT}
                            fontWeight="semibold"
                            whiteSpace="nowrap"
                            textAlign="center"
                            flex="1"
                        >
                            +{String(redBonus)}
                        </Text>

                        <Text
                            className={poppinsMedium.className}
                            color="#0094ba"
                            fontSize={SMALL_TEXT}
                            fontWeight="semibold"
                            whiteSpace="nowrap"
                            textAlign="center"
                            flex="1"
                        >
                            +{String(blueBonus)}
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};
