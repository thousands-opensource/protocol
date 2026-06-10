import { darkenHexColor } from '@/utils/util';
import { Box, Button, Text, Flex } from '@chakra-ui/react';

type FilledVoteButtonProps = {
    displayText: string;
    color: string;
    votes: number;
    totalVotes: number;
    isWinner: boolean;
    isCompleted: boolean;
    numberOfOptions: number;
};

export const FilledVoteButton: React.FC<FilledVoteButtonProps> = ({
    displayText,
    color,
    votes,
    totalVotes,
    isWinner,
    isCompleted,
    numberOfOptions
}) => {
    const fillPercentage = Math.max((votes / totalVotes) * 100, 0);
    const votePercentage = (totalVotes < 1 ? "0%" : `${Math.round((votes / totalVotes) * 100)}%`);

    return (
        <Box
            bg="whiteAlpha.100"
            p={"3px"}
            borderRadius="md"
        >
            <Button
                cursor="default"
                position="relative"
                overflow="hidden"
                w="full"
                h="28px"
                px={1}
                py={numberOfOptions <= 2 ? 8 : 1}
                bg="#606060"
                border="1px solid"
                borderColor={(isWinner) ? color : "transparent"}
                _hover={{ bg: "#606060" }}
                disabled
            >
                <Box
                    position="absolute"
                    left={0}
                    top={0}
                    bottom={0}
                    width={`${fillPercentage}%`}
                    bg={(isWinner || !isCompleted) ?  undefined: "#8e8e8e"}
                    bgGradient={(isWinner || !isCompleted) ? `linear(to-b, ${color}, ${darkenHexColor(color, 60)})` : undefined}
                    transition="all 0.3s ease-in-out"
                />
                <Flex
                    position="relative"
                    zIndex={1}
                    w="full"
                    justify="space-between"
                    align="center"
                    gap={1}
                    pl="3px"
                    pr="3px"
                >
                    <Text
                        fontSize="9pt"
                        fontWeight="normal"
                        lineHeight={1.0}
                        color="white"
                        whiteSpace="normal"
                        wordBreak="break-word"
                        textAlign="left"
                        flex="1"
                    >
                        {displayText}
                    </Text>
                    {isCompleted && (           
                    <Text
                        fontSize={isWinner ? "10pt" : "10pt"}
                        fontWeight={isWinner ? "bold" : "normal"}
                        color="white"
                        whiteSpace="nowrap"
                    >
                        {votePercentage}
                    </Text>          
                    )}
                </Flex>
            </Button>
        </Box>
    );
};