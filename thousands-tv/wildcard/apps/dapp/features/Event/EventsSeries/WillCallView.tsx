import React, { useState, useEffect, useMemo } from "react";
import { Button, Flex, Spinner } from "@chakra-ui/react";
import { TicketType } from "../constants";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import useClaimTicket, {
    ClaimTicketParams,
} from "@/hooks/claimedTickets/useClaimedTicket";
import { IStage } from "@repo/interfaces";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { determineEventStatus } from "@/utils/eventUtil";
import { EventStatus } from "../types";
import axios from "axios";
import { useAccessCodes } from "@/hooks/accessCode/useAccessCode";
import { baseTicketTypes } from "../config";
import { useJoinTicketQueue } from "@/hooks/ticketQueue/useJoinTicketQueue";
import TicketCarouselView from "./_ui/TicketCarousel";
import useVerifyOrClaimTicket from "@/hooks/claimedTickets/useVerifyOrClaimTicket";
import Cookies from "js-cookie";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { getQueueApiUrl } from "../../../utils/environmentUtilWCA";

interface WillCallViewProps {
    event: IStage;
    visibleItems?: number;
    serverCode: string;
}

/**
 * Renders the Will Call view for the event.
 */
const WillCallView: React.FC<WillCallViewProps> = ({
    event,
    visibleItems = 3,
    serverCode,
}) => {
    const [isLoadingComponents, setIsLoadingComponents] =
        useState<boolean>(true); // handles loading state for all components (during mount)

    const { userDB } = useWildfileUserContext();
    const [startIndex, setStartIndex] = useState<number>(0);
    const [selectedTicketIndex, setSelectedTicketIndex] = useState<
        number | null
    >(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] =
        useState<boolean>(false);

    const [eventTickets, setEventTickets] =
        useState<TicketType[]>(baseTicketTypes);
    const [isPromoCodeInputVisible, setPromoCodeInputVisible] =
        useState<boolean>(false);
    const [promoCode, setPromoCode] = useState<string>("");
    const [placeInLine, setPlaceInLine] = useState<number>(-1);
    const [numberAheadOfMe, setNumberAheadOfMe] = useState<number>(0);
    const [totalInLine, setTotalInLine] = useState<number>(-1);
    const [showEnterEvent, setShowEnterEvent] = useState<boolean>(false);

    const { onMessage } = useInfoNotifications();

    const eventStatus = determineEventStatus(event);
    const eventStartDateStr = event.startDate.toString();
    const isEventLive = eventStatus === EventStatus.LIVE;
    const isEventLiveOrUpcoming =
        eventStatus === EventStatus.LIVE ||
        eventStatus === EventStatus.UPCOMING;

    const seriesId = useMemo(() => event.seriesId?.toString() || "", [event]);
    const eventId = useMemo(() => event._id?.toString() || "", [event]);
    const userId = useMemo(() => userDB?._id?.toString() || "", [userDB]);

    // Hooks for claiming/ fetching tickets
    const {
        isLoading: isClaimingTicket,
        error: claimTicketError,
        claimTicket,
    } = useClaimTicket();

    const {
        claimedTicket,
        isLoading: isFetchingTicket,
        verifyOrClaimTicket: reverifyOrClaimTicket,
    } = useVerifyOrClaimTicket({
        seriesId,
        eventId,
        isEventLive,
        userId,
    });

    const {
        accessCodes,
        isLoading: isLoadingAccessCodes,
        error: errorUserCodes,
        refetch: refetchAccessCodes,
    } = useAccessCodes(userId, eventId);

    // Ticket Queue hooks
    const [showQueue, setShowQueue] = useState<boolean>(false);
    const {
        joinQueue,
        isLoading: isJoiningQueue,
        error: joinQueueError,
    } = useJoinTicketQueue();

    // Get user's queue position
    // const {
    //     queuePosition,
    //     totalInQueue,
    //     userTicketQueueData,
    //     isLoading: isLoadingQueuePosition,
    //     error: queuePositionError,
    //     refetch: refetchQueuePosition,
    // } = useGetUserQueuePosition(
    //     userDB?._id?.toString() || "",
    //     event?.seriesId?.toString() || ""
    // );

    // Memoize the props for TicketQueueView to prevent unnecessary re-renders
    // const ticketQueueViewProps = useMemo(
    //     () => ({
    //         queuePosition,
    //         showQueue,
    //         accessCodes,
    //         isEventLiveOrUpcoming,
    //         isLoadingQueuePosition,
    //         queuePositionError,
    //         totalInQueue,
    //         userTicketQueueData,
    //         eventStatus,
    //     }),
    //     [
    //         queuePosition,
    //         showQueue,
    //         accessCodes,
    //         isEventLiveOrUpcoming,
    //         isLoadingQueuePosition,
    //         queuePositionError,
    //         totalInQueue,
    //         userTicketQueueData,
    //         eventStatus,
    //     ]
    // );

    /**
     * Manage the available tickets based on the user's access codes.
     */
    useEffect(() => {
        if (accessCodes && !isLoadingAccessCodes && userDB && userId) {
            const userDBId = userId.toString();
            const availableTickets = baseTicketTypes
                .filter((ticket) => {
                    const matchingAccessCode = accessCodes.find(
                        (code) => code.tier === ticket.tier
                    );
                    if (!matchingAccessCode) return false;

                    if (!userId) {
                        return;
                    }

                    const userHasClaimed = matchingAccessCode.claimedUsers.some(
                        (user) => user.claimedBy.toString() === userDBId
                    );

                    return userHasClaimed;
                })
                .map((ticket) => {
                    const matchingAccessCode = accessCodes.find(
                        (code) => code.tier === ticket.tier
                    );
                    return {
                        ...ticket,
                        isSelectable: true,
                        isClaimed: false, // We'll determine this when actually claiming the ticket
                    };
                });
            setEventTickets(availableTickets);

            // on load default to the first available ticket to select
            setStartIndex(0);
            setSelectedTicketIndex(0);
        } else {
            setEventTickets([]);
            setSelectedTicketIndex(null);
        }
    }, [accessCodes, isLoadingAccessCodes, userDB]);

    // if user has already got a access code then Show Queue
    // @dev - when re-implementing ticket queue, this logic should be updated to include !!queuePosition check
    useEffect(() => {
        if (accessCodes && accessCodes?.length > 0) {
            setShowQueue(true);
        }
    }, [accessCodes]);

    useEffect(() => {
        if (
            !claimedTicket &&
            eventTickets.length > 0 &&
            selectedTicketIndex === null
        ) {
            setSelectedTicketIndex(0);
        }
    }, [claimedTicket, eventTickets, selectedTicketIndex]);

    const nextTicket = () => {
        setStartIndex((prevIndex) =>
            Math.min(prevIndex + 1, eventTickets.length - visibleItems)
        );
    };

    const prevTicket = () => {
        setStartIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    const visibleTickets = eventTickets.slice(
        startIndex,
        startIndex + visibleItems
    );

    const getPositionInQueue = async () => {
        const wildcardAccessToken = Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD);
        const getPositionApiUrl = getQueueApiUrl() + "/getposition";
        const getPositionResults = await axios.post(
            getPositionApiUrl,
            {
                QueueId: eventId,
            },
            {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return getPositionResults;
    };

    // Refetch claimed ticket data when the event changes
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingComponents(true);
            try {
                const [, positionResults] = await Promise.all([
                    reverifyOrClaimTicket(),
                    // refetchQueuePosition(),
                    getPositionInQueue(),
                ]);

                const position = positionResults.data;

                if (
                    position.LetUserInNow ||
                    (position.PlaceInLine > -1 && position.NumberAheadOfMe < 1)
                ) {
                    setShowEnterEvent(true);
                }

                setNumberAheadOfMe(
                    position.NumberAheadOfMe === -1
                        ? 0
                        : position.NumberAheadOfMe
                );
                setPlaceInLine(position.PlaceInLine);
                setTotalInLine(position.TotalInLine);
            } catch (error) {
                console.error("Error loading data:", error);
                onMessage({
                    title: "Error",
                    description:
                        "Failed to load ticket information and queue. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoadingComponents(false);
            }
        };

        loadData();

        setStartIndex(0);
        setSelectedTicketIndex(null);
        setEventTickets(baseTicketTypes);
        setShowQueue(false);
        setPromoCodeInputVisible(false);
        setPromoCode("");
    }, [eventId]);

    // Check if the user has already claimed a ticket for this event
    useEffect(() => {
        if (
            accessCodes &&
            !isLoadingAccessCodes &&
            userDB &&
            userId &&
            event?._id
        ) {
            const userDBId = userId.toString();

            const availableTickets = baseTicketTypes.filter((ticket) => {
                const matchingAccessCodes = accessCodes.filter(
                    (code) => code.tier === ticket.tier
                );

                // Check if there's at least one unclaimed access code for this user
                const hasUnclaimedAccessCode = matchingAccessCodes.some(
                    (accessCode) => {
                        const userClaim = accessCode.claimedUsers.find(
                            (user) => user.claimedBy.toString() === userDBId
                        );

                        // The access code is available if the user has claimed it but the claimedCodeEventId is null
                        return (
                            userClaim && userClaim.claimedCodeEventId === null
                        );
                    }
                );

                return hasUnclaimedAccessCode;
            });

            setEventTickets(availableTickets);
            setStartIndex(0); // Reset the start index when available tickets change

            // If there's a claimed ticket, find its index and select it
            if (claimedTicket) {
                const claimedTicketIndex = baseTicketTypes.findIndex(
                    (ticket) => ticket.tier === claimedTicket.tier
                );

                if (claimedTicketIndex !== -1) {
                    setSelectedTicketIndex(claimedTicketIndex);
                    setEventTickets((prevTickets) =>
                        prevTickets.map((ticket, index) =>
                            index === claimedTicketIndex
                                ? { ...ticket, claimed: true }
                                : ticket
                        )
                    );
                }
            }
        }
    }, [accessCodes, isLoadingAccessCodes, userDB, event, claimedTicket]);

    // Handle the selection of a ticket
    const handleTicketSelection = (index: number) => {
        if (isEventLive) {
            setSelectedTicketIndex(index);
        }
    };

    /**
     * Handle the user confirming the selected ticket to claim.
     */
    const handleConfirmSelectedTicketToClaim = async () => {
        if (
            !event ||
            !eventId ||
            !userDB ||
            !userId ||
            selectedTicketIndex === null
        ) {
            onMessage({
                title: "Error",
                description: "Unable to claim ticket. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const selectedTicket = eventTickets[selectedTicketIndex];

        const matchingAccessCode = accessCodes.find(
            (code) =>
                code.tier === selectedTicket.tier &&
                code.claimedUsers.some(
                    (user) =>
                        user.claimedBy.toString() === userId &&
                        (!user.claimedCodeEventId ||
                            user.claimedCodeEventId.toString() === eventId)
                )
        );

        if (!matchingAccessCode) {
            onMessage({
                title: "Error",
                description: "No valid access code found for this ticket.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const claimParams: ClaimTicketParams = {
            userId: userId,
            eventId: eventId,
            tier: selectedTicket.tier as string,
            accessCode: matchingAccessCode.accessCode,
        };

        const claimResult = await claimTicket(claimParams);

        if (claimResult) {
            onMessage({
                title: "Success",
                description: "Ticket claimed successfully!",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            reverifyOrClaimTicket();
            refetchAccessCodes();
        } else {
            onMessage({
                title: "Error",
                description:
                    claimTicketError ||
                    "Failed to claim ticket. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        return claimResult;
    };

    /**
     * Handle the user joining the ticket queue.
     */
    const handleJoinQueue = async () => {
        if (!userId || !event?.seriesId) {
            onMessage({
                title: "Error",
                description:
                    "Unable to join queue. Missing user or event information.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            await joinQueue(userId.toString(), event.seriesId.toString());
            setShowQueue(true);
            // refetchQueuePosition();
            refetchAccessCodes();
        } catch (error) {
            onMessage({
                title: "Error",
                description: "Failed to join the queue. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (isFetchingTicket) {
        return <Flex>Loading ticket information...</Flex>;
    }

    /**
     * Render the Join Queue view or the Ticket Carousel view based on the user's status.
     */
    const renderWillCallViewJSX = () => {
        if (isLoadingComponents) {
            return;
        }

        // if (!showQueue) {
        //     return (
        //         <JoinQueueView
        //             eventTickets={eventTickets}
        //             claimedTicket={claimedTicket}
        //             handleJoinQueue={handleJoinQueue}
        //             isEventLiveOrUpcoming={isEventLiveOrUpcoming}
        //             eventStatus={eventStatus}
        //         />
        //     );
        // }

        return (
            <TicketCarouselView
                claimedTicket={claimedTicket}
                selectedTicketIndex={selectedTicketIndex}
                eventTickets={eventTickets}
                eventStatus={eventStatus}
                eventStartDate={eventStartDateStr}
                visibleItems={visibleItems}
                visibleTickets={visibleTickets}
                isEventLive={isEventLive}
                isClaimingTicket={isClaimingTicket}
                handleTicketSelection={handleTicketSelection}
                prevTicket={prevTicket}
                nextTicket={nextTicket}
                handleConfirmSelectedTicketToClaim={
                    handleConfirmSelectedTicketToClaim
                }
                startIndex={startIndex}
                event={event}
                accessCodes={accessCodes}
                serverCode={serverCode}
                getPositionInQueue={getPositionInQueue}
                numberAheadOfMe={numberAheadOfMe}
                setNumberAheadOfMe={setNumberAheadOfMe}
                placeInLine={placeInLine}
                setPlaceInLine={setPlaceInLine}
                totalInLine={totalInLine}
                setTotalInLine={setTotalInLine}
                showEnterEvent={showEnterEvent}
                setShowEnterEvent={setShowEnterEvent}
            />
        );
    };

    return (
        <>
            {/* <AccessCodeInput
                isPromoCodeInputVisible={true}
                promoCode={promoCode}
                setPromoCodeInputVisible={setPromoCodeInputVisible}
                setPromoCode={setPromoCode}
                handlePromoCodeSubmit={handlePromoCodeSubmit}
                hasClaimedTicket={!!hasClaimedTicket}
            /> */}
            {renderWillCallViewJSX()}
            {/* <TicketQueueView {...ticketQueueViewProps} /> */}
            {/* <Button
                sx={selectTicketButtonSX}
                onClick={() => setIsGenerateModalOpen(true)}
            >
                Generate Access Code
            </Button> */}
            {/* <TicketAccessCodeGenerationModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                organizationId={null}
                seriesId={event.seriesId?.toString() ?? null}
            /> */}
        </>
    );
};

export default WillCallView;
