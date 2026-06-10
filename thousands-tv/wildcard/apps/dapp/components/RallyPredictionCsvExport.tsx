import React, { useState } from 'react';
import {
    Box,
    Button,
    Input,
    Text,
    VStack,
    HStack,
    useToast,
    FormControl,
    FormLabel,
    Spinner,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    Flex
} from '@chakra-ui/react';
import { FaDownload, FaChevronDown } from 'react-icons/fa';
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface RallyPredictionSettlementCsvExportProps {
}

interface RallyPredictionSettlementCsvResponse {
    success: boolean;
    message: string;
    data?: {
        csvData: string;
        filename: string;
        summary: {
            totalParticipants: number;
            totalPool: number;
            rallyPredictionId: string;
        };
    };
}

export const RallyPredictionCsvExport: React.FC<RallyPredictionSettlementCsvExportProps> = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const getDateString = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const setQuickDateRange = (days: number) => {
        const end = new Date();
        const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        setStartDate(getDateString(start));
        setEndDate(getDateString(end));
    };

    const clearDates = () => {
        setStartDate('');
        setEndDate('');
    };

    const downloadCsv = (csvData: string, filename: string) => {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadCsv = async () => {
        setIsLoading(true);

        try {
            const requestBody: any = {};

            if (startDate) requestBody.startDate = startDate;
            if (endDate) requestBody.endDate = endDate;

            const response = await axiosAuthClientInstance.post<RallyPredictionSettlementCsvResponse>(
                '/api/rallyPredictions/getRallyPredictionCsv',
                requestBody
            );

            if (response.data.success && response.data.data) {
                const { csvData, filename, summary } = response.data.data;
                downloadCsv(csvData, filename);

                toast({
                    title: "CSV Downloaded Successfully",
                    description: `${summary.totalParticipants} participants, ${summary.totalPool} total pool`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                throw new Error(response.data.message || 'Failed to generate CSV');
            }
        } catch (error: any) {
            console.error('Error downloading CSV:', error);
            toast({
                title: "Download Failed",
                description: error.response?.data?.message || error.message || "Failed to download CSV",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            p={6}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
            _dark={{ bg: "gray.700" }}
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">
                    Rally Prediction Settlement Export
                </Text>

                <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                    Export rally predictions that expire within the specified date range.
                    If no dates are provided, it will export predictions from the last week.
                </Text>

                <Flex gap={4} align="end">
                    <FormControl>
                        <FormLabel>Start Date</FormLabel>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            bg="white"
                            _dark={{ bg: "gray.600" }}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>End Date</FormLabel>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            bg="white"
                            _dark={{ bg: "gray.600" }}
                        />
                    </FormControl>

                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<Icon as={FaChevronDown} />}
                            variant="outline"
                            size="md"
                            minW="140px"
                        >
                            Quick Select
                        </MenuButton>
                        <MenuList>
                            <MenuItem onClick={() => setQuickDateRange(1)}>
                                Last Day
                            </MenuItem>
                            <MenuItem onClick={() => setQuickDateRange(7)}>
                                Last Week
                            </MenuItem>
                            <MenuItem onClick={() => setQuickDateRange(30)}>
                                Last Month
                            </MenuItem>
                            <MenuItem onClick={clearDates}>
                                Clear Dates
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>

                <Button
                    leftIcon={isLoading ? <Spinner size="sm" /> : <FaDownload />}
                    colorScheme="blue"
                    onClick={handleDownloadCsv}
                    isLoading={isLoading}
                    loadingText="Generating CSV..."
                    size="md"
                >
                    Download Settlement CSV
                </Button>

                <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                    Export rally predictions that expire within the specified date range with complete
                    game theory calculations including percentiles, timing factors, position multipliers,
                    and settlement data for point distribution.
                </Text>
            </VStack>
        </Box>
    );
};
