import React, { useEffect, useState, useMemo } from "react";
import { Box, Flex, Text, useBreakpointValue } from "@chakra-ui/react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { IPredictionChartData } from "@repo/interfaces";
import { poppinsRegular } from "@/utils/themeUtil";

interface PredictionChartProps {
    rallyPredictionId: string;
    timeWindowMinutes?: number;
    maxHeight?: string;
    aTeamColor?: string;
    bTeamColor?: string;
    toggleReloadChart: boolean;
    forecastEndDate: Date;
}

interface ChartDataPoint {
    time: number;
    red: number;
    blue: number;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
    rallyPredictionId,
    timeWindowMinutes = 120,
    maxHeight = "80px",
    aTeamColor,
    bTeamColor,
    toggleReloadChart,
    forecastEndDate,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const lineWidth = useBreakpointValue({ base: 10, md: 12, lg: 12 });

    useEffect(() => {
        const fetchChartData = async () => {
            setIsLoading(true);
            try {
                const response = await axiosAuthClientInstance.post(
                    "/api/predictionChartData/getChartData",
                    {
                        rallyPredictionId,
                        forecastEndDate,
                        timeWindowMinutes,
                        limit: 1000,
                    }
                );

                if (response.data.success && response.data.data) {
                    const data = response.data.data;

                    if (data.length === 0) {
                        // No data exists at all - show 50/50 split
                        const syntheticData = Array(10)
                            .fill(null)
                            .map((_, index) => ({
                                time: index,
                                red: 0.5,
                                blue: 0.5,
                            }));
                        setChartData(syntheticData);
                    } else if (data.length === 1) {
                        // Single data point - likely last historical point, show as flat line
                        const normalizedPrice = Math.min(
                            1,
                            Math.max(0, data[0].price)
                        );
                        const syntheticData = Array(10)
                            .fill(null)
                            .map((_, index) => ({
                                time: index,
                                red: normalizedPrice,
                                blue: 1 - normalizedPrice,
                            }));
                        setChartData(syntheticData);
                    } else {
                        // Multiple data points - normal chart data
                        const chartPoints: ChartDataPoint[] = data.map(
                            (point: IPredictionChartData, index: number) => {
                                const normalizedPrice = Math.min(
                                    1,
                                    Math.max(0, point.price)
                                );
                                const red = normalizedPrice;
                                const blue = 1 - normalizedPrice;

                                return {
                                    time: index,
                                    red,
                                    blue,
                                };
                            }
                        );
                        setChartData(chartPoints);
                    }
                }
            } catch (error) {
                console.error("Error fetching chart data:", error);
                // On error, default to 50/50 split
                const syntheticData = Array(10)
                    .fill(null)
                    .map((_, index) => ({
                        time: index,
                        red: 0.5,
                        blue: 0.5,
                    }));
                setChartData(syntheticData);
            } finally {
                setIsLoading(false);
            }
        };

        if (rallyPredictionId) {
            fetchChartData();
        }
    }, [rallyPredictionId, timeWindowMinutes, toggleReloadChart]);

    const { redPercentage, bluePercentage } = useMemo(() => {
        if (chartData.length === 0) {
            return { redPercentage: 50, bluePercentage: 50 };
        }

        const latest = chartData[chartData.length - 1];
        return {
            redPercentage: Math.round(latest.red * 100),
            bluePercentage: Math.round(latest.blue * 100),
        };
    }, [chartData]);

    // Show loading state while fetching data
    if (isLoading) {
        return (
            <Box
                borderRadius="md"
                w="full"
                maxW="500px"
                mx="auto"
                color="white"
                maxH={maxHeight}
                position="relative"
                mt={-1}
            >
                <Flex flexDirection="column" flex={1} gap={2}>
                    <Box
                        className="relative w-full h-24 lg:h-24"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        {/* Subtle loading indicator - maintains chart area size */}
                        <Box
                            w="full"
                            h="full"
                            bg="whiteAlpha.50"
                            borderRadius="md"
                            position="relative"
                            overflow="hidden"
                            mt={-4}
                        >
                            {/* Animated gradient sweep effect */}
                            <Box
                                position="absolute"
                                top="0"
                                left="-100%"
                                w="100%"
                                h="100%"
                                bgGradient="linear(to-r, transparent, whiteAlpha.100, transparent)"
                                animation="sweep 2s infinite"
                                sx={{
                                    "@keyframes sweep": {
                                        "0%": { left: "-100%" },
                                        "100%": { left: "100%" },
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Flex>
            </Box>
        );
    }

    // Show actual chart with data
    return (
        <Box
            borderRadius="md"
            w="full"
            maxW="500px"
            mx="auto"
            color="white"
            maxH={maxHeight}
            position="relative"
            mt={-1}
        >
            <Flex flexDirection="column" flex={1} gap={2}>
                <div className="relative w-full h-24 lg:h-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ right: -5, top: 0, bottom: 5, left: 5 }}
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
                                stroke={aTeamColor ?? "#ff0000"}
                                strokeWidth={lineWidth}
                                dot={false}
                                strokeLinecap="round"
                                activeDot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="blue"
                                stroke={bTeamColor ?? "#0066ff"}
                                strokeWidth={lineWidth}
                                dot={false}
                                strokeLinecap="round"
                                activeDot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Flex>
        </Box>
    );
};
