import React, { useEffect, useState } from 'react';
import {
    Box,
    IconButton,
    Flex,
    useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { VotingStreamApp } from './VotingStreamApp/VotingStreamApp';
import { useVotingStore, VotingState } from '@/store/useVotingStore';

type StreamApp = {
    id: string;
    name: string;
    component: React.ReactNode;
};

const streamApps: StreamApp[] = [
    {
        id: 'voting',
        name: 'Voting',
        component: <VotingStreamApp />
    },
    // {
    //     id: 'skybox',
    //     name: 'Skybox',
    //     component: <div>Skybox</div>
    // }
];

export const StreamAppLower = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const isMobile = useBreakpointValue({ base: true, md: false });

    const { currentState: votingState, startVoting, simulateVoteUpdates } = useVotingStore();

    /*
    useEffect(() => {
        setTimeout(() => {
            startVoting({
                title: "Who's taking home the trophy?",
                options: [
                    { optionId: '1', displayText: 'Option One', color: '#A855F7' },
                    { optionId: '2', displayText: 'Option Two', color: '#22C55E' },
                    { optionId: '3', displayText: 'Option Three', color: '#EAB308' },
                    { optionId: '4', displayText: 'Option Four', color: '#EC4899' }
                ],
                duration: 10,
                initialVotes: 0,
                stageId: '1'
            });

            simulateVoteUpdates();
        }, 1);
    }, []);
    */

    // Filter stream apps based on voting state
    const activeStreamApps = streamApps.filter(app => {
        if (app.id === 'voting') {
            return votingState !== VotingState.INACTIVE;
        }
        return true;
    });

    if (activeStreamApps.length === 0) {
        return null;
    }

    if (activeStreamApps.length === 1) {
        return (
            <Box w="full">
                {activeStreamApps[0].component}
            </Box>
        );
    }

    const handleNext = () => {
        setCurrentIndex(prev =>
            prev + 1 >= activeStreamApps.length ? 0 : prev + 1
        );
    };

    const handlePrev = () => {
        setCurrentIndex(prev =>
            prev - 1 < 0 ? activeStreamApps.length - 1 : prev - 1
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

    return (
        <Box w="full" position="relative">
            <Flex
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                w="full"
                position="relative"
                transition="transform 0.3s ease-in-out"
            >
                {activeStreamApps[currentIndex].component}
            </Flex>

            {!isMobile && (
                <>
                    <IconButton
                        aria-label="Previous app"
                        icon={<ChevronLeftIcon />}
                        onClick={handlePrev}
                        size="md"
                        variant="ghost"
                        color="white"
                        position="absolute"
                        left={2}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={2}
                    />
                    <IconButton
                        aria-label="Next app"
                        icon={<ChevronRightIcon />}
                        onClick={handleNext}
                        size="md"
                        variant="ghost"
                        color="white"
                        position="absolute"
                        right={2}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={2}
                    />
                </>
            )}
        </Box>
    );
};