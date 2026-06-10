import React, { useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    HStack,
    Flex,
    useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface VotingOption {
    optionId: string;
    displayText: string;
    color: string;
    buttonText: string;
}

const mockVotingOptions: VotingOption[] = [
    {
        optionId: '1',
        displayText: 'Option One',
        color: 'purple.500',
        buttonText: 'Vote One'
    },
    {
        optionId: '2',
        displayText: 'Option Two',
        color: 'green.500',
        buttonText: 'Vote Two'
    },
    {
        optionId: '3',
        displayText: 'Option Three',
        color: 'yellow.500',
        buttonText: 'Vote Three'
    },
    {
        optionId: '4',
        displayText: 'Option Four',
        color: 'pink.500',
        buttonText: 'Vote Four'
    }
];

export const VotingButtons = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const isMobile = useBreakpointValue({ base: true, md: false });

    const handleNext = () => {
        setCurrentIndex(prev =>
            prev + 1 >= mockVotingOptions.length - 1 ? 0 : prev + 1
        );
    };

    const handlePrev = () => {
        setCurrentIndex(prev =>
            prev - 1 < 0 ? mockVotingOptions.length - 2 : prev - 1
        );
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNext();
        }
        if (isRightSwipe) {
            handlePrev();
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    // Get current and next option
    const currentOption = mockVotingOptions[currentIndex];
    const nextOption = mockVotingOptions[currentIndex + 1] || mockVotingOptions[0];

    if (isMobile) {
        return (
            <Box w="full" overflow="hidden">
                <Flex
                    overflowX="auto"
                    gap={2}
                    py={2}
                    sx={{
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        "&::-webkit-scrollbar": {
                            display: "none"
                        }
                    }}
                >
                    {mockVotingOptions.map(option => (
                        <Button
                            key={option.optionId}
                            size="lg"
                            bg={option.color}
                            _hover={{ bg: `${option.color.split('.')[0]}.600` }}
                            onClick={() => {
                                console.log(`Voted for option: ${option.optionId}`);
                            }}
                            flexShrink={0}
                            w="160px"
                            scrollSnapAlign="start"
                        >
                            {option.buttonText}
                        </Button>
                    ))}
                </Flex>
            </Box>
        );
    }

    return (
        <Box w="full">
            <HStack spacing={2} justify="space-between" align="center">
                <IconButton
                    aria-label="Previous option"
                    icon={<ChevronLeftIcon />}
                    onClick={handlePrev}
                    size="sm"
                    variant="ghost"
                    color="white"
                />

                <Flex
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    gap={2}
                    flex={1}
                    justify="center"
                >
                    <Button
                        size="lg"
                        bg={currentOption.color}
                        _hover={{ bg: `${currentOption.color.split('.')[0]}.600` }}
                        onClick={() => {
                            console.log(`Voted for option: ${currentOption.optionId}`);
                        }}
                        flex={1}
                        w="120px"
                    >
                        {currentOption.buttonText}
                    </Button>
                    <Button
                        size="lg"
                        bg={nextOption.color}
                        _hover={{ bg: `${nextOption.color.split('.')[0]}.600` }}
                        onClick={() => {
                            console.log(`Voted for option: ${nextOption.optionId}`);
                        }}
                        flex={1}
                        w="120px"
                    >
                        {nextOption.buttonText}
                    </Button>
                </Flex>

                <IconButton
                    aria-label="Next option"
                    icon={<ChevronRightIcon />}
                    onClick={handleNext}
                    size="sm"
                    variant="ghost"
                    color="white"
                />
            </HStack>
        </Box>
    );
};