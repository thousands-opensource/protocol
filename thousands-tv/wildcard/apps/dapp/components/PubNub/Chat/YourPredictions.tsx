//
import React, { useRef, useLayoutEffect, useState } from "react";
import {
    Box,
    Text,
    Button,
    InputGroup,
    InputRightElement,
    VStack,
    HStack,
    Flex,
    Collapse,
    Image,
    Input,
    InputProps,
    Center,
    useToast,
    Spinner,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useBoostStore } from "@/store/useBoostStore";
import { useStreamContext } from "@/contexts/streamContext";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import {
    getConfirmPredictionEndpoint,
    getInitiatePredictionEndpoint,
} from "@/utils/environmentUtil";
import { RallyInfoModal } from "./RallyInfoModal";
import { HelpCircle } from "lucide-react";
import { MAXIMUM_CREDIT_ALLOW_SPENT } from "@/constants";
import { formatNumber } from "@/utils/util";
import { GOLDEN_RATIO } from "@/constants/constants";

import { PredictChatGameState } from "./PredictChatGameState";
import { CreditsPointDisplay } from "./PointDisplayPreview";
import GroupBonusProgressBar from "./GroupBonusProgressBar";
import { poppinsBold } from "@/utils/themeUtil";

export const COLOR_VOTE_BUTTON_OUTER_BORDER = "#383838";
const COLOR_VOTE_BUTTON_INNER_BORDER = "#0089ef";

// Update the DynamicFontInput component
const DynamicFontInput = React.forwardRef<HTMLInputElement, InputProps>(
    (props, ref) => {
        const internalRef = useRef<HTMLInputElement>(null);
        const inputRef = (ref ||
            internalRef) as React.RefObject<HTMLInputElement>;
        const [fontSize, setFontSize] = useState("16px");

        useLayoutEffect(() => {
            const updateFontSize = () => {
                if (inputRef?.current) {
                    const input = inputRef.current;
                    const { height, width } = input.getBoundingClientRect();
                    const baseSize = height * 0.7;

                    const span = document.createElement("span");
                    span.style.visibility = "hidden";
                    span.style.position = "absolute";
                    span.style.fontSize = `${baseSize}px`;
                    span.style.fontFamily =
                        window.getComputedStyle(input).fontFamily;
                    const maxLength = Math.min(input.value.length, 5);

                    span.innerText = input.value.substring(0, maxLength);
                    document.body.appendChild(span);

                    // Calculate padding - both left and right for correct available width
                    const paddingRight = parseFloat(
                        props.pr?.toString() ?? "40px"
                    );
                    const paddingLeft = parseFloat(
                        props.pl?.toString() ?? "12px"
                    );
                    const availableWidth =
                        (width - paddingRight - paddingLeft) * 0.9;
                    const scale = Math.min(
                        1,
                        availableWidth / span.offsetWidth
                    );

                    document.body.removeChild(span);

                    const calculatedSize = Math.max(12, baseSize * scale);
                    setFontSize(`${calculatedSize}px`);
                    input.value = span.innerText;
                }
            };

            updateFontSize();
            window.addEventListener("resize", updateFontSize);
            const input = inputRef.current;
            if (input) {
                input.addEventListener("input", updateFontSize);
            }
            return () => {
                window.removeEventListener("resize", updateFontSize);
                if (input) {
                    input.removeEventListener("input", updateFontSize);
                }
            };
        }, [inputRef, props.pr, props.pl]);

        return (
            <Input
                ref={inputRef}
                fontSize={fontSize}
                textAlign="center" // Changed from right to center
                {...props}
            />
        );
    }
);

DynamicFontInput.displayName = "DynamicFontInput";

export type Prediction = {
    UserId: string;
    TeamName: string;
    Credits: number;
    Price: number;
    Timestamp: number;
};

export type PriceQuote = {
    PriceQuoteGuid: string;
    StageId: string;
    Segment: number;
    Prediction: Prediction;
};

export type PriceQuoteResponse = {
    Success: boolean;
    ErrorMessage: string;
    Data: PriceQuote;
};

export type ConfirmPrediction = {
    WasOrderPlaced: boolean;
    ErrorMessage: string;
    UpdatedCreditBalance: number;
    PriceQuote?: PriceQuote;
    Prediction?: Prediction;
};

export type ConfirmPredictionResponse = {
    Success: boolean;
    ErrorMessage: string;
    Data: ConfirmPrediction;
};

export interface ConfirmationState {
    isConfirming: boolean;
    team: "red" | "blue";
    credits: number;
    priceQuote?: PriceQuote;
}

export interface ConfirmationChoiceState {
    isConfirming: boolean;
    team: boolean;
    credits: number;
    priceQuote?: PriceQuote;
}

export const YourPredictions = () => {
    const [loading, setIsLoading] = useState(false);
    const { creditBalance, setCreditBalance } = useWildfileUserContext();
    const {
        redBlueRatio,
        isMatchRunning,
        redCreditsSpent,
        setRedCreditsSpent,
        blueCreditsSpent,
        setBlueCreditsSpent,
        redAvgPurchasePrice,
        setRedAvgPurchasePrice,
        blueAvgPurchasePrice,
        setBlueAvgPurchasePrice,
    } = useBoostStore();
    const { eventId } = useStreamContext();

    const [isExpanded, setIsExpanded] = useState(true);
    const [showRallyInfo, setShowRallyInfo] = useState(false);
    const [, setUpdateCounter] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const rightElementRef = useRef<HTMLDivElement>(null);
    const positionsRef = useRef<HTMLDivElement>(null);

    const [rightPadding, setRightPadding] = useState("0px");
    const [imageSize, setImageSize] = useState("0px");

    const [confirmationState, setConfirmationState] =
        useState<ConfirmationState | null>(null);
    const toast = useToast();

    const getPriceQuote = async (team: "red" | "blue", credits: number) => {
        try {
            setIsLoading(true);
            var response = await axiosAuthClientInstance.post(
                getInitiatePredictionEndpoint(),
                {
                    stageId: eventId,
                    teamName: team,
                    credits: credits,
                }
            );

            setIsLoading(false);

            if (response == null || response.data == null) {
                //Show error message
                toast({
                    title: "Something went wrong.",
                    status: "error",
                    duration: 4000,
                    position: "bottom",
                });
                return null;
            }

            var priceQuoteResponse: PriceQuoteResponse = response.data;

            if (priceQuoteResponse.Success) {
                if (priceQuoteResponse.Data.Prediction.Credits < 0) {
                    //Not enough credits!
                    toast({
                        title: "Not enough credits!",
                        status: "error",
                        duration: 4000,
                        position: "bottom",
                    });
                    return null;
                }

                return priceQuoteResponse.Data as PriceQuote;
            } else {
                //Show error message
                toast({
                    title: "Failed to fetch price quote",
                    status: "error",
                    duration: 4000,
                    position: "bottom",
                });
            }

            return null;
        } catch (e: any) {
            setIsLoading(false);
        }

        /*
        return {
            PriceQuoteGuid: "yolosweg-boop-feed-cafe-memesfordays69",
            StageId: eventId,
            Segment: 4,
            Prediction: {
                UserId: "xXlamexbox360usernameXx",
                TeamName: team,
                Credits: credits,
                Price: team === 'red' ? redBlueRatio : (1 - redBlueRatio),
                Timestamp: Date.now()
            }
        } as PriceQuote;
         */
    };

    const confirmPrediction = async () => {
        if (!confirmationState?.priceQuote) return;

        try {
            setIsLoading(true);
            var response = await axiosAuthClientInstance.post(
                getConfirmPredictionEndpoint(),
                {
                    priceQuoteGuid: confirmationState.priceQuote.PriceQuoteGuid,
                    stageId: eventId,
                    teamName: confirmationState.team,
                    credits: confirmationState.credits,
                }
            );
            setIsLoading(false);
            setConfirmationState(null);

            if (response == null || response.data == null) {
                //Show error message
                toast({
                    title: "Something went wrong.",
                    status: "error",
                    duration: 4000,
                    position: "bottom",
                });
                return null;
            }

            var confirmPredictionResponse: ConfirmPredictionResponse =
                response.data;

            if (confirmPredictionResponse.Data != null) {
                var confirmPrediction: ConfirmPrediction =
                    confirmPredictionResponse.Data;

                //Order wasn't placed, so we get back an updated price quote
                if (!confirmPrediction.WasOrderPlaced) {
                    if (confirmPrediction.PriceQuote) {
                        //Update new price quote
                        setConfirmationState({
                            isConfirming: true,
                            team: confirmationState.team,
                            credits: confirmationState.credits,
                            priceQuote: confirmPrediction.PriceQuote,
                        });
                        toast({
                            title: "Your price quote has expired. Don't worry——Please review your updated quote now.",
                            status: "info",
                            duration: 4000,
                            position: "bottom",
                        });
                    } else {
                        //Show error message
                        toast({
                            title: "Failed to fetch updated price quote",
                            status: "error",
                            duration: 4000,
                            position: "bottom",
                        });
                    }

                    return;
                }

                if (confirmPrediction.Prediction) {
                    if (confirmPrediction.Prediction.TeamName === "red") {
                        const sharesToAdd =
                            confirmPrediction.Prediction.Credits /
                            confirmPrediction.Prediction.Price;
                        const sharesHeld =
                            redCreditsSpent > 0 && redAvgPurchasePrice > 0
                                ? redCreditsSpent / redAvgPurchasePrice
                                : 0;
                        const newRedCreditsSpent =
                            redCreditsSpent +
                            confirmPrediction.Prediction.Credits;
                        setRedCreditsSpent(newRedCreditsSpent);
                        const newRedAvgPurchasePrice =
                            newRedCreditsSpent / (sharesHeld + sharesToAdd);
                        setRedAvgPurchasePrice(newRedAvgPurchasePrice);
                    } else {
                        const sharesToAdd =
                            confirmPrediction.Prediction.Credits /
                            confirmPrediction.Prediction.Price;
                        const sharesHeld =
                            blueCreditsSpent > 0 && blueAvgPurchasePrice > 0
                                ? blueCreditsSpent / blueAvgPurchasePrice
                                : 0;
                        const newBlueCreditsSpent =
                            blueCreditsSpent +
                            confirmPrediction.Prediction.Credits;
                        setBlueCreditsSpent(newBlueCreditsSpent);
                        const newBlueAvgPurchasePrice =
                            newBlueCreditsSpent / (sharesHeld + sharesToAdd);
                        setBlueAvgPurchasePrice(newBlueAvgPurchasePrice);
                    }
                }

                if (confirmPrediction.UpdatedCreditBalance >= 0) {
                    setCreditBalance(confirmPrediction.UpdatedCreditBalance);
                }
            }
        } catch (error) {
            setIsLoading(false);
            setConfirmationState(null);
        }
    };

    const isCreditInputValid = (creditsToSpend: number) => {
        if (creditsToSpend < 1) {
            toast({
                title: "Oops! You need at least 1 credit to proceed.",
                status: "error",
                duration: 4000,
                position: "bottom",
            });
            return false;
        } else if (creditsToSpend > MAXIMUM_CREDIT_ALLOW_SPENT) {
            toast({
                title: "Whoa! That's a lot of credits! The max allowed is 10,000.",
                status: "error",
                duration: 4000,
                position: "bottom",
            });
            return false;
        }

        return true;
    };

    useLayoutEffect(() => {
        if (rightElementRef.current instanceof HTMLElement) {
            const { width } = rightElementRef.current.getBoundingClientRect();
            setRightPadding(`${width - 8}px`);
        }
        if (
            positionsRef.current instanceof HTMLElement &&
            inputRef.current instanceof HTMLElement
        ) {
            const { height } = inputRef.current.getBoundingClientRect();
            setImageSize(`${height * 0.4}px`);
        }
    }, [isExpanded]);

    const getYourPredictionBonusPoints = (
        creditsSpent: number,
        averagePurchasePrice: number
    ) => {
        if (creditsSpent <= 0) {
            return formatNumber(0);
        }

        if (averagePurchasePrice <= 0) {
            return formatNumber(0);
        }

        const rawValue = creditsSpent * (1 / averagePurchasePrice);
        return formatNumber(rawValue * GOLDEN_RATIO);
    };

    const getButtonPricePoints = (denominator: number) => {
        if (inputRef.current) {
            const creditsToSpend = Number(inputRef.current.value);

            const rawValue = creditsToSpend * (1 / denominator);
            return formatNumber(rawValue * GOLDEN_RATIO);
        }

        return formatNumber(0);
    };

    const refreshButtonPoints = () => {
        setUpdateCounter((previousState) => previousState + 1);
    };

    if (!isMatchRunning) return null;

    /*
    const redMultiplier = redAvgPurchasePrice > 0 ? 1 / redAvgPurchasePrice : 0;
    const blueMultiplier =
        blueAvgPurchasePrice > 0 ? 1 / blueAvgPurchasePrice : 0;
        */

    const renderVoteButtonBlue = () => {
        return (
            <Button
                as="div"
                cursor="pointer"
                padding={0}
                flexGrow={1}
                minH="75px"
                m={0}
                position="relative"
                overflow="hidden"
                borderRadius="xl"
                border={"none"}
                background="transparent"
                _hover={{ transform: "translateY(-1px)" }}
                transition="transform 0.2s"
                boxShadow="0px 2px 6px rgba(0, 0, 0, 0.3)"
                onClick={async () => {
                    if (inputRef.current) {
                        const creditsToSpend = Number(inputRef.current.value);

                        const isValid = isCreditInputValid(creditsToSpend);
                        if (!isValid) {
                            return;
                        }

                        const quote = await getPriceQuote(
                            "blue",
                            creditsToSpend
                        );

                        if (quote) {
                            setConfirmationState({
                                isConfirming: true,
                                team: "blue",
                                credits: quote.Prediction.Credits,
                                priceQuote: quote,
                            });
                        }
                    }
                }}
            >
                {/* Outer border - now integrated with the button background */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    borderRadius="xl"
                    border="4px solid"
                    borderColor={COLOR_VOTE_BUTTON_OUTER_BORDER}
                    bgGradient="linear(to-b, #00a0ff, #0050c9)"
                    overflow="hidden"
                />

                {/* Inner blue border line */}
                <Box
                    position="absolute"
                    top="3px"
                    left="3px"
                    right="3px"
                    bottom="3px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={COLOR_VOTE_BUTTON_INNER_BORDER}
                />

                {/* Content wrapper */}
                <Flex
                    direction="column"
                    position="relative"
                    height="100%"
                    width="100%"
                    justifyContent="center"
                    alignItems="center"
                >
                    {/* Top section */}
                    <Flex
                        justify="center"
                        align="center"
                        w="full"
                        position="relative"
                    >
                        <Text
                            fontSize="3xl"
                            fontWeight="bold"
                            color="white"
                            mr={0.5}
                            lineHeight="1"
                        >
                            {((1 - redBlueRatio) * 100).toFixed(0)}
                        </Text>
                        <Image
                            src="/images/Credits/coin-large.webp"
                            alt="Credits"
                            boxSize="20px"
                            objectFit="contain"
                        />
                    </Flex>

                    {/* Divider */}
                    <Box w="93%" mx="1" h="1px" bg="rgba(255, 255, 255, 0.2)" />

                    {/* Bottom section with points */}
                    <Flex w="full" justify="center" align="center" mt={2}>
                        <Text
                            fontSize={{
                                base: "xs",
                                sm: "xs",
                                md: "xs",
                            }}
                            fontWeight="medium"
                            color="white"
                            textAlign="center"
                            lineHeight="1"
                        >
                            +{getButtonPricePoints(1 - redBlueRatio)} pts
                        </Text>
                    </Flex>
                </Flex>
            </Button>
        );
    };

    const renderVoteButtonRed = () => {
        return (
            <Button
                as="div"
                cursor="pointer"
                padding={0}
                flexGrow={1}
                minH="75px"
                m={0}
                position="relative"
                overflow="hidden"
                borderRadius="xl"
                border={"none"}
                background="transparent"
                _hover={{ transform: "translateY(-1px)" }}
                transition="transform 0.2s"
                boxShadow="0px 2px 6px rgba(0, 0, 0, 0.3)"
                onClick={async () => {
                    if (inputRef.current) {
                        const creditsToSpend = Number(inputRef.current.value);
                        const isValid = isCreditInputValid(creditsToSpend);
                        if (!isValid) {
                            return;
                        }

                        const quote = await getPriceQuote(
                            "red",
                            creditsToSpend
                        );

                        if (quote) {
                            setConfirmationState({
                                isConfirming: true,
                                team: "red",
                                credits: quote.Prediction.Credits,
                                priceQuote: quote,
                            });
                        }
                    }
                }}
            >
                {/* Outer border - now integrated with the button background */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    borderRadius="xl"
                    border="4px solid"
                    borderColor={COLOR_VOTE_BUTTON_OUTER_BORDER}
                    bgGradient="linear(to-b, #ff3a3a, #c91414)"
                    overflow="hidden"
                />

                {/* Inner red border line */}
                <Box
                    position="absolute"
                    top="3px"
                    left="3px"
                    right="3px"
                    bottom="3px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="#ef4444"
                />

                {/* Content wrapper */}
                <Flex
                    direction="column"
                    position="relative"
                    height="100%"
                    width="100%"
                    justifyContent="center"
                    alignItems="center"
                >
                    {/* Top section */}
                    <Flex
                        justify="center"
                        align="center"
                        w="full"
                        position="relative"
                    >
                        <Text
                            fontSize="3xl"
                            fontWeight="bold"
                            color="white"
                            mr={0.5}
                            lineHeight="1"
                        >
                            {(redBlueRatio * 100).toFixed(0)}
                        </Text>
                        <Image
                            src="/images/Credits/coin-large.webp"
                            alt="Credits"
                            boxSize="20px"
                            objectFit="contain"
                        />
                    </Flex>

                    {/* Divider */}
                    <Box w="93%" mx="1" h="1px" bg="rgba(255, 255, 255, 0.2)" />

                    {/* Bottom section with points */}
                    <Flex w="full" justify="center" align="center" mt={2}>
                        <Text
                            fontSize={{
                                base: "xs",
                                sm: "xs",
                                md: "xs",
                            }}
                            fontWeight="medium"
                            color="white"
                            textAlign="center"
                            lineHeight="1"
                        >
                            +{getButtonPricePoints(redBlueRatio)} pts
                        </Text>
                    </Flex>
                </Flex>
            </Button>
        );
    };

    const renderEnterBidInputJSX = () => {
        return (
            <InputGroup height="25px" position="relative">
                {/* Background with rounded corners */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="#333"
                    borderRadius="lg"
                    zIndex={0}
                    py="0"
                    my="0"
                />

                {/* Left element - "Enter Bid" text */}
                <Box
                    position="absolute"
                    left="10px"
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={1}
                    display="flex"
                    alignItems="center"
                    pointerEvents="none"
                    maxW="75px" // Restrict width of label
                >
                    <Text
                        color="gray.300"
                        fontSize="2xs" // Slightly increased from 2xs
                        fontWeight="medium"
                        whiteSpace="nowrap"
                    >
                        Enter Bid
                    </Text>
                </Box>

                <DynamicFontInput
                    ref={inputRef}
                    type="number"
                    min={0}
                    defaultValue={100}
                    border="none"
                    height="100%"
                    bg="transparent"
                    textAlign="center"
                    pr="15px"
                    pl="60px"
                    onFocus={() => setUpdateCounter((prev) => prev + 1)}
                    onBlur={() => setUpdateCounter((prev) => prev + 1)}
                    onKeyDown={(e) => {
                        if ([".", "e", "+", "-"].includes(e.key)) {
                            e.preventDefault();
                        }
                    }}
                    onChange={(e) => {
                        // Force component to update when input changes
                        setUpdateCounter((prev) => prev + 1);
                        refreshButtonPoints();
                    }}
                    _focus={{
                        outline: "none",
                        boxShadow: "none",
                    }}
                    color="white"
                    fontSize="xl"
                    fontWeight="bold"
                    position="relative"
                    zIndex={1}
                    className={poppinsBold.className}
                />

                {/* Right element - Coin image */}
                <InputRightElement
                    ref={rightElementRef}
                    pointerEvents="none"
                    height="100%"
                    width="20px"
                    zIndex={1}
                >
                    <Image
                        src="/images/Credits/coin-large.webp"
                        alt="Credits"
                        mr="24px"
                        boxSize="20px"
                        objectFit="contain"
                    />
                </InputRightElement>
            </InputGroup>
        );
    };

    const confirmRallyCreditsAmountJSX = (
        confirmationState: ConfirmationState
    ) => {
        return (
            <Flex
                w="full"
                bg={confirmationState.team === "red" ? "red.500" : "blue.500"}
                p={{ base: 1, sm: 1.5 }}
                borderRadius="md"
                align="center"
                justify="space-between"
                my={1}
                h="100%"
                flexDirection={"column"}
            >
                <Text
                    fontSize={{
                        base: "2xs",
                        sm: "xs",
                        md: "xs",
                        lg: "xs",
                        xl: "xs",
                    }}
                    flex={1}
                    noOfLines={2}
                    textAlign="center"
                    width="100%"
                    wordBreak="break-word"
                >
                    Rally {confirmationState.credits} credits on{" "}
                    {confirmationState.team === "red" ? "Red" : "Blue"} @
                    {confirmationState.priceQuote?.Prediction.Price
                        ? Math.round(
                              confirmationState.priceQuote?.Prediction.Price *
                                  100
                          )
                        : 0}
                    c
                </Text>
                <HStack spacing={{ base: 0.5, sm: 1 }}>
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setConfirmationState(null)}
                        bg={
                            confirmationState.team === "red"
                                ? "red.600"
                                : "blue.600"
                        }
                        borderColor={
                            confirmationState.team === "red"
                                ? "red.500"
                                : "blue.500"
                        }
                        color="white"
                        h={{ base: "18px", sm: "20px" }}
                        w={{ base: "18px", sm: "20px" }}
                        minW="auto"
                        p={0}
                        _hover={{
                            bg:
                                confirmationState.team === "red"
                                    ? "red.500"
                                    : "blue.500",
                        }}
                    >
                        ×
                    </Button>
                    <Button
                        size="xs"
                        onClick={confirmPrediction}
                        bg={
                            confirmationState.team === "red"
                                ? "red.400"
                                : "blue.400"
                        }
                        _hover={{
                            bg:
                                confirmationState.team === "red"
                                    ? "red.300"
                                    : "blue.300",
                        }}
                        h={{ base: "18px", sm: "20px" }}
                        px={{ base: 1, sm: 2 }}
                        minW="auto"
                        fontSize={{ base: "2xs", sm: "xs" }}
                    >
                        Confirm
                    </Button>
                </HStack>
            </Flex>
        );
    };

    const renderYourPredictionsViewJSX = () => {
        return (
            <Flex flexDirection="column" gap={1}>
                <Box flex="1" display="flex" flexDirection="row" mt="3px">
                    {renderEnterBidInputJSX()}
                </Box>
                {!confirmationState ? (
                    <Flex gap={1} w="full" h="full">
                        {renderVoteButtonBlue()}
                        {renderVoteButtonRed()}
                    </Flex>
                ) : (
                    confirmRallyCreditsAmountJSX(confirmationState)
                )}
            </Flex>
        );
    };

    return (
        <>
            <Flex
                flexDirection={"column"}
                borderRadius="md"
                w="full"
                maxW="500px"
                mx="auto"
                color="white"
                position="relative"
            >
                {/* Loading overlay */}
                {loading && (
                    <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bg="rgba(0, 0, 0, 0.7)"
                        zIndex="10"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="md"
                    >
                        <Spinner
                            thickness="4px"
                            speed="0.65s"
                            emptyColor="gray.700"
                            color="blue.500"
                            size="xl"
                        />
                    </Box>
                )}

                <Flex flexDirection={"row"} gap={2}>
                    <Flex flexDirection={"column"} gap={2} width="50%" mt={1}>
                        <Flex>
                            <Box
                                width="auto"
                                height="auto"
                                display="flex"
                                alignItems="flex-start"
                                justifyContent="center"
                                overflow="hidden"
                                position="absolute"
                                bottom="0px"
                                top="-16px"
                                left="-10px"
                                zIndex="5"
                            >
                                <Image
                                    src="/images/Credits/rally.png"
                                    alt="Rally"
                                    boxSize="65px"
                                    objectFit="contain"
                                />
                            </Box>
                            <Box ml="59px" mt="-2px">
                                <GroupBonusProgressBar />
                            </Box>
                        </Flex>
                        <PredictChatGameState />
                    </Flex>
                    <Flex width="50%">{renderYourPredictionsViewJSX()}</Flex>
                </Flex>

                <Flex>
                    <CreditsPointDisplay
                        redCreditsSpent={redCreditsSpent}
                        blueCreditsSpent={blueCreditsSpent}
                        redAvgPurchasePrice={redAvgPurchasePrice}
                        blueAvgPurchasePrice={blueAvgPurchasePrice}
                        formatNumber={formatNumber}
                        getYourPredictionBonusPoints={
                            getYourPredictionBonusPoints
                        }
                    />
                </Flex>
                <RallyInfoModal
                    open={showRallyInfo}
                    onOpenChange={setShowRallyInfo}
                />
            </Flex>
        </>
    );
};
