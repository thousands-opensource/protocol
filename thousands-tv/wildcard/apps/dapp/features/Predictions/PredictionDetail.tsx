import { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Button,
    ButtonGroup,
    Text,
    VStack,
    HStack,
    Input,
    useToast,
    Heading,
    Badge,
    Progress,
    Container,
    Grid,
    useColorModeValue,
    Flex,
    useMediaQuery,
    Divider,
} from "@chakra-ui/react";
import { IRallyPrediction } from "@repo/interfaces";
import UserPredictionsByEvent from "./components/UserPredictionsByEvent";
import ClosedForecastStats from "./components/ClosedForecastStats";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { useRouter } from "next/router";
import { ArrowBackIcon, TimeIcon } from "@chakra-ui/icons";
import NextImage from "next/image";
import RecommendedPrediction from "@/components/RecommendedPrediction";
import { PredictionChart } from "@/components/PredictionChart";
import { MAXIMUM_CREDIT_ALLOW_SPENT_FORECASTS } from "@/constants";
import {
    ConfirmationChoiceState,
    ConfirmPrediction,
    ConfirmPredictionResponse,
    PriceQuote,
    PriceQuoteResponse,
} from "@/components/PubNub/Chat/YourPredictions";
import {
    getConfirmChoicePredictionEndpoint,
    getGetPredictionEndpoint,
    getInitiateChoicePredictionEndpoint,
} from "@/utils/environmentUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useUserPredictionsByEvent } from "@/hooks/useRallyPredictions";
import { useGlobalContext } from "@/contexts/globalContext";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { Image } from "@chakra-ui/react";
import { SharedRallyPredictionData } from "@/services/interfaces/IPredictionSharedCacheService";
import { InsightScoreRank } from "@/components/InsightScoreRank";

interface PredictionStats {
    totalOptionA: number;
    totalOptionB: number;
    timingFactor: number;
    activityLevel: string;
    haltedUntil: Date;
    startTimestamp: number;
}

interface PredictionStatsResponse {
    success: boolean;
    predictionStats: PredictionStats;
    errorMessage: string;
}

interface PredictionDetailProps {
    rallyPrediction: IRallyPrediction;
    sharedData?: SharedRallyPredictionData | null;
}

/**
 * Prediction details page
 */
const PredictionDetail = ({
    rallyPrediction,
    sharedData,
}: PredictionDetailProps) => {
    const { setLoadingSpinner } = useGlobalContext();
    const [selectedPosition, setSelectedPosition] = useState<
        "for" | "against" | null
    >(null);
    const [betAmount, setBetAmount] = useState<string>("100");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { creditBalance, setCreditBalance } = useWildfileUserContext();

    const { userDB } = useWildfileUserContext();
    const userId = userDB?._id?.toString();

    const cardBg = useColorModeValue("whiteAlpha.300", "whiteAlpha.200");
    const buttonBg = useColorModeValue("whiteAlpha.400", "whiteAlpha.300");
    const selectedBg = useColorModeValue("purple.500", "purple.600");

    // const [bidInput, setBidInput] = useState<string>("0");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toggleReloadChart, setToggleReloadChart] = useState<boolean>(false);
    const [choice, setChoice] = useState<boolean | null>(null);
    const [totalCreditsSpent, setTotalCreditsSpent] = useState<number>(0);
    const [confirmationChoiceState, setConfirmationChoiceState] =
        useState<ConfirmationChoiceState | null>(null);
    const [isFree, setIsFree] = useState<boolean>(false);
    const [predictionStats, setPredictionStats] =
        useState<PredictionStats | null>(null);
    // Initialize shared prediction data from props
    const [sharedPredictionData, setSharedPredictionData] =
        useState<SharedRallyPredictionData | null>(sharedData || null);
    const [optionAPrice, setOptionAPrice] = useState<number>(0.5);
    const toast = useToast();
    const { predictions, loading, error, refetch } = useUserPredictionsByEvent(
        rallyPrediction?._id?.toString() || ""
    );

    const [timeRemaining, setTimeRemaining] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    const isPredictionOpen = useMemo(() => {
        const now = new Date();
        const start = new Date(rallyPrediction?.startDate);
        const end = new Date(rallyPrediction?.endDate);
        return now >= start && now <= end;
    }, [rallyPrediction?.startDate, rallyPrediction?.endDate]);

    const haltedUntilRaw = useMemo(() => {
        const value = sharedPredictionData?.haltedUntil;
        return value;
    }, [sharedPredictionData]);
    const haltedUntilDate = useMemo(() => {
        const date = haltedUntilRaw ? new Date(haltedUntilRaw) : null;
        return date;
    }, [haltedUntilRaw]);
    const haltedUntilString = useMemo(() => {
        if (haltedUntilDate != null) {
            return (
                haltedUntilDate.toLocaleDateString() +
                " " +
                haltedUntilDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } else {
            return "";
        }
    }, [haltedUntilDate]);

    const isHalted = useMemo(() => {
        const now = new Date();
        const result = haltedUntilDate ? now < haltedUntilDate : false;
        return (
            result &&
            isPredictionOpen &&
            haltedUntilDate != null &&
            timeRemaining
        );
    }, [haltedUntilDate, isPredictionOpen, timeRemaining]);

    const isChoiceSelected = choice != null;
    const countDownReachRef = useRef<NodeJS.Timer>();
    
    // Check if prediction is called (resolved or ended)
    const isPredictionEnded = rallyPrediction?.resolvedChoice !== undefined || 
        (rallyPrediction?.endDate && new Date(rallyPrediction.endDate) < new Date());

    const isPredictionCalled = rallyPrediction?.resolvedChoice !== undefined;

    const ResponsiveWildcardDistributedImage = () => {
        const [isClient, setIsClient] = useState(false);
        const [isDesktop] = useMediaQuery("(min-width: 768px)");

        useEffect(() => {
            setIsClient(true); // Ensures this only runs on the client
        }, []);

        if (!isClient) return null; // Prevents mismatch during SSR

        const imageSrc = isDesktop
            ? "/images/wcdistributionprogressfull.jpg"
            : "/images/wcdistributionprogressmobile.jpg";

        return (
            <Image
                src={imageSrc}
                alt="$WC Distributed"
                width="100vw"
                loading="lazy"
            />
        );
    };

    useEffect(() => {
        loadPredictionStats();
    }, []);

    const loadPredictionStats = async () => {
        try {
            setLoadingSpinner(true);
            var response = await axiosAuthClientInstance.post(
                getGetPredictionEndpoint(),
                {
                    predictionId: rallyPrediction?._id?.toString(),
                }
            );

            if (response == null || response.data == null) {
                toast({
                    title: "Unable to fetch forecast data.",
                    status: "error",
                    duration: 4000,
                    position: "top",
                });
                return null;
            }

            var predictionStatsResponse: PredictionStatsResponse =
                response.data;

            if (predictionStatsResponse.success) {
                setChoice(choice);
                setPredictionStats(predictionStatsResponse.predictionStats);
                var tempTotalCreditsSpent =
                    predictionStatsResponse.predictionStats.totalOptionA +
                    predictionStatsResponse.predictionStats.totalOptionB;
                if (tempTotalCreditsSpent < 1) {
                    tempTotalCreditsSpent = 1;
                }
                setTotalCreditsSpent(tempTotalCreditsSpent);
                var tempOptionAPrice =
                    predictionStatsResponse.predictionStats.totalOptionA /
                    tempTotalCreditsSpent;
                setOptionAPrice(tempOptionAPrice);
            } else {
                toast({
                    title: `Error: ${predictionStatsResponse.errorMessage}`,
                    status: "error",
                    duration: 4000,
                    position: "top",
                });
            }
        } catch (e: any) {
            toast({
                title: "Error failed fetch price quote:",
                status: "error",
                duration: 4000,
                position: "top",
            });
        } finally {
            setLoadingSpinner(false);
        }
    };

    const handleChoiceSelection = async (choice: boolean) => {
        if (predictionStats != null) {
            setChoice(choice);
        } else {
            loadPredictionStats();
        }
    };

    const isCreditInputValid = (creditsToSpend: number) => {
        //0 is allowed because it is free
        if (creditsToSpend != 0 && creditsToSpend < 10) {
            toast({
                title: "Oops! You need at least 10 credits to proceed.",
                status: "error",
                duration: 4000,
                position: "top",
            });
            return false;
        } else if (creditsToSpend > MAXIMUM_CREDIT_ALLOW_SPENT_FORECASTS) {
            toast({
                title: "Whoa! That's a lot of credits! The max allowed in a single call is 100,000.",
                status: "error",
                duration: 4000,
                position: "top",
            });
            return false;
        }

        return true;
    };

    const getPriceQuote = async (choice: boolean, credits: number) => {
        try {
            setIsLoading(true);
            var response = await axiosAuthClientInstance.post(
                getInitiateChoicePredictionEndpoint(),
                {
                    predictionId: rallyPrediction?._id?.toString(),
                    choice: choice,
                    credits: credits,
                }
            );

            if (response == null || response.data == null) {
                toast({
                    title: "Something went wrong.",
                    status: "error",
                    duration: 4000,
                    position: "top",
                });
                return null;
            }

            var priceQuoteResponse: PriceQuoteResponse = response.data;

            if (priceQuoteResponse.Success) {
                if (priceQuoteResponse.Data.Prediction.Credits == -1) {
                    toast({
                        title: "Not enough credits!",
                        status: "error",
                        duration: 4000,
                        position: "top",
                    });
                    return null;
                } else if (priceQuoteResponse.Data.Prediction.Credits == -2) {
                    toast({
                        title: "Velocity level is too high!  This forecast has been halted.",
                        status: "error",
                        duration: 4000,
                        position: "top",
                    });
                    return null;
                } else if (priceQuoteResponse.Data.Prediction.Credits == -3) {
                    toast({
                        title: "Please contact support!  Forecast not found!",
                        status: "error",
                        duration: 4000,
                        position: "top",
                    });
                    return null;
                } else if (priceQuoteResponse.Data.Prediction.Credits == -4) {
                    toast({
                        title: "You already used your FREE call for this forecast!",
                        status: "error",
                        duration: 4000,
                        position: "top",
                    });
                    return null;
                }

                return priceQuoteResponse.Data as PriceQuote;
            } else {
                toast({
                    title: "Failed to fetch price quote",
                    status: "error",
                    duration: 4000,
                    position: "top",
                });
            }

            return null;
        } catch (e: any) {
            toast({
                title: "Error failed fetch price quote",
                status: "error",
                duration: 4000,
                position: "top",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleAmountSelect = (amount: number) => {
        if (amount > 0) {
            setIsFree(false);
        } else {
            setIsFree(true);
        }
        setBetAmount(amount.toString());
    };

    const initiatePrediction = async () => {
        const creditsToSpend = Number(betAmount);
        const isValid = isCreditInputValid(creditsToSpend);
        if (!isValid) {
            return;
        }

        if (choice === null) {
            toast({
                title: "You need to select a choice.",
                status: "error",
                duration: 4000,
                position: "top",
            });
            return;
        }

        const quote = await getPriceQuote(choice, creditsToSpend);

        if (quote) {
            setConfirmationChoiceState({
                isConfirming: true,
                team:
                    (quote.Prediction.TeamName as "True" | "False") === "True"
                        ? true
                        : false,
                credits: quote.Prediction.Credits,
                priceQuote: quote,
            });
        }
    };

    const cancelPrediction = () => {
        setConfirmationChoiceState(null);
    };

    const confirmPrediction = async () => {
        if (!confirmationChoiceState?.priceQuote) {
            toast({
                title: "No Price quote available.",
                status: "error",
                duration: 4000,
                position: "bottom",
            });
            return;
        }

        try {
            setIsLoading(true);
            var response = await axiosAuthClientInstance.post(
                getConfirmChoicePredictionEndpoint(),
                {
                    priceQuoteGuid:
                        confirmationChoiceState.priceQuote.PriceQuoteGuid,
                    predictionId: confirmationChoiceState.priceQuote.StageId,
                    choice: confirmationChoiceState.team,
                    credits: confirmationChoiceState.credits,
                }
            );
            setIsLoading(false);

            if (response == null || response.data == null) {
                //Show error message
                toast({
                    title: "Something went wrong.",
                    status: "error",
                    duration: 4000,
                    position: "top",
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
                        setConfirmationChoiceState({
                            isConfirming: true,
                            team: confirmationChoiceState.team,
                            credits: confirmationChoiceState.credits,
                            priceQuote: confirmPrediction.PriceQuote,
                        });
                        toast({
                            title: "Your price quote has expired. Don't worry——Please review your updated quote now.",
                            status: "info",
                            duration: 4000,
                            position: "top",
                        });
                    } else {
                        //Show error message
                        toast({
                            title: "Failed to fetch updated price quote",
                            status: "error",
                            duration: 4000,
                            position: "top",
                        });
                    }

                    return;
                }

                if (confirmPrediction.UpdatedCreditBalance >= 0) {
                    setCreditBalance(confirmPrediction.UpdatedCreditBalance);
                }
                toast({
                    title: "You have successfully confirmed your call.",
                    status: "success",
                    duration: 4000,
                    position: "top",
                });
                setConfirmationChoiceState(null);
                setChoice(null);
                setPredictionStats(null);
                //Reload chart
                var newToggleReloadChart = !toggleReloadChart;
                setToggleReloadChart(newToggleReloadChart);
                loadPredictionStats();
                await refetch();
            }
        } catch (error) {
            setIsLoading(false);
            setConfirmationChoiceState(null);
        }
    };

    const isForecastClosed = () => {
        const isResolved =
            rallyPrediction.resolvedChoice !== null &&
            rallyPrediction.resolvedChoice !== undefined;
        const isPastEndDate = new Date(rallyPrediction.endDate) < new Date();
        return isResolved || isPastEndDate;
    };

    const { serverCode } = router.query as { serverCode: string };
    const backToForecastsUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.FORECASTS.BASE.url,
        { serverCode }
    );

    useEffect(() => {
        // Clear any existing interval
        if (countDownReachRef.current) {
            clearInterval(countDownReachRef.current);
            countDownReachRef.current = undefined;
        }

        if (!haltedUntilDate) {
            setTimeRemaining(null);
            return;
        }

        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = haltedUntilDate.getTime();
            const difference = target - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                );
                const minutes = Math.floor(
                    (difference % (1000 * 60 * 60)) / (1000 * 60)
                );
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                const timeData = { days, hours, minutes, seconds };
                setTimeRemaining(timeData);
            } else {
                if (countDownReachRef.current) {
                    clearInterval(countDownReachRef.current);
                    countDownReachRef.current = undefined;
                }
                setTimeRemaining(null);
                setPredictionStats(null);
            }
        };

        // Run immediately to set initial state
        updateCountdown();

        // Then set up interval
        const interval = setInterval(updateCountdown, 1000);
        countDownReachRef.current = interval;

        return () => {
            if (countDownReachRef.current) {
                clearInterval(countDownReachRef.current);
                countDownReachRef.current = undefined;
            }
        };
    }, [haltedUntilDate]);

    const renderConviction = () => {
        let convictionString = "-";
        if (choice != null)        
        {
            convictionString = (1 /
                                    (choice
                                        ? 1 - optionAPrice
                                        : optionAPrice)
                               ).toFixed(2).toString() + "x";
        }

        return (
            <Text
                color="white"
                fontSize="sm"
                fontWeight="medium"
            >
                {convictionString}
            </Text>
        )
    };

    const renderAmountButtonJsx = (amount: number, label: string) => {
        const isSelected = betAmount === amount.toString();
        
        return (
            <Button
                key={amount}
                size="sm"
                onClick={() => handleAmountSelect(amount)}
                bg={isSelected ? "blackAlpha.400" : "blackAlpha.300"}
                color="white"
                borderRadius="xl"
                border="1px solid"
                borderColor={isSelected ? "whiteAlpha.800" : "whiteAlpha.200"}
                _hover={{
                    bg: "blackAlpha.600",
                    borderColor: "whiteAlpha.800",
                }}
                isDisabled={!isChoiceSelected || Boolean(confirmationChoiceState)}
                flex="1"
                minW={{ base: "40px", md: "60px" }}
                fontSize={{ base: "sm", md: "xl" }}
                textTransform="uppercase"
                fontWeight="semibold"
                fontFamily="Poppins"
            >
                {label}
            </Button>
        );
    };

    const renderConfirmationButtonsJsx = () => {
        return (
            <VStack spacing={2} width="100%">
                <Button
                    size="md"
                    width="100%"
                    backgroundColor="red.200"
                    color="red.900"
                    borderRadius="lg"
                    isLoading={isLoading}
                    onClick={cancelPrediction}
                    _hover={{
                        backgroundColor: "red.300",
                    }}
                    fontWeight="medium"
                >
                    Cancel
                </Button>
                <Button
                    size="md"
                    width="100%"
                    backgroundColor="green.200"
                    color="green.900"
                    borderRadius="lg"
                    isLoading={isLoading}
                    onClick={confirmPrediction}
                    _hover={{
                        backgroundColor: "green.300",
                    }}
                    fontWeight="medium"
                >
                    Confirm Call
                </Button>
            </VStack>
        );
    };

    const renderSubmitCancelButtonsJsx = () => {
        return (
            <Flex
                direction={{ base: "column", md: "row" }}
                gap={{ base: 2, md: 3 }}
                width="100%"
                justify={{ base: "stretch", md: "flex-end" }}
                mt={8}
            >
                <Button
                    size={{ base: "md", md: "sm" }}
                    width={{ base: "100%", md: "auto" }}
                    minW={{ base: "100%", md: "180px" }}
                    borderRadius={"2xl"}
                    backgroundColor={
                        choice === null
                            ? "gray.600"
                            : choice
                            ? rallyPrediction.optionBButtonColor
                            : rallyPrediction.optionAButtonColor
                    }
                    opacity={choice === null ? 0.4 : 1}
                    isLoading={isLoading}
                    isDisabled={
                        choice === null ||
                        Number(betAmount) < 0 ||
                        betAmount === ""
                    }
                    onClick={initiatePrediction}
                    cursor={
                        choice === null ? "not-allowed" : "pointer"
                    }
                    _hover={{
                        opacity: choice === null ? 0.4 : 0.9,
                    }}
                >
                    Submit Call
                </Button>
                <Button
                    size={{ base: "md", md: "sm" }}
                    width={{ base: "100%", md: "auto" }}
                    minW={{ base: "100%", md: "180px" }}
                    backgroundColor="transparent"
                    border="0px solid"
                    borderColor="grey"
                    color="white"
                    _hover={{
                        bg: "whiteAlpha.100",
                    }}
                    onClick={() => setChoice(null)}
                >
                    Cancel
                </Button>
            </Flex>
        );
    };

    const renderForecastControlJsx = () => {
        return (
            <Box opacity={isChoiceSelected ? 1 : 0.5} transition="opacity 0.2s">
                <VStack align="stretch" spacing={3}>
                    {/* Amount Buttons */}
                    {confirmationChoiceState ? (
                        <Box
                            w="100%"
                            p="5px"
                            bgColor={"transparent"}
                            border="1px"
                            borderColor="white"
                            borderRadius={"8px"}
                            color="white"
                            fontSize={"md"}
                        >
                            Make a call of {' "'}
                            {choice
                                ? rallyPrediction.optionBText
                                : rallyPrediction.optionAText}
                            {'" '}
                            {confirmationChoiceState.credits > 0
                                ? "with " +
                                  confirmationChoiceState.credits +
                                  " credits"
                                : "for FREE"}{" "}
                            @{" "}
                            {(
                                confirmationChoiceState.priceQuote?.Prediction
                                    .Price ?? 0
                            )
                                .toFixed(2)
                                .toString()}
                        </Box>
                    ) : (
                        <>
                            {/* Divider and Make prediction amount text */}
                            <Box width="100%">
                                <Box
                                    height="1px"
                                    bg="whiteAlpha.200"
                                    width="100%"
                                />
                                <Text
                                    color="whiteAlpha.700"
                                    fontSize="sm"
                                    fontWeight="medium"
                                    textAlign="left"
                                    mt={3}
                                >
                                    Make prediction amount
                                </Text>
                            </Box>

                            <Grid templateColumns="1fr 1fr" gap={2}>
                                {/* Proportion Box */}
                                <Box
                                    bg="blackAlpha.300"
                                    border="1px solid"
                                    borderColor="whiteAlpha.700"
                                    borderRadius="md"
                                    p={3}
                                >
                                    <HStack justify="space-between">
                                        <Text
                                            color="whiteAlpha.700"
                                            fontSize="xs"
                                        >
                                            Proportion
                                        </Text>
                                        <Text
                                            color="white"
                                            fontSize="sm"
                                            fontWeight="medium"
                                        >
                                            {parseInt(betAmount) > 0 &&
                                            totalCreditsSpent > 0
                                                ? (
                                                      (parseInt(betAmount) /
                                                          totalCreditsSpent) *
                                                      100
                                                  ).toFixed(2)
                                                : "0"}
                                            %
                                        </Text>
                                    </HStack>
                                </Box>

                                {/* Conviction Box */}
                                <Box
                                    bg="blackAlpha.300"
                                    border="1px solid"
                                    borderColor="whiteAlpha.700"
                                    borderRadius="md"
                                    p={3}
                                >
                                    <HStack justify="space-between">
                                        <Text 
                                            color="whiteAlpha.700" 
                                            fontSize="xs"
                                        >
                                            Conviction:
                                        </Text>
                                        {renderConviction()}
                                    </HStack>
                                </Box>

                                {/* Timing Box */}
                                <Box
                                    bg="blackAlpha.300"
                                    border="1px solid"
                                    borderColor="whiteAlpha.700"
                                    borderRadius="md"
                                    p={3}
                                >
                                    <HStack justify="space-between">
                                        <Text
                                            color="whiteAlpha.700"
                                            fontSize="xs"
                                        >
                                            Timing
                                        </Text>
                                        <Text
                                            color="white"
                                            fontSize="sm"
                                            fontWeight="medium"
                                        >
                                            {(
                                                (predictionStats?.timingFactor ??
                                                    0) * 100
                                            ).toFixed(0)}
                                            %
                                        </Text>
                                    </HStack>
                                </Box>

                                {/* Velocity Box */}
                                <Box
                                    bg="blackAlpha.300"
                                    border="1px solid"
                                    borderColor="whiteAlpha.700"
                                    borderRadius="md"
                                    p={3}
                                >
                                    <HStack justify="space-between">
                                        <Text
                                            color="whiteAlpha.700"
                                            fontSize="xs"
                                        >
                                            Velocity
                                        </Text>
                                        <Text
                                            color="white"
                                            fontSize="sm"
                                            fontWeight="medium"
                                        >
                                            {isHalted
                                                ? "Halted"
                                                : predictionStats?.activityLevel ||
                                                  "Active"}
                                        </Text>
                                    </HStack>
                                </Box>
                            </Grid>
                        </>
                    )}

                    <HStack spacing={2} justify="center" width="100%">
                        {renderAmountButtonJsx(0, "Free")}
                        {renderAmountButtonJsx(100, "100")}
                        {renderAmountButtonJsx(2500, "2500")}
                        {renderAmountButtonJsx(10000, "10000")}
                    </HStack>

                    {/* Manual Bid Input - Custom Layout */}
                    <HStack
                        as="label"
                        justify="space-between"
                        px={4}
                        py={2}
                        bg="blackAlpha.300"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        borderRadius="lg"
                        cursor={isChoiceSelected ? "text" : "not-allowed"}
                        _hover={{
                            borderColor: isChoiceSelected
                                ? "whiteAlpha.300"
                                : "whiteAlpha.200",
                        }}
                        _focusWithin={{
                            borderColor: isChoiceSelected
                                ? "whiteAlpha.400"
                                : "whiteAlpha.200",
                            boxShadow: isChoiceSelected
                                ? "0 0 0 1px rgba(255, 255, 255, 0.1)"
                                : "none",
                        }}
                    >
                        <Text color="whiteAlpha.500" fontSize="md">
                            Enter bid
                        </Text>
                        <Input
                            type="number"
                            value={betAmount}
                            min={0}
                            max={100000}
                            onKeyDown={(e) => {
                                if ([".", "e", "+", "-"].includes(e.key)) {
                                    e.preventDefault();
                                    return;
                                }
                            }}
                            onChange={(e) => {
                                setBetAmount(e.target.value);
                            }}
                            isDisabled={
                                !isChoiceSelected ||
                                Boolean(confirmationChoiceState)
                            }
                            color="white"
                            fontSize="md"
                            fontWeight="medium"
                            bg="transparent"
                            border="none"
                            textAlign="right"
                            variant="unstyled"
                            _focus={{
                                outline: "none",
                                boxShadow: "none",
                            }}
                            _hover={{
                                bg: "transparent",
                            }}
                            width="auto"
                            minW="80px"
                            p={0}
                            sx={{
                                "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button":
                                    {
                                        "-webkit-appearance": "none",
                                        margin: 0,
                                    },
                                "&[type=number]": {
                                    "-moz-appearance": "textfield",
                                },
                            }}
                        />
                    </HStack>

                    {isPredictionOpen && confirmationChoiceState 
                        ? renderConfirmationButtonsJsx()
                        : renderSubmitCancelButtonsJsx()
                    }
                </VStack>
            </Box>
        );
    };

    const renderHaltedMessageJsx = () => {
        // Early return pattern
        if (!isHalted || !timeRemaining) return null;

        return (
            <VStack spacing={4} align="center" mt={6}>
                <Text
                    color="red.300"
                    textAlign="center"
                    fontSize="sm"
                >
                    Due to a high volume of Calls, this Forecast is
                    temporarily halted until: {haltedUntilString}
                </Text>

                <Box>
                    <HStack spacing={6} justify="center">
                        <HStack
                            spacing={1}
                            align="baseline"
                            minW={["30px", "60px"]}
                            justify="center"
                        >
                            <Text
                                color="white"
                                fontSize={["2xl", "3xl", "4xl"]}
                                fontWeight="bold"
                                lineHeight="1"
                            >
                                {timeRemaining.days
                                    .toString()
                                    .padStart(2, "0")}
                            </Text>
                            <Text
                                color="white"
                                fontSize={["xs", "sm"]}
                                fontWeight="normal"
                            >
                                d
                            </Text>
                        </HStack>
                        <HStack
                            spacing={1}
                            align="baseline"
                            minW={["30px", "60px"]}
                            justify="center"
                        >
                            <Text
                                color="white"
                                fontSize={["2xl", "3xl", "4xl"]}
                                fontWeight="bold"
                                lineHeight="1"
                            >
                                {timeRemaining.hours
                                    .toString()
                                    .padStart(2, "0")}
                            </Text>
                            <Text
                                color="white"
                                fontSize={["xs", "sm"]}
                                fontWeight="normal"
                            >
                                h
                            </Text>
                        </HStack>
                        <HStack
                            spacing={1}
                            align="baseline"
                            minW={["30px", "60px"]}
                            justify="center"
                        >
                            <Text
                                color="white"
                                fontSize={["2xl", "3xl", "4xl"]}
                                fontWeight="bold"
                                lineHeight="1"
                            >
                                {timeRemaining.minutes
                                    .toString()
                                    .padStart(2, "0")}
                            </Text>
                            <Text
                                color="white"
                                fontSize={["xs", "sm"]}
                                fontWeight="normal"
                            >
                                m
                            </Text>
                        </HStack>
                        <HStack
                            spacing={1}
                            align="baseline"
                            minW={["30px", "60px"]}
                            justify="center"
                        >
                            <Text
                                color="white"
                                fontSize={["2xl", "3xl", "4xl"]}
                                fontWeight="bold"
                                lineHeight="1"
                            >
                                {timeRemaining.seconds
                                    .toString()
                                    .padStart(2, "0")}
                            </Text>
                            <Text
                                color="white"
                                fontSize={["xs", "sm"]}
                                fontWeight="normal"
                            >
                                s
                            </Text>
                        </HStack>
                    </HStack>
                </Box>

                <Box w="100%" mt={4}>
                    <RecommendedPrediction
                        currentPredictionId={
                            rallyPrediction._id?.toString() || ""
                        }
                        serverCode={serverCode}
                    />
                </Box>
            </VStack>
        );
    };

    return (
        <Box p={{ base: 4, md: 8 }} minH="inherit" position="relative">
            <Container maxW="1400px">
                {/* Back Button */}
                <HStack justify={"space-between"}>
                    <Button
                        leftIcon={<ArrowBackIcon />}
                        variant="ghost"
                        colorScheme="solid"
                        mb={6}
                        mt={2}
                        onClick={() => router.push(backToForecastsUrl)}
                    >
                        Back to Forecasts
                    </Button>
                    {/*<InsightScoreRank userId={userId} smallVersion={true} />*/}
                </HStack>

                {/* Main Prediction Card - Horizontal Layout */}
                <Box
                    bg={cardBg}
                    p={{ base: 4, md: 8 }}
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    mb={4}
                    position="relative"
                    overflow="visible"
                >
                    {/* Called Badge - Top Left Flush Tab */}
                    {(rallyPrediction?.resolvedChoice !== undefined ||
                        (rallyPrediction?.endDate &&
                            new Date(rallyPrediction.endDate) <
                                new Date())) && (
                        <Badge
                            position="absolute"
                            top={3}
                            left={0}
                            bg="white"
                            color="black"
                            fontSize={{ base: "xs", md: "sm" }}
                            px={{ base: 4, md: 6 }}
                            py={{ base: 0.5, md: 1 }}
                            borderRadius="0 9999px 9999px 0"
                            fontWeight="bold"
                            zIndex={10}
                            boxShadow="md"
                        >
                            {rallyPrediction?.airdropComplete ? "Airdropped" : isPredictionCalled ? "Called" : "Ended"}
                        </Badge>
                    )}

                    {/* META ORACLE Text */}
                    <Text
                        fontSize="14px"
                        fontWeight="300"
                        letterSpacing="2px"
                        color="whiteAlpha.700"
                        textAlign="center"
                        mb={4}
                    >
                        META ORACLE
                    </Text>

                    {/* Header with Status - Commented out as Called badge indicates status */}
                    {/* <Flex
                        direction={{ base: "column", md: "row" }}
                        justify="space-between"
                        mb={4}
                        gap={{ base: 3, md: 0 }}
                        align={{ base: "center", md: "center" }}
                    >
                        <Badge
                            colorScheme={isPredictionOpen ? "green" : "red"}
                            fontSize="sm"
                            px={2}
                            py={1}
                            borderRadius="full"
                            position={{ base: "static", md: "absolute" }}
                            right={{ md: 8 }}
                            top={{ md: 8 }}
                        >
                            {isPredictionOpen ? "OPEN" : "CLOSED"}
                        </Badge>
                    </Flex> */}

                    {/* Centered Title */}
                    <Heading
                        color="white"
                        size={{ base: "md", md: "xl" }}
                        mb={4}
                        textAlign="center"
                    >
                        {rallyPrediction?.title}
                    </Heading>

                    {/* Main Content - New Layout: Image Left, Chart and Controls Right */}
                    <Flex
                        direction={{ base: "column", md: "row" }}
                        gap={{ base: 6, md: 8 }}
                        align="stretch"
                    >
                        {/* Left Section - Image, Option Buttons, and Expires Date */}
                        <VStack
                            spacing={4}
                            flex={{ base: "1", md: "1" }}
                            align="stretch"
                        >
                            <Flex
                                flexDirection={"column"}
                                px={{ base: 0, md: "16" }}
                                justifyContent={"center"}
                            >
                                {/* Description and Earn Amount - In Left Column */}
                                <Flex
                                    direction={{ base: "column", md: "row" }}
                                    justify={{
                                        base: "flex-start",
                                        md: "space-between",
                                    }}
                                    alignItems={{
                                        base: "stretch",
                                        md: "center",
                                    }}
                                    gap={{ base: 3, md: 1 }}
                                    mb={2}
                                >
                                    <VStack
                                        align="flex-start"
                                        spacing={1}
                                        maxW={{ base: "100%", md: "280px" }}
                                        flex="1"
                                    >
                                        <Text
                                            color="whiteAlpha.500"
                                            fontSize="xs"
                                            textTransform="uppercase"
                                            letterSpacing="wider"
                                        >
                                            Description
                                        </Text>
                                        <Text
                                            color="whiteAlpha.800"
                                            fontSize="sm"
                                        >
                                            {rallyPrediction?.subTitle}
                                        </Text>
                                    </VStack>
                                    {!isPredictionEnded && (
                                        <Box
                                            px={3}
                                            py={2}
                                            mt={{ base: 0, md: 6 }}
                                            borderRadius="md"
                                            border="2px solid"
                                            borderColor="whiteAlpha.400"
                                            flex={{ base: "1", md: "0 0 auto" }}
                                            textAlign="center"
                                            width={{ base: "100%", md: "auto" }}
                                        >
                                            <Text
                                                color="whiteAlpha.800"
                                                fontSize="md"
                                            >
                                                Earn up to
                                            </Text>
                                            <Text
                                                color="yellow.400"
                                                fontWeight="bold"
                                                fontSize="md"
                                            >
                                                {rallyPrediction?.wcAmount.toLocaleString(
                                                    "en-US"
                                                )}{" "}
                                                $WC
                                            </Text>
                                        </Box>
                                    )}
                                </Flex>

                                {/* Expires Date with Clock Icon - Above Image */}
                                {!isPredictionEnded && (
                                    <HStack justify="flex-start" mb={3}>
                                        <TimeIcon color="gray.400" boxSize={4} />
                                        <Text color="gray.400" fontSize="sm">
                                            Expires:{" "}
                                            {formatDate(rallyPrediction?.endDate)}
                                        </Text>
                                    </HStack>
                                )}
                            </Flex>

                            <Box mt={{ base: 4, md: 1 }}>
                                <Box
                                    w="100%"
                                    maxW={{ base: "fit", md: "600px" }}
                                    h={{ base: "fit", md: "280px" }}
                                    borderRadius="md"
                                    overflow="hidden"
                                    mx="auto"
                                    // bg="red"
                                >
                                    <NextImage
                                        width={600}
                                        height={250}
                                        alt="prediction-image"
                                        src={`${rallyPrediction.imageUrl}`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Option Selection Buttons */}
                            <HStack
                                spacing={{ base: 2, md: 44 }}
                                width="100%"
                                justify="center"
                                mt={{ base: 4, md: 0 }}
                            >
                                <Button
                                    size={{ base: "md", md: "md" }}
                                    color="white"
                                    isDisabled={
                                        !isPredictionOpen ||
                                        Boolean(confirmationChoiceState)
                                    }
                                    bgColor={
                                        choice === false || choice === null
                                            ? rallyPrediction.optionAButtonColor
                                            : "transparent"
                                    }
                                    border={choice != null ? "2px" : "0px"}
                                    borderColor={
                                        choice === false
                                            ? "transparent"
                                            : "grey"
                                    }
                                    width={{ base: "45%", md: "140px" }}
                                    height={{ base: "48px", md: "32px" }}
                                    borderRadius="2xl"
                                    onClick={() => handleChoiceSelection(false)}
                                    fontSize={{ base: "md", md: "sm" }}
                                >
                                    {rallyPrediction.optionAText}
                                </Button>

                                <Button
                                    size={{ base: "md", md: "md" }}
                                    color="white"
                                    isDisabled={
                                        !isPredictionOpen ||
                                        Boolean(confirmationChoiceState)
                                    }
                                    bgColor={
                                        choice === true || choice === null
                                            ? rallyPrediction.optionBButtonColor
                                            : "transparent"
                                    }
                                    border={choice != null ? "2px" : "0px"}
                                    borderColor={
                                        choice === true ? "transparent" : "grey"
                                    }
                                    width={{ base: "45%", md: "140px" }}
                                    height={{ base: "48px", md: "32px" }}
                                    borderRadius="2xl"
                                    onClick={() => handleChoiceSelection(true)}
                                    fontSize={{ base: "md", md: "sm" }}
                                >
                                    {rallyPrediction.optionBText}
                                </Button>
                            </HStack>
                        </VStack>

                        {/* Vertical Divider */}
                        <Box height="fit">
                            <Divider
                                orientation="vertical"
                                borderColor="whiteAlpha.300"
                                display={{ base: "none", md: "block" }}
                                height="100%"
                            />
                        </Box>

                        {/* Right Section - Chart and Controls */}
                        <VStack
                            spacing={4}
                            flex={{ base: "1", md: "1" }}
                            align="stretch"
                        >
                            {/* Chart */}
                            <Box
                                // bg="whiteAlpha.100"
                                p={{ base: 2, md: 4 }}
                                borderRadius="md"
                                border="0px solid"
                                // borderColor="whiteAlpha.200"
                            >
                                <PredictionChart
                                    rallyPredictionId={
                                        rallyPrediction?._id?.toString() || ""
                                    }
                                    forecastEndDate={rallyPrediction?.endDate}
                                    maxHeight="200px"                                    
                                    aTeamColor={
                                        rallyPrediction?.optionAButtonColor
                                    }
                                    bTeamColor={
                                        rallyPrediction?.optionBButtonColor
                                    }
                                    toggleReloadChart={toggleReloadChart}
                                />

                                {/* Percentages */}
                                <HStack justify="space-between" mt={-2}>
                                    <HStack spacing={2} align="center">
                                        <Box
                                            w="12px"
                                            h="12px"
                                            borderRadius="2px"
                                            bg={
                                                rallyPrediction.optionAButtonColor
                                            }
                                        />
                                        <Text color="white" fontSize="sm">
                                            {rallyPrediction.optionAText}
                                        </Text>
                                    </HStack>
                                    <Text color="white" fontSize="sm">
                                        {(optionAPrice * 100).toFixed(0)}%
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <HStack spacing={2} align="center">
                                        <Box
                                            w="12px"
                                            h="12px"
                                            borderRadius="2px"
                                            bg={
                                                rallyPrediction.optionBButtonColor
                                            }
                                        />
                                        <Text color="white" fontSize="sm">
                                            {rallyPrediction.optionBText}
                                        </Text>
                                    </HStack>
                                    <Text color="white" fontSize="sm">
                                        {((1.0 - optionAPrice) * 100).toFixed(
                                            0
                                        )}
                                        %
                                    </Text>
                                </HStack>
                            </Box>

                            {/* Submit Controls - Only show when not halted */}
                            {!isHalted && renderForecastControlJsx()}
                        </VStack>
                    </Flex>

                    {/* Halted State Display */}
                    {renderHaltedMessageJsx()}
                </Box>

                {/* Closed Forecast Stats */}
                {isForecastClosed() && (
                    <Box mb={4}>
                        <ClosedForecastStats
                            rallyPredictionId={
                                rallyPrediction._id?.toString() || ""
                            }
                            optionAText={rallyPrediction.optionAText}
                            optionBText={rallyPrediction.optionBText}
                            optionAColor={rallyPrediction.optionAButtonColor}
                            optionBColor={rallyPrediction.optionBButtonColor}
                        />
                    </Box>
                )}

                {/* User's Predictions Section */}
                <Box
                    bg={cardBg}
                    p={{ base: 4, md: 6 }}
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    mb={4}
                >
                    <UserPredictionsByEvent
                        predictions={predictions}
                        loading={loading}
                        error={error}
                        refetch={refetch}
                        rallyPredictionTitle={rallyPrediction?.title}
                        rallyATeam={rallyPrediction?.optionAText}
                        rallyBTeam={rallyPrediction?.optionBText}
                        rallyATeamColor={rallyPrediction?.optionAButtonColor}
                        rallyBTeamColor={rallyPrediction?.optionBButtonColor}
                    />
                </Box>

                <Box>{ResponsiveWildcardDistributedImage()}</Box>
            </Container>
        </Box>
    );
};

export default PredictionDetail;
