import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Table, Tbody, Tr, Td, TableContainer } from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

type VoteOption = {
    optionId: string;
    displayText: string;
    color: string;
    percentage: number;
};

type VotingGameStateProps = {
    chartData: VoteOption[];
    totalVotes: number;
    timeRemaining: number;
};

export const VotingGameState: React.FC<VotingGameStateProps> = ({
    chartData,
    totalVotes,
    timeRemaining
}) => {
    const maxPercentage = Math.max(...chartData.map(option => option.percentage));

    return (
        <Box w="full" color="white">
            <TableContainer>
                <Table variant="unstyled" size="sm">
                    <Tbody>
                        {chartData.map(option => (
                            <Tr key={option.optionId}>
                                <Td w="90%" position="relative" py={0} paddingInlineStart={1}>
                                    <Box
                                        position="absolute"
                                        left={0}
                                        top={1}
                                        bottom={1}
                                        width={`${Math.max(option.percentage * 100, 20)}%`}
                                        bg={option.color}
                                        borderRadius="md"
                                        transition="width 0.3s ease-in-out"
                                    />
                                    <Text
                                        position="relative"
                                        zIndex={1}
                                        color="white"
                                        fontSize="xs"
                                        fontWeight="medium"
                                    >
                                        {option.displayText}
                                    </Text>
                                </Td>
                                <Td p={0} w="12px" paddingInline={1}>
                                    {option.percentage === maxPercentage && (
                                        <StarIcon w={3} h={3} color="yellow.400" />
                                    )}
                                </Td>
                                <Td textAlign="right" py={2} whiteSpace="nowrap" paddingInline={1}>
                                    <Text fontSize="xs" color="gray.300">
                                        {(option.percentage * 100).toFixed(0)}%
                                    </Text>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
};