import React from "react";
import { Flex, Heading, Text, Box } from "@chakra-ui/react";
import { EventStatus } from "../../types";
import QueuePosition from "../QueuePosition";

interface TicketQueueViewProps {
    queuePosition: number | null;
    showQueue: boolean;
    accessCodes: any[];
    isEventLiveOrUpcoming: boolean;
    isLoadingQueuePosition: boolean;
    queuePositionError: string | null;
    totalInQueue: number | null;
    userTicketQueueData: any;
    eventStatus: EventStatus;
}

/**
 * Component to display the ticket queue view for the user with their position in the queue
 */
const TicketQueueView: React.FC<TicketQueueViewProps> = ({
    queuePosition,
    showQueue,
    accessCodes,
    isEventLiveOrUpcoming,
    isLoadingQueuePosition,
    queuePositionError,
    totalInQueue,
    userTicketQueueData,
    eventStatus,
}) => {
    if (
        !queuePosition ||
        !showQueue ||
        accessCodes?.length > 0 ||
        !isEventLiveOrUpcoming
    ) {
        return null;
    }

    if (isLoadingQueuePosition) {
        return (
            <Flex>
                <Text
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    textAlign="center"
                    color="gray.500"
                    zIndex={1}
                >
                    Loading queue position...
                </Text>
            </Flex>
        );
    }

    if (queuePositionError) {
        return <Text>Error loading queue position. Please try again.</Text>;
    }

    return (
        <Flex
            position="relative"
            direction="column"
            align="center"
            justify="center"
            minH="400px"
        >
            <Heading mb={6}>You are in the Queue</Heading>
            <Box>
                <Text>
                    Your position: {queuePosition} out of {totalInQueue}
                </Text>
            </Box>
            <QueuePosition
                queuePosition={queuePosition}
                totalInQueue={totalInQueue}
                userTicketQueueData={userTicketQueueData}
            />
            {eventStatus === EventStatus.UPCOMING && (
                <Text mt={4} fontStyle="italic">
                    {`The event hasn't started yet. We'll notify you when tickets become available.`}
                </Text>
            )}
        </Flex>
    );
};

export default React.memo(TicketQueueView);
