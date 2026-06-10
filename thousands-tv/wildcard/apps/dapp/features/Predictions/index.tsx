import { useEffect, useState } from "react";
import {
    Box,
    Button,
    ButtonGroup,
    Flex,
    useToast,
    useMediaQuery,
    Container,
    Stack,
    useBreakpointValue,
} from "@chakra-ui/react";
import PredictionCardList from "./PredictionCardList";
import UserPredictionsList from "./components/UserPredictionsList";
import { useChoicePredictions } from "@/hooks/choicePredictions/useChoicePredictions";
import { Image } from "@chakra-ui/react";
import { InsightScoreLeaderboard } from "./components/InsightScoreLeaderboard";
import { InsightScoreRank } from "@/components/InsightScoreRank";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useRouter } from "next/router";
import Metrics from "../Metrics";

type forecastTabs = "predictions" | "yourPredictions" | "completedCalls" | "leaderboard" | "gameData";

const Predictions = () => {
    const router = useRouter();
    const { userDB } = useWildfileUserContext();
    const [tabs, setTabs] = useState<forecastTabs>("predictions");

    const handleClickTab = (
        tab: forecastTabs
    ) => {
        setTabs(tab);
        const currentPath = router.asPath.split('?')[0];
        router.push(
            `${currentPath}?tab=${tab}`,
            undefined,
            { shallow: true }
        );
    };

    useEffect(() => {
        const { tab } = router.query;
        if (tab && typeof tab === "string") {
            const validTabs = ["predictions", "yourPredictions", "completedCalls", "leaderboard", "gameData"];
            if (validTabs.includes(tab)) {
                setTabs(tab as forecastTabs);
            }
        } else if (!tab && router.isReady) {
            const currentPath = router.asPath.split('?')[0];
            router.push(
                `${currentPath}?tab=predictions`,
                undefined,
                { shallow: true }
            );
        }
    }, [router.query.tab, router.isReady]);

    const ResponsiveWildcardDistributedImage = () => {
        const [isClient, setIsClient] = useState(false);
        const [isDesktop] = useMediaQuery("(min-width: 768px)");

        useEffect(() => {
            setIsClient(true);
        }, []);

        if (!isClient) return null;

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

    const toast = useToast();
    const {
        predictions,
        loading: isLoadingPredictions,
        error,
    } = useChoicePredictions();

    const completedPredictions = predictions.filter((p) => {
        const isResolved = p.resolvedChoice !== undefined;
        const isPastEndDate = new Date(p.endDate) < new Date();
        return isResolved || isPastEndDate;
    });

    const activePredictions = predictions.filter((p) => {
        const isResolved = p.resolvedChoice !== undefined;
        const isPastEndDate = new Date(p.endDate) < new Date();
        return !isResolved && !isPastEndDate;
    });

    useEffect(() => {
        if (error) {
            toast({
                title: error,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }
    }, [error, predictions]);

    const isMobile = useBreakpointValue({ base: true, sm: false });

    return (
        <Box
            p={{
                base: 2,
                md: 6,
            }}
            minH="inherit"
            position="relative"
        >
            <Container maxW="1400px">
                <Flex
                    flexDirection={"column"}
                    alignItems={"center"}
                    zIndex={5}
                    gap={6}
                >
                    <Flex
                        direction={isMobile ? "column" : "row"}
                        wrap="nowrap"
                        gap={0}
                        borderRadius="md"
                        overflow="hidden"
                        boxShadow="md"
                    >
                        {/*<ButtonGroup isAttached variant="outline">*/}
                            <Button
                                sx={{
                                    bg:
                                        tabs === "predictions"
                                            ? "gray"
                                            : "transparent",
                                    _hover: {
                                        bg:
                                            tabs === "predictions"
                                                ? "gray"
                                                : "var(--chakra-colors-whiteAlpha-200)",
                                    },
                                }}
                                onClick={() => handleClickTab("predictions")}
                                borderRadius={isMobile ? "md md 0 0" : "md 0 0 md"}
                                variant="outline" 
                                size="sm"
                            >
                                Forecasts
                            </Button>
                            <Button
                                sx={{
                                    bg:
                                        tabs === "yourPredictions"
                                            ? "gray"
                                            : "transparent",
                                    _hover: {
                                        bg:
                                            tabs === "yourPredictions"
                                                ? "gray"
                                                : "var(--chakra-colors-whiteAlpha-200)",
                                    },
                                }}
                                onClick={() => handleClickTab("yourPredictions")}
                                borderRadius="0"
                                variant="outline" 
                                size="sm"
                            >
                                Your Calls
                            </Button>
                            <Button
                                sx={{
                                    bg:
                                        tabs === "completedCalls"
                                            ? "gray"
                                            : "transparent",
                                    _hover: {
                                        bg:
                                            tabs === "completedCalls"
                                                ? "gray"
                                                : "var(--chakra-colors-whiteAlpha-200)",
                                    },
                                }}
                                onClick={() => handleClickTab("completedCalls")}
                                borderRadius="0"
                                variant="outline" 
                                size="sm"
                            >
                                Completed Forecasts
                            </Button>
                            {/*
                            <Button
                                sx={{
                                    bg:
                                        tabs === "leaderboard"
                                            ? "gray"
                                            : "transparent",
                                    _hover: {
                                        bg:
                                            tabs === "leaderboard"
                                                ? "gray"
                                                : "var(--chakra-colors-whiteAlpha-200)",
                                    },
                                }}
                                onClick={() => handleClickTab("leaderboard")}
                                borderRadius="0"
                                variant="outline" 
                                size="sm"
                            >
                                Leaderboard
                            </Button>
                            */}
                            <Button
                                sx={{
                                    bg:
                                        tabs === "gameData"
                                            ? "gray"
                                            : "transparent",
                                    _hover: {
                                        bg:
                                            tabs === "gameData"
                                                ? "gray"
                                                : "var(--chakra-colors-whiteAlpha-200)",
                                    },
                                }}
                                onClick={() => handleClickTab("gameData")}
                                borderRadius={isMobile ? "0 0 md md" : "0 md md 0"}
                                variant="outline" 
                                size="sm"
                            >
                                Game Data
                            </Button>
                        {/*</ButtonGroup>*/}
                        
                        {/*
                        <Box position="absolute" right={0}>
                            <InsightScoreRank userId={userDB?._id?.toString()} smallVersion={true} />
                        </Box>
                        */}
                    </Flex>
                    <Box mt={8} w="full" maxW="1400px">
                        {tabs === "predictions" && (
                            <Box>
                                <PredictionCardList
                                    predictions={activePredictions}
                                    isLoadingPredictions={isLoadingPredictions}
                                    isCompletedView={false}
                                />
                            </Box>
                        )}
                        {tabs === "yourPredictions" && <UserPredictionsList />}
                        {tabs === "completedCalls" && (
                            <Box>
                                <PredictionCardList
                                    predictions={completedPredictions}
                                    isLoadingPredictions={isLoadingPredictions}
                                    isCompletedView={true}
                                />
                            </Box>
                        )}
                        {tabs === "gameData" && <Metrics />}
                        {/*tabs === "leaderboard" && (
                            <Box>
                                <InsightScoreLeaderboard limit={10} />
                            </Box>
                        )*/}
                    </Box>

                    {ResponsiveWildcardDistributedImage()}
                </Flex>
            </Container>
        </Box>
    );
};
export default Predictions;