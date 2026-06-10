import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
    Flex,
    Box,
    Image,
    Button,
    Heading,
    Text,
    Portal,
    Link,
    Divider,
    IconButton,
} from "@chakra-ui/react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    RepeatIcon,
} from "@chakra-ui/icons";
import TicketViewHeader from "./TicketViewHeader";
import { IAccessCode, IClaimedTicket, IStage } from "@repo/interfaces";
import { TicketType } from "../../constants";
import { EventStatus } from "../../types";
import {
    ticketCarouselContainerSx,
    carouselContainerSx,
    arrowButtonSx,
    ticketsContainerSx,
    ticketBoxSx,
    ticketImageSx,
    ticketNameTextSx,
    selectTicketButtonSX,
    confirmButtonSx,
} from "../styles";
import { claimedTicketTextStatusJSX } from "@/utils/eventUtil";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { useEnterEvent } from "@/hooks/events/useEnterEvent";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import CountDownTimer from "../../../../components/CountdownTimer";
import RoninSkipTheLine from "@/features/Event/EventsSeries/_ui/RoninSkipTheLine";
import { AxiosResponse } from "axios";
import PositionsInQueue from "./PositionsInQueue";

interface TicketCarouselViewProps {
    claimedTicket: IClaimedTicket | null;
    selectedTicketIndex: number | null;
    eventTickets: TicketType[];
    eventStatus: EventStatus;
    eventStartDate: string;
    visibleItems: number;
    visibleTickets: TicketType[];
    isEventLive: boolean;
    isClaimingTicket: boolean;
    handleTicketSelection: (index: number) => void;
    prevTicket: () => void;
    nextTicket: () => void;
    handleConfirmSelectedTicketToClaim: () => Promise<boolean | undefined>;
    startIndex: number;
    event: IStage;
    accessCodes: IAccessCode[];
    serverCode: string;
    getPositionInQueue: () => Promise<AxiosResponse<any, any>>;
    numberAheadOfMe: number;
    setNumberAheadOfMe: Dispatch<SetStateAction<number>>;
    placeInLine: number;
    setPlaceInLine: Dispatch<SetStateAction<number>>;
    totalInLine: number;
    setTotalInLine: Dispatch<SetStateAction<number>>;
    showEnterEvent: boolean;
    setShowEnterEvent: Dispatch<SetStateAction<boolean>>;
}

/**
 * Component to display the ticket carousel view
 */
const TicketCarouselView: React.FC<TicketCarouselViewProps> = ({
    claimedTicket,
    selectedTicketIndex,
    eventTickets,
    eventStatus,
    eventStartDate,
    visibleItems,
    visibleTickets,
    isEventLive,
    isClaimingTicket,
    handleTicketSelection,
    prevTicket,
    nextTicket,
    handleConfirmSelectedTicketToClaim,
    startIndex,
    event,
    accessCodes,
    serverCode,
    getPositionInQueue,
    numberAheadOfMe,
    setNumberAheadOfMe,
    placeInLine,
    setPlaceInLine,
    totalInLine,
    setTotalInLine,
    showEnterEvent,
    setShowEnterEvent,
}) => {
    const [isLeftDisabled, setIsLeftDisabled] = useState<boolean>(true);
    const [isRightDisabled, setIsRightDisabled] = useState<boolean>(false);
    const [isRefreshLoading, setIsRefreshLoading] = useState<boolean>(false);

    const [isEnteringEventWhileLive, setIsEnteringEventWhileLive] =
        useState<boolean>(false);
    const eventId = event._id?.toString() || "";
    const { userDB } = useWildfileUserContext();

    const userId = userDB?._id?.toString();

    // Check if the user has claimed a ticket for the specific event
    const hasClaimedAccessCodeForEvent = accessCodes.some((code) => {
        const matchingUser = code.claimedUsers.find(
            (user) =>
                user.claimedBy.toString() === userId &&
                (!user.claimedCodeEventId ||
                    user.claimedCodeEventId.toString() === eventId)
        );

        if (matchingUser) {
            return true;
        }

        return false;
    });

    const { onMessage } = useInfoNotifications();

    useEffect(() => {
        setIsLeftDisabled(startIndex === 0);
        setIsRightDisabled(startIndex + visibleItems >= eventTickets.length);
    }, [startIndex, visibleItems, eventTickets.length]);

    useEffect(() => {
        setIsLeftDisabled(startIndex === 0);
        setIsRightDisabled(startIndex >= eventTickets.length - visibleItems);
    }, [startIndex, visibleItems, eventTickets.length]);

    // Redirect the user to the event stream
    const { isEntering, fetchStreamId, enterEvent } = useEnterEvent();

    // Handle the prev ticket click on the carousel
    const handlePrevClick = () => {
        if (!isLeftDisabled) {
            prevTicket();
        }
    };

    const handleNextClick = () => {
        if (!isRightDisabled) {
            nextTicket();
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshLoading(true);
            const positionResponse = await getPositionInQueue();
            const position = positionResponse.data;

            if (
                position.LetUserInNow ||
                (position.PlaceInLine > -1 && position.NumberAheadOfMe < 1)
            ) {
                setShowEnterEvent(true);
            }

            setNumberAheadOfMe(
                position.NumberAheadOfMe === -1 ? 0 : position.NumberAheadOfMe
            );
            setPlaceInLine(position.PlaceInLine);
            setTotalInLine(
                position.TotalInLine === -1 ? 0 : position.TotalInLine
            );
            setIsRefreshLoading(false);
        } catch (e: any) {
            console.error("Error failed to get updated position from queue");
            setIsRefreshLoading(false);
            return;
        }
    };

    /**
     * Handle the enter event click while live event (including claiming the ticket)
     */
    const handleEnterEventClick = async () => {
        setIsEnteringEventWhileLive(true);

        const isTicketClaimed = await handleConfirmSelectedTicketToClaim();

        if (!isTicketClaimed) {
            setIsEnteringEventWhileLive(false);
            onMessage({
                title: "Error",
                description: "Failed to claim ticket. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const streamId = await fetchStreamId(eventId || "");

        if (streamId) {
            enterEvent(streamId);
        }
    };

    /**
     * Handle the enter event click
     */
    const handleEnterEvent = async () => {
        const streamId = await fetchStreamId(eventId || "");
        if (streamId) {
            enterEvent(streamId);
        } else {
            onMessage({
                title: "Error",
                description: "Unable to enter event. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    /**
     * Loader shown during entering the event
     */
    const renderLoadingEnteringEventOverlayJSX = () => {
        if (isEnteringEventWhileLive) {
            return (
                <Portal>
                    <LoadingOverlay message="Entering Event..." />
                </Portal>
            );
        }
    };

    return (
        <>
            {renderLoadingEnteringEventOverlayJSX()}

            <Flex sx={ticketCarouselContainerSx}>
                {/*<TicketViewHeader
                    claimedTicket={claimedTicket}
                    selectedTicketIndex={selectedTicketIndex}
                    eventTickets={eventTickets}
                    eventStatus={eventStatus}
                    accessCodes={accessCodes}
                    hasClaimedAccessCodeForEvent={hasClaimedAccessCodeForEvent}
                />*/}

                {
                    //Render if EventStatus.UPCOMING
                    eventStatus === EventStatus.UPCOMING && (
                        <Flex direction="column" align="left" justify="center">
                            <CountDownTimer eventTime={eventStartDate} />
                        </Flex>
                    )
                }

                {
                    //Render if EventStatus.COMPLETED
                    eventStatus === EventStatus.COMPLETED && (
                        <Flex direction="column" align="left" justify="center">
                            <Text mb={4}>The event has already ended.</Text>
                        </Flex>
                    )
                }

                {
                    //Render if EventStatus.LIVE, no claimed ticket
                    eventStatus === EventStatus.LIVE &&
                        !claimedTicket &&
                        !showEnterEvent && (
                            <Flex
                                direction={[
                                    "column",
                                    "column",
                                    "row",
                                    "row",
                                    "row",
                                ]}
                                align={[
                                    "center",
                                    "center",
                                    "flex-start",
                                    "flex-start",
                                    "flex-start",
                                ]}
                                justify="center"
                            >
                                <Box
                                    sx={{
                                        flex: "1 0 0",
                                        mb: "10px",
                                    }}
                                >
                                    <Link
                                        target="_blank"
                                        href="https://magiceden.us/collections/polygon/0xef41141fbc0a7c870f30fee81c6214582dc2a494"
                                        maxWidth="300px"
                                    >
                                        <Image
                                            src="/images/skipthelinewildpass.png"
                                            alt="Skip the line with a wildpass"
                                            maxW="250px"
                                        />
                                    </Link>
                                </Box>
                                {/* <Box
                                sx={{
                                    w: "50%",
                                }}
                            >
                                <Text>
                                    Links to enter this event will be provided
                                    in Discord.
                                </Text>
                            </Box> */}
                                <PositionsInQueue
                                    numberAheadOfMe={numberAheadOfMe}
                                    setNumberAheadOfMe={setNumberAheadOfMe}
                                    placeInLine={placeInLine}
                                    totalInLine={totalInLine}
                                    setPlaceInLine={setPlaceInLine}
                                    setTotalInLine={setTotalInLine}
                                    setShowEnterEvent={setShowEnterEvent}
                                    handleRefresh={handleRefresh}
                                    isRefreshLoading={isRefreshLoading}
                                    stageId={event._id!.toString()}
                                />
                            </Flex>
                        )
                }

                {
                    //Render if EventStatus.LIVE and you have a claimed ticket
                    eventStatus === EventStatus.LIVE &&
                        (claimedTicket || showEnterEvent) && (
                            <Flex
                                direction="column"
                                align="center"
                                justify="center"
                                mt="2rem"
                            >
                                <Button
                                    sx={confirmButtonSx}
                                    isLoading={isEntering}
                                    onClick={handleEnterEvent}
                                    isDisabled={isEntering}
                                >
                                    Enter Event
                                </Button>
                            </Flex>
                        )
                }
                {/* {eventTickets.length > 0 && !claimedTicket && (
                    <Flex flexDirection="column" alignItems="center">
                        <Flex sx={carouselContainerSx}>
                            <Button
                                onClick={handlePrevClick}
                                disabled={isLeftDisabled}
                                sx={arrowButtonSx(isLeftDisabled)}
                                aria-label="Previous ticket"
                            >
                                <ChevronLeftIcon boxSize={8} />
                            </Button>

                            <Flex sx={ticketsContainerSx(visibleItems)}>
                                {visibleTickets.map((ticket, index) => {
                                    const isSelected =
                                        selectedTicketIndex ===
                                        startIndex + index;
                                    const isEventCompleted =
                                        eventStatus === EventStatus.COMPLETED;

                                    const eventTicketIndex =
                                        eventTickets.findIndex(
                                            (t) => t.tier === ticket.tier
                                        );

                                    return (
                                        <Box
                                            key={ticket.id}
                                            sx={ticketBoxSx(isSelected)}
                                            onClick={() =>
                                                handleTicketSelection(
                                                    eventTicketIndex
                                                )
                                            }
                                            opacity={
                                                !isEventLive || isEventCompleted
                                                    ? 0.5
                                                    : 1
                                            }
                                            cursor={
                                                !isEventLive || isEventCompleted
                                                    ? "not-allowed"
                                                    : "pointer"
                                            }
                                            gap="10px"
                                        >
                                            <Image
                                                src={ticket.imageSrc}
                                                alt={ticket.name}
                                                sx={ticketImageSx}
                                            />
                                            <Text
                                                sx={ticketNameTextSx(
                                                    ticket.color
                                                )}
                                            >
                                                {ticket.name}
                                            </Text>
                                            <Button
                                                style={selectTicketButtonSX}
                                                bg="unset"
                                                size="sm"
                                                isDisabled={
                                                    !isEventLive ||
                                                    isEventCompleted
                                                }
                                            >
                                                {claimedTicketTextStatusJSX(
                                                    !!ticket?.isClaimed,
                                                    isEventCompleted,
                                                    isSelected,
                                                    isEventLive
                                                )}
                                            </Button>
                                        </Box>
                                    );
                                })}
                            </Flex>

                            <Button
                                onClick={handleNextClick}
                                disabled={isRightDisabled}
                                sx={arrowButtonSx(isRightDisabled)}
                                aria-label="Next ticket"
                            >
                                <ChevronRightIcon boxSize={8} />
                            </Button>
                        </Flex>
                        <Button
                            sx={confirmButtonSx}
                            isLoading={isClaimingTicket || isEntering}
                            isDisabled={
                                selectedTicketIndex === null || !isEventLive
                            }
                            onClick={handleEnterEventClick}
                        >
                            {eventStatus === EventStatus.LIVE
                                ? "Enter Event"
                                : "Claim Ticket"}
                        </Button>
                    </Flex>
                )} */}
            </Flex>
        </>
    );
};

export default TicketCarouselView;
