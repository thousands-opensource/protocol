import React from "react";
import { Flex, Heading, Text, Button } from "@chakra-ui/react";
import { selectTicketButtonSX } from "../styles";
import { EventStatus } from "../../types";

interface JoinQueueViewProps {
    eventTickets: any[];
    claimedTicket: any;
    handleJoinQueue: () => void;
    isEventLiveOrUpcoming: boolean;
    eventStatus: EventStatus;
}

/**
 * Component to display the join queue view
 */
const JoinQueueView: React.FC<JoinQueueViewProps> = ({
    eventTickets,
    claimedTicket,
    handleJoinQueue,
    isEventLiveOrUpcoming,
    eventStatus,
}) => {
    const renderQueueTitle = () => {
        /**
         * Display the appropriate message based on the event status
         */
        if (eventStatus === EventStatus.COMPLETED) {
            return (
                <>
                    <Heading mb={6}>Event Completed</Heading>
                    <Text mb={4}>
                        The event has ended. Stay tuned for the next event.
                    </Text>
                </>
            );
        } else if (eventStatus === EventStatus.LIVE) {
            return (
                <>
                    <Heading mb={6}>Event is Live</Heading>
                    <Text mb={4}>Join the queue to claim a ticket.</Text>
                </>
            );
        } else {
            return (
                <>
                    <Heading mb={6}>No Tickets Available Yet</Heading>
                    <Text mb={4}>
                        Join the queue to be notified when tickets become
                        available.
                    </Text>
                </>
            );
        }
    };

    if (eventTickets.length === 0 && !claimedTicket) {
        return (
            <Flex direction="column" align="center" justify="center">
                {renderQueueTitle()}
                <Button
                    sx={selectTicketButtonSX}
                    onClick={handleJoinQueue}
                    isDisabled={!isEventLiveOrUpcoming}
                >
                    Join Queue
                </Button>
            </Flex>
        );
    }

    return null;
};

export default JoinQueueView;
