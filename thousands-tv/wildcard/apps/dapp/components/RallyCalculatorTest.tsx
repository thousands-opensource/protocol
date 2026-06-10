import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    Select,
    FormControl,
    FormLabel,
    Card,
    CardBody,
    CardHeader,
    Heading,
    Divider,
    Badge,
    useToast
} from '@chakra-ui/react';
import { useDebounce } from 'use-debounce';
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

type RallyOption = {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
}

type RallyMetrics = {
    totalPool: number;
    forTotal: number;
    againstTotal: number;
    participantCount: number;
    hourlyActivity: number;
    momentumLevel: 'Low' | 'Medium' | 'High';
    activityMultiplier: number;
}

type CalculatedValues = {
    percentileWhenBet: number;
    timingFactor: number;
    positionMultiplier: number;
    poolContribution: number;
    basePayout: number;
    bonusScore: number;
    forPercentage: number;
    againstPercentage: number;
}

export const RallyCalculatorTest = () => {
    const [selectedRallyId, setSelectedRallyId] = useState<string>('');
    const [amount, setAmount] = useState<string>('100');
    const [price, setPrice] = useState<string>('0.5');
    const [forOrAgainst, setForOrAgainst] = useState<'true' | 'false'>('true');
    const [rallyOptions, setRallyOptions] = useState<RallyOption[]>([]);
    const [metrics, setMetrics] = useState<RallyMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const [debouncedAmount] = useDebounce(amount, 300);
    const [debouncedPrice] = useDebounce(price, 300);
    const [debouncedRallyId] = useDebounce(selectedRallyId, 500);

    useEffect(() => {
        const fetchRallies = async () => {
            try {
                const response = await axiosAuthClientInstance.get('/api/rallyPredictions/getRallyPredictions?unexpired=true');

                if (response.data.success && response.data.data) {
                    const rallies = response.data.data.map((rally: any) => ({
                        id: rally._id,
                        title: rally.title,
                        startDate: rally.startDate,
                        endDate: rally.endDate
                    }));
                    setRallyOptions(rallies);
                }
            } catch (error) {
                console.error('Failed to fetch rallies:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch rally options",
                    status: "error",
                    duration: 3000,
                });
            }
        };

        fetchRallies();
    }, [toast]);

    useEffect(() => {
        if (!debouncedRallyId) {
            setMetrics(null);
            return;
        }

        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const response = await axiosAuthClientInstance.post('/api/rallyPredictions/getRallyMetrics', {
                    rallyPredictionId: debouncedRallyId
                });

                if (response.data.success && response.data.data) {
                    setMetrics(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch rally metrics",
                    status: "error",
                    duration: 3000,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [debouncedRallyId, toast]);

    const calculatedValues = useMemo((): CalculatedValues => {
        if (!metrics) {
            return {
                percentileWhenBet: 0,
                timingFactor: 1,
                positionMultiplier: 1,
                poolContribution: 0,
                basePayout: 0,
                bonusScore: 0,
                forPercentage: 50,
                againstPercentage: 50
            };
        }

        const amountNum = parseFloat(debouncedAmount) || 0;
        const priceNum = parseFloat(debouncedPrice) || 0.5;
        const totalPool = metrics.totalPool + amountNum;

        const forPercentage = metrics.totalPool > 0 ? (metrics.forTotal / metrics.totalPool) * 100 : 50;
        const againstPercentage = 100 - forPercentage;

        let percentileWhenBet = 0.5;

        const selectedRally = rallyOptions.find(rally => rally.id === selectedRallyId);
        if (selectedRally && selectedRally.startDate && selectedRally.endDate) {
            const now = new Date().getTime();
            const rallyStart = new Date(selectedRally.startDate).getTime();
            const rallyEnd = new Date(selectedRally.endDate).getTime();
            const rallyDuration = rallyEnd - rallyStart;

            if (rallyDuration > 0) {
                const timeIntoRally = now - rallyStart;
                percentileWhenBet = Math.max(0, Math.min(1, timeIntoRally / rallyDuration));
            }
        }

        const timingFactor = 1 + (0.05 * (1 - percentileWhenBet));

        const safePrice = Math.max(Math.min(priceNum, 0.9999), 0.0001);
        const positionMultiplier = Math.min(1 / safePrice, 20);

        const poolContribution = totalPool > 0 ? (amountNum / totalPool) * 100 : 0;

        const basePayout = 0.75 * totalPool * (amountNum / totalPool);

        const bonusScore = amountNum * timingFactor * positionMultiplier;

        return {
            percentileWhenBet,
            timingFactor,
            positionMultiplier,
            poolContribution,
            basePayout,
            bonusScore,
            forPercentage,
            againstPercentage
        };
    }, [metrics, debouncedAmount, debouncedPrice]);

    return (
        <Box maxW="800px" mx="auto" p={6}>
            <Heading size="lg" mb={6} color="white">
                Rally Calculator Test
            </Heading>

            <VStack spacing={6} align="stretch">
                <Card>
                    <CardHeader>
                        <Heading size="md">Input Parameters</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Rally Prediction</FormLabel>
                                <Select
                                    value={selectedRallyId}
                                    onChange={(e) => setSelectedRallyId(e.target.value)}
                                    placeholder="Select a rally prediction..."
                                >
                                    {rallyOptions.map((rally) => (
                                        <option key={rally.id} value={rally.id}>
                                            {rally.title} (expires: {new Date(rally.endDate).toLocaleDateString()})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <HStack spacing={4} w="full">
                                <FormControl>
                                    <FormLabel>Amount</FormLabel>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="100"
                                        step="1"
                                        min="0"
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Price (Odds)</FormLabel>
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.5"
                                        step="0.01"
                                        min="0.01"
                                        max="0.99"
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Side</FormLabel>
                                    <Select
                                        value={forOrAgainst}
                                        onChange={(e) => setForOrAgainst(e.target.value as 'true' | 'false')}
                                    >
                                        <option value="true">For</option>
                                        <option value="false">Against</option>
                                    </Select>
                                </FormControl>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>

                {metrics && (
                    <Card>
                        <CardHeader>
                            <Heading size="md">Current Rally Metrics</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                    <Text>Total Pool:</Text>
                                    <Text fontWeight="bold">{metrics.totalPool.toLocaleString()}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>For Total:</Text>
                                    <Text fontWeight="bold" color="green.400">
                                        {metrics.forTotal.toLocaleString()} ({calculatedValues.forPercentage.toFixed(1)}%)
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Against Total:</Text>
                                    <Text fontWeight="bold" color="red.400">
                                        {metrics.againstTotal.toLocaleString()} ({calculatedValues.againstPercentage.toFixed(1)}%)
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Participants:</Text>
                                    <Text fontWeight="bold">{metrics.participantCount}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Momentum Level:</Text>
                                    <Badge colorScheme={
                                        metrics.momentumLevel === 'High' ? 'green' :
                                            metrics.momentumLevel === 'Medium' ? 'yellow' : 'red'
                                    }>
                                        {metrics.momentumLevel}
                                    </Badge>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Activity Multiplier:</Text>
                                    <Text fontWeight="bold">{metrics.activityMultiplier.toFixed(2)}x</Text>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                )}

                {selectedRallyId && (
                    <Card>
                        <CardHeader>
                            <Heading size="md">Calculated Game Theory Values</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                    <Text>Percentile When Bet:</Text>
                                    <Text fontWeight="bold">{(calculatedValues.percentileWhenBet * 100).toFixed(1)}%</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Timing Factor:</Text>
                                    <Text fontWeight="bold" color="blue.400">{calculatedValues.timingFactor.toFixed(4)}x</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Position Multiplier:</Text>
                                    <Text fontWeight="bold" color="purple.400">{calculatedValues.positionMultiplier.toFixed(4)}x</Text>
                                </HStack>
                                <Divider />
                                <HStack justify="space-between">
                                    <Text>Pool Contribution:</Text>
                                    <Text fontWeight="bold">{calculatedValues.poolContribution.toFixed(2)}%</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Base Payout (75%):</Text>
                                    <Text fontWeight="bold" color="green.400">{calculatedValues.basePayout.toFixed(2)}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text>Bonus Score:</Text>
                                    <Text fontWeight="bold" color="orange.400">{calculatedValues.bonusScore.toFixed(2)}</Text>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                )}

                {loading && (
                    <Box textAlign="center" py={4}>
                        <Text color="gray.400">Loading rally metrics...</Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default RallyCalculatorTest;
