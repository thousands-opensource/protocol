import React from "react";
import { Flex, Heading, Text, Image, Divider } from "@chakra-ui/react";
import {
    ticketCarouselFlexSx,
    eventTicketSectionContentsFlex,
    selectedCurrentTicketFlexSx,
} from "../styles";
import { IAccessCode, IClaimedTicket } from "@repo/interfaces";
import { TicketType } from "../../constants";
import { EventStatus } from "../../types";
import { baseTicketTypes } from "../../config";

interface TicketViewHeaderProps {
    claimedTicket: IClaimedTicket | null;
    selectedTicketIndex: number | null;
    eventTickets: TicketType[];
    eventStatus: EventStatus;
    accessCodes: IAccessCode[];
    hasClaimedAccessCodeForEvent: boolean;
}

/**
 * Component to display the ticket view header
 */
const TicketViewHeader: React.FC<TicketViewHeaderProps> = ({
    claimedTicket,
    selectedTicketIndex,
    eventTickets,
    eventStatus,
    hasClaimedAccessCodeForEvent,
}) => {
    if (!hasClaimedAccessCodeForEvent || eventStatus !== EventStatus.LIVE) {
        return null;
    }

    const showClaimInstructions =
        !claimedTicket && hasClaimedAccessCodeForEvent;

    return (
        <>
            <Flex sx={ticketCarouselFlexSx}>
                <Flex sx={eventTicketSectionContentsFlex}>
                    <Heading fontSize="28px">
                        {claimedTicket
                            ? "Ticket Claimed"
                            : "Enter Queue to claim your Ticket"}
                    </Heading>
                    {showClaimInstructions && (
                        <>
                            <Text color="gray.500">
                                No ticket found. Please enter the queue
                            </Text>

                            {/* <Text color="gray.500">
                                Choose the best Ticket to enter the event.
                            </Text>
                            <Text
                                fontSize="xs"
                                sx={{ textTransform: "none" }}
                                color="gray.500"
                            >
                                Select the ticket you want to claim for this
                                event. Unclaimed tickets will carry over to the
                                next event.
                            </Text> */}
                        </>
                    )}
                </Flex>
                {/* {selectedTicketIndex !== null && (
                    <Flex sx={selectedCurrentTicketFlexSx}>
                        <>
                            <Image
                                w="75px"
                                src={
                                    claimedTicket
                                        ? baseTicketTypes[selectedTicketIndex]
                                              ?.imageSrc
                                        : eventTickets[selectedTicketIndex]
                                              ?.imageSrc
                                }
                                alt="Current Ticket"
                            />
                            <Text color="gray.500" fontSize={"xs"}>
                                Current Ticket
                            </Text>
                        </>
                    </Flex>
                )} */}
            </Flex>

            {/* {showClaimInstructions && (
                <Divider orientation="horizontal" my="20px" />
            )} */}
        </>
    );
};

export default TicketViewHeader;
