import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Flex,
    IconButton,
    Input,
    Stack,
    Text,
    VStack,
    HStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Skeleton,
    useToast,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { THEME_COLOR_DARK_GOLDEN_YELLOW, toastDefaultOptions } from '@/constants/constants';
import waxios from '@/utils/waxios';
import { getIvsVotingStreamAppUrl } from '@/utils/environmentUtilWCA';


export type VoteOption = {
    id: string;
    name: string;
    color: string;
};

type Vote = {
    id: string;
    question: string;
    options: VoteOption[];
    voteDuration: number;
    stageId: string;
};

type VoteResult = {
    name: string;
    numberOfVotes: number;
};

type VoteHistoryResponse = {
    Success: boolean;
    Data: [{
        stageId: string;
        voteTitle: string;
        voteOptionResults: VoteResult[];
    }];
    ErrorMessage: string;
};

export const VOTE_TEAM_COLORS = [
    '#ffad00', // 
    '#ff08af', // 
    '#993bff', // 
    '#00a7ff', // 
    '#97d400', // 
    '#ff4800', // 
];

const voteUrl = getIvsVotingStreamAppUrl();

export const VotingConfigSection = ({ stageId }: { stageId: string }) => {
    const toast = useToast();

    const [vote, setVote] = useState<Vote>({
        id: "1",
        question: "Vote 1",
        options: [
            { id: '1', name: 'Red', color: VOTE_TEAM_COLORS[0] },
            { id: '2', name: 'Blue', color: VOTE_TEAM_COLORS[1] },
        ],
        voteDuration: 60,
        stageId
    });

    const [voteHistory, setVoteHistory] = useState<VoteHistoryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchVoteHistory = async () => {
        setIsLoading(true);
        try {
            const response = await waxios.get<VoteHistoryResponse>(
                `${voteUrl}/history?stageId=${stageId}`
            );
            setVoteHistory(response.data);
        } catch (error) {
            console.error('Failed to fetch vote history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVoteHistory();
    }, [stageId]);

    const updateVote = (updates: Partial<Vote>) => {
        setVote(prev => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        const formattedVote = {
            stageId: vote.stageId,
            voteConfig: {
                voteTitle: vote.question,
                voteTimeSeconds: vote.voteDuration,
                voteOptions: vote.options.map(opt => opt.name)
            }
        }
        var startVoteResponse = await waxios.post(`${voteUrl}/start`, formattedVote);

        if (startVoteResponse.status === 200)
        {
            toast({
                ...toastDefaultOptions,
                description: "Started Vote Successfully",
                status: "success",
                duration: 3000,
            });
        } else {
            toast({
                ...toastDefaultOptions,
                description: "Error starting vote.  Vote not started!",
                status: "error",
                duration: 7000,
            });
        }
    };

    const handleHideVote = async () => {
        console.log("hide vote stageId: ", stageId);
        var hideVoteResponse = await waxios.post(`${voteUrl}/hide`, { stageId });

        if (hideVoteResponse.status === 200)
        {
            toast({
                ...toastDefaultOptions,
                description: "Hid Vote Successfully",
                status: "success",
                duration: 3000,
            });
        } else {
            toast({
                ...toastDefaultOptions,
                description: "Error hiding vote.  Vote not hid!",
                status: "error",
                duration: 7000,
            });
        }
    };

    const renderVoteHistory = () => {
        if (isLoading) {
            return <Skeleton height="200px" />;
        }

        if (!voteHistory?.Data) {
            return <Text color="gray.500">No vote history available</Text>;
        }

        const voteHistoryVotes = voteHistory.Data;

        return (
            <Table size="sm" variant="simple">
                <Thead>
                    <Tr>
                        <Th>Vote Title</Th>
                        <Th>Total Votes</Th>
                        <Th>Results</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {voteHistoryVotes.map((voteResult, voteIndex) => (
                    <Tr key={voteIndex}>
                        <Td>{voteResult.voteTitle}</Td>
                        <Td>{voteResult.voteOptionResults.reduce((sum, item) => sum + item.numberOfVotes, 0)}</Td>
                        <Td>
                            {voteResult.voteOptionResults.map((result, index) => (
                                <Text key={result.name} fontSize="xs">
                                    {result.name}: {result.numberOfVotes}
                                    {index < voteResult.voteOptionResults.length - 1 ? ', ' : ''}
                                </Text>
                            ))}
                        </Td>
                    </Tr>
                    ))}
                </Tbody>
            </Table>
            
        );
    };

    return (
        <Stack
            sx={{
                padding: '40px',
                borderRadius: '16px',
                border: '1px solid gray',
            }}
        >
            <Text fontSize="2xl" fontWeight="black" mb={4}>
                Vote Configuration
            </Text>

            <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                position="relative"
            >
                <Input
                    value={vote.question}
                    onChange={(e) => updateVote({ question: e.target.value })}
                    placeholder="Vote Question"
                    size="md"
                    maxW="560px"
                    fontWeight="bold"
                    mb={4}
                    maxLength={70}
                />

                <Box mb={4}>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Time Configuration
                    </Text>
                    <Stack spacing={4}>
                        <Flex gap={4} alignItems="center">
                            <Text fontSize="sm" w="120px">
                                Vote Duration:
                            </Text>
                            <Input
                                type="number"
                                value={vote.voteDuration}
                                onChange={(e) => updateVote({
                                    voteDuration: parseInt(e.target.value) || 0
                                })}
                                size="sm"
                                w="100px"
                                min={1}
                                max={3600}
                            />
                            <Text fontSize="sm">seconds</Text>
                        </Flex>
                    </Stack>
                </Box>

                <Box>
                    <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                    >
                        <Text fontSize="sm" fontWeight="medium" textTransform="none">
                            Options (max 6) - The max length of each option is 30, except when there are more than four options, then it is 16.
                        </Text>
                        <Button
                            onClick={() => {
                                const newOption = {
                                    id: (vote.options.length + 1).toString(),
                                    name: `Option ${vote.options.length + 1}`,
                                    color: VOTE_TEAM_COLORS[vote.options.length % VOTE_TEAM_COLORS.length],
                                };
                                updateVote({
                                    options: [...vote.options, newOption],
                                });
                            }}
                            size="xs"
                            isDisabled={vote.options.length >= 6}
                        >
                            Add Option
                        </Button>
                    </Flex>
                    <VStack spacing={2} align="stretch">
                        {vote.options.map((option, optionIndex) => (
                            <Flex
                                key={option.id}
                                gap={4}
                                alignItems="center"
                            >
                                <Box
                                    w="4px"
                                    h="24px"
                                    bg={option.color}
                                    borderRadius="full"
                                />
                                <Input
                                    value={option.name}
                                    onChange={(e) => {
                                        const updatedOptions = [...vote.options];
                                        updatedOptions[optionIndex] = {
                                            ...option,
                                            name: e.target.value,
                                        };
                                        updateVote({ options: updatedOptions });
                                    }}
                                    placeholder="Team Name"
                                    size="sm"
                                    maxW="300px"
                                    maxLength={vote.options.length > 4 ? 16 : 30}
                                />
                                {optionIndex >= 2 && (
                                    <IconButton
                                        aria-label="Remove team"
                                        icon={<CloseIcon />}
                                        onClick={() => {
                                            const updatedOptions = vote.options.filter(
                                                (_, i) => i !== optionIndex
                                            );
                                            updateVote({ options: updatedOptions });
                                        }}
                                        size="sm"
                                        variant="ghost"
                                    />
                                )}
                            </Flex>
                        ))}
                    </VStack>
                </Box>
            </Box>

            <Flex justifyContent="flex-end" mt={4}>
                <HStack spacing={2}>
                    <Button
                        onClick={handleHideVote}
                        variant="outline"
                        size="sm"
                        colorScheme="red"
                    >
                        Hide Vote
                    </Button>
                    <Button
                        onClick={handleSave}
                        bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                        size="sm"
                    >
                        Start Vote
                    </Button>
                </HStack>
            </Flex>

            <Box mt={8}>
                <Text fontSize="xl" fontWeight="bold" mb={4}>
                    Vote History
                </Text>
                <Button
                    onClick={fetchVoteHistory}
                    bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                        size="sm"
                >
                    Refresh
                </Button>
                {renderVoteHistory()}
            </Box>
        </Stack>
    );
};