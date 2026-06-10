import React, { useState, useEffect } from "react";
import { useBoostStore } from "@/store/useBoostStore";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
    Box,
    Flex,
    Spacer,
    Text,
    useBreakpointValue,
    VStack,
} from "@chakra-ui/react";
import { formatNumber } from "@/utils/util";
import { GOLDEN_RATIO, INITIAL_RALLY_POT } from "@/constants/constants";
import { poppinsRegular } from "@/utils/themeUtil";

type Team = {
    id: string;
    name: string;
    color: "red" | "blue";
    price: number;
    currencyUnit?: string;
    comboMultiplier: number;
    boostLevel: number;
    gradientStart?: string;
    gradientEnd?: string;
};

export type EventConfig = {
    title: string;
    teams: [Team, Team];
    initialProgress?: [number, number];
};

const defaultEventConfig: EventConfig = {
    title: 'The Big Game"',
    teams: [
        {
            id: "team1",
            name: "Red",
            color: "red",
            price: 0,
            comboMultiplier: 2.1,
            boostLevel: 1,
        },
        {
            id: "team2",
            name: "Blue",
            color: "blue",
            price: 1.25,
            currencyUnit: "usdc",
            comboMultiplier: 2.4,
            boostLevel: 2,
        },
    ],
    initialProgress: [50, 50],
};

const RALLY_LEVELS = Array.from({ length: 10 }, (_, i) => ({
    level: i + 1,
    requiredPoints: (i + 1) * 1000,
}));

export const PredictChatGameState = () => {
    const {
        isMatchRunning,
        redBlueRatio,
        redComboMultiplier,
        blueComboMultiplier,
        totalRedBoost,
        totalBlueBoost,
        totalUniqueUserCount,
        redAvgPoints,
        blueAvgPoints,
        chartData,
        addChartData,
    } = useBoostStore();
    const [momentum, setMomentum] = useState(0);
    const lineWidth = useBreakpointValue({ base: 6, md: 6, lg: 6 });

    const simulateBoostStoreForTesting = () => {
        const state = useBoostStore.getState();
        state.setRedBlueRatio(0.5);
        state.setRedComboMultiplier(1.5);
        state.setBlueComboMultiplier(1.5);
        state.setIsMatchingRunning(true);
        state.setTotalRedBoost(0);
        state.setTotalBlueBoost(0);

        const interval = setInterval(() => {
            const state = useBoostStore.getState();
            const noise = (Math.random() - 0.5) * 0.04;

            setMomentum((prev) => {
                const decay = 0.95;
                const randomInfluence = (Math.random() - 0.5) * 0.08;
                return (prev * decay + randomInfluence) * 0.99;
            });

            const currentRatio = state.redBlueRatio;
            const newRatio = Math.min(
                0.75,
                Math.max(0.25, currentRatio + momentum + noise)
            );

            const redBoostIncrease = Math.floor(
                Math.random() * (momentum > 0 ? 10 : 3)
            );
            const blueBoostIncrease = Math.floor(
                Math.random() * (momentum < 0 ? 10 : 3)
            );

            state.addChartData(newRatio);
            state.setRedComboMultiplier(1 + newRatio);
            state.setBlueComboMultiplier(2 - newRatio);
            state.setTotalRedBoost(state.totalRedBoost + redBoostIncrease);
            state.setTotalBlueBoost(state.totalBlueBoost + blueBoostIncrease);
        }, 1000);

        return () => clearInterval(interval);
    };

    const CREDITS_SPENT_PER_RALLY_LEVEL = 100000;

    const getRallyInfo = (totalPoints: number) => {
        const level = Math.min(
            10,
            Math.floor(totalPoints / CREDITS_SPENT_PER_RALLY_LEVEL) + 1
        );
        const pointsInCurrentLevel =
            totalPoints % CREDITS_SPENT_PER_RALLY_LEVEL;
        const progress =
            level === 10
                ? 100
                : (pointsInCurrentLevel / CREDITS_SPENT_PER_RALLY_LEVEL) * 100;
        return { level, progress };
    };

    const getAveragePrediction = (numerator: number) => {
        if (totalUniqueUserCount <= 0) {
            return formatNumber(0);
        }

        if (numerator <= 0) {
            return formatNumber(0);
        }

        const rawValue = numerator / totalUniqueUserCount;
        return formatNumber(rawValue * GOLDEN_RATIO);
    };

    // useEffect(() => simulateBoostStoreForTesting(), []);

    if (!isMatchRunning) return null;

    return (
        <Box
            borderRadius="md"
            w="full"
            maxW="500px"
            mx="auto"
            color="white"
            maxH="80px"
            position="relative"
            mt={-1}
        >
            {/* Main chart with thicker lines */}
            <Flex flexDirection="column" flex={1} gap={2}>
                <div className="relative w-full h-24 lg:h-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ right: -5, top: 0, bottom: 40, left: 5 }}
                        >
                            <XAxis
                                dataKey="time"
                                tick={false}
                                tickLine={false}
                                axisLine={false}
                                height={0}
                            />
                            <YAxis
                                orientation="right"
                                domain={[0, 1]}
                                ticks={[0.25, 0.5, 0.75]}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(val) =>
                                    `${(val * 100).toFixed(0)}%`
                                }
                                tickLine={false}
                                axisLine={false}
                                width={0}
                            />
                            <Line
                                type="monotone"
                                dataKey="red"
                                stroke="#ff0000"
                                strokeWidth={lineWidth}
                                dot={false}
                                strokeLinecap="round"
                                activeDot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="blue"
                                stroke="#0066ff"
                                strokeWidth={lineWidth}
                                dot={false}
                                strokeLinecap="round"
                                activeDot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* New indicator boxes positioned at bottom left */}
                {/* Indicator boxes positioned at bottom left */}
                <Flex
                    position="absolute"
                    bottom="2px"
                    left="0px"
                    gap="2"
                    justifyContent="flex-start"
                >
                    {/* Blue indicator box  */}
                    <Box
                        bgGradient="linear(to-b, #00a0ff, #0050c9)"
                        px="3"
                        borderRadius="sm"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                    >
                        <Text
                            className={poppinsRegular.className}
                            fontSize="xs"
                            color="white"
                        >
                            {((1 - redBlueRatio) * 100).toFixed(0)}%
                        </Text>
                    </Box>

                    {/* Red indicator box */}
                    <Box
                        bgGradient="linear(to-b, #ff3a3a, #c91414)"
                        px="3"
                        borderRadius="sm"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                    >
                        <Text
                            className={poppinsRegular.className}
                            fontSize="xs"
                            color="white"
                        >
                            {(redBlueRatio * 100).toFixed(0)}%
                        </Text>
                    </Box>
                </Flex>
            </Flex>
        </Box>
    );
};
