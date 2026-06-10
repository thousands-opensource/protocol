import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Flex,
    Text,
    VStack,
    Tooltip,
    HStack,
    Grid,
    GridItem,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { poppinsMedium } from "@/utils/themeUtil";
import { useVotingStore, VotingState } from "@/store/useVotingStore";
import { darkenHexColor, formatTimeToMinutesSeconds } from "@/utils/util";
import { FilledVoteButton } from "./FilledVoteButton";
import { getIvsVotingStreamAppUrl } from "@/utils/environmentUtilWCA";
import waxios from "@/utils/waxios";

export const VotingStreamApp = () => {
    const [votedOption, setVotedOption] = useState<string | null>(null);

    const {
        currentState,
        chartData,
        totalVotes,
        title,
        stageId,
        getRemainingTime,
        setUserVoted,
    } = useVotingStore();

    const [timeRemaining, setTimeRemaining] = useState(getRemainingTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(getRemainingTime());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const submitVote = (optionId: string) => {
        setUserVoted();
        setVotedOption(optionId);
        const voteUrl = getIvsVotingStreamAppUrl();
        waxios.post(`${voteUrl}/vote`, {
            stageId,
            voteOption: optionId,
        });
    };

    const renderHeader = () => {
        return (
            <Flex
                w="100%"
                h="100%"
                justify="space-between"
                align="center"
                id="voting-stream-app-header"
            >
                <Box position="relative" top="-1px" left="-14px" minW="60px">
                    <img
                        src="/images/ChatAppControl/voting-title.svg"
                        width={"60px"}
                    />
                </Box>
                <Box
                    verticalAlign="top"
                    maxW="236px"
                    h="100%"
                    mb="4px"
                    pt="0px"
                    pr="5px"
                    display="flex"
                    id="title"
                    alignItems="center"
                >
                    <Text
                        className={poppinsMedium.className}
                        fontSize="10pt"
                        lineHeight="1.2"
                        color="white"
                    >
                        {title}
                    </Text>
                </Box>
                <VStack spacing={1} pt="2px" align="flex-end">
                    <HStack
                        bg="whiteAlpha.100"
                        minW="110px"
                        borderRadius="md"
                        px={2}
                        py={0}
                        alignSelf="flex-end"
                        justifyContent="space-between"
                        flexDir="row"
                    >
                        <Text
                            fontSize={["8pt", "8pt", "8pt"]}
                            color="#818181"
                            whiteSpace="nowrap"
                            lineHeight="17px"
                        >
                            Total Votes:
                        </Text>

                        <Text
                            className={poppinsMedium.className}
                            minW="30px"
                            fontSize={["10pt", "10pt", "10pt"]}
                            color="gray.300"
                            whiteSpace="nowrap"
                            textAlign="right"
                            lineHeight="17px"
                        >
                            {totalVotes}
                        </Text>
                    </HStack>
                    <HStack
                        bg="whiteAlpha.100"
                        minW="70px"
                        borderRadius="md"
                        px={2}
                        py={0}
                        alignSelf="flex-end"
                        justifyContent="space-between"
                        flexDir="row"
                    >
                        <Text
                            fontSize={["8pt", "8pt", "8pt"]}
                            color="#818181"
                            whiteSpace="nowrap"
                            lineHeight="17px"
                        >
                            Time:
                        </Text>

                        <Text
                            className={poppinsMedium.className}
                            minW="30px"
                            fontSize={["10pt", "10pt", "10pt"]}
                            color="gray.300"
                            whiteSpace="nowrap"
                            textAlign="right"
                            lineHeight="17px"
                        >
                            {formatTimeToMinutesSeconds(timeRemaining)}
                        </Text>
                    </HStack>
                </VStack>
            </Flex>
        );
    };

    const getGridColumns = (optionsCount: number): number => {
        if (optionsCount <= 4) return 2;
        return 3;
    };

    const renderContent = () => {
        switch (currentState) {
            case VotingState.INACTIVE:
                return null;

            case VotingState.STARTED:
                return (
                    <VStack id="voting-stream-app-vstack" spacing={1}>
                        {renderHeader()}
                        <Grid
                            templateColumns={`repeat(${getGridColumns(
                                chartData.length
                            )}, 1fr)`}
                            gap={1}
                            w="full"
                            templateRows="auto"
                        >
                            {chartData.map((option) => (
                                <GridItem
                                    key={option.optionId}
                                    colSpan={
                                        chartData.length <= 2 ? 1 : undefined
                                    }
                                >
                                    <Box
                                        bg="whiteAlpha.100"
                                        p={"3px"}
                                        borderRadius="md"
                                    >
                                        <Button
                                            cursor="pointer"
                                            className={poppinsMedium.className}
                                            onClick={() =>
                                                submitVote(option.displayText)
                                            }
                                            color="white"
                                            w="full"
                                            h="7"
                                            whiteSpace="normal"
                                            wordBreak="break-word"
                                            fontSize="9pt"
                                            fontWeight="normal"
                                            lineHeight={1.0}
                                            p={chartData.length <= 2 ? 8 : 1}
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            textAlign="center"
                                            bgGradient={`linear(to-b, ${
                                                option.color
                                            }, ${darkenHexColor(
                                                option.color,
                                                60
                                            )})`}
                                            _hover={{
                                                bgGradient: `linear(to-b, ${option.color}, ${option.color})`,
                                            }}
                                        >
                                            {option.displayText}
                                        </Button>
                                    </Box>
                                </GridItem>
                            ))}
                        </Grid>
                    </VStack>
                );

            case VotingState.VOTED:
            case VotingState.COMPLETED:
                const maxVotes = Math.max(
                    ...chartData.map((option) => option.votes)
                );
                const winningVotes = maxVotes;
                return (
                    <VStack id="voting-stream-app-vstack" spacing={1}>
                        {renderHeader()}
                        <Grid
                            templateColumns={`repeat(${getGridColumns(
                                chartData.length
                            )}, 1fr)`}
                            gap={1}
                            w="full"
                            templateRows="auto"
                        >
                            {chartData.map((option) => (
                                <GridItem
                                    key={option.optionId}
                                    colSpan={
                                        chartData.length <= 2 ? 1 : undefined
                                    }
                                    position="relative"
                                >
                                    {votedOption === option.displayText && (
                                        <CheckCircleIcon
                                            position="absolute"
                                            top={-1}
                                            right={-1}
                                            color="white.400"
                                            zIndex={1}
                                            boxSize={4}
                                        />
                                    )}
                                    <FilledVoteButton
                                        displayText={option.displayText}
                                        color={option.color}
                                        votes={option.votes}
                                        totalVotes={totalVotes}
                                        isWinner={
                                            currentState ===
                                                VotingState.COMPLETED &&
                                            option.votes === winningVotes
                                        }
                                        isCompleted={
                                            currentState ===
                                            VotingState.COMPLETED
                                        }
                                        numberOfOptions={chartData.length}
                                    />
                                </GridItem>
                            ))}
                        </Grid>
                    </VStack>
                );

            default:
                return null;
        }
    };

    return (
        <Box p={0.5} w="full" maxW="500px" id="voting-stream-app">
            {renderContent()}
        </Box>
    );
};
