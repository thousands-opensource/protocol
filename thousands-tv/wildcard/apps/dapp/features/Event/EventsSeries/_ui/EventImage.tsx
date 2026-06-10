import React, { useEffect } from "react";
import { Box, Image, Flex, Button, Portal } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IStage } from "@repo/interfaces";
import EventBadge from "../../EventBadge";
import { EventStatus } from "../../types";
import { imageBoxSx, imageSx, viewEventButtonSx } from "../styles";
import useFetchClaimedTicket from "@/hooks/claimedTickets/useFetchClaimedTicket";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useEnterEvent } from "@/hooks/events/useEnterEvent";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface EventImageProps {
    displayedEvent: IStage | null;
    placeholderEventImage: string;

    handleCurrentEventDisplayClick: () => void;
    selectedEvent: IStage | null;
    eventStatus: EventStatus;
    setHasClaimedTicket: (hasClaimedTicket: boolean) => void;
    hasClaimedTicket: boolean;
}

/**
 * Renders the image for an event card
 */
const EventImage: React.FC<EventImageProps> = ({
    displayedEvent,
    placeholderEventImage,

    handleCurrentEventDisplayClick,
    selectedEvent,
    eventStatus,
    setHasClaimedTicket,
    hasClaimedTicket,
}) => {
    const { userDB } = useWildfileUserContext();
    const router = useRouter();
    const { onMessage } = useInfoNotifications();
    const { isEntering, fetchStreamId, enterEvent } = useEnterEvent();

    const handleEnterEvent = async () => {
        const streamId = await fetchStreamId(
            displayedEvent?._id?.toString() || ""
        );
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

    // Check if we're on the main events page by comparing asPath
    const isMainEventsPage =
        router.asPath === "/events" || router.asPath === "/events/";

    const { claimedTicket } = useFetchClaimedTicket({
        userId: userDB?._id?.toString() || "",
        eventId: displayedEvent?._id?.toString() || "",
    });

    useEffect(() => {
        if (claimedTicket) {
            setHasClaimedTicket(true);
        } else {
            setHasClaimedTicket(false);
        }
    }, [claimedTicket, setHasClaimedTicket]);

    const handleButtonClick = async () => {
        if (eventStatus === EventStatus.LIVE && hasClaimedTicket) {
            // Navigate to stream page
            await handleEnterEvent();
        } else {
            handleCurrentEventDisplayClick();
        }
    };

    const getButtonText = () => {
        if (eventStatus === EventStatus.LIVE && hasClaimedTicket) {
            return "View Stream";
        }
        return "View Event";
    };

    // Loader shown during entering the event
    const renderLoadingEnteringEventOverlayJSX = () => {
        if (isEntering) {
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
            <Box
                sx={imageBoxSx}
                position="relative"
                overflow="hidden"
                _hover={{
                    "& > .hover-overlay": { opacity: 1 },
                    "& > img": {
                        transform: selectedEvent ? "unset" : "scale(1.05)",
                        transition: selectedEvent
                            ? undefined
                            : "transform 0.3s ease-in-out",
                    },
                }}
            >
                <Image
                    src={displayedEvent?.imageUrl || placeholderEventImage}
                    alt="Event placeholder"
                    sx={{
                        ...imageSx,
                        transition: selectedEvent
                            ? undefined
                            : "transform 0.3s ease-in-out",
                    }}
                />
                <EventBadge
                    eventType={
                        (displayedEvent?.status as EventStatus) ??
                        EventStatus.NEXT_EVENT
                    }
                />

                {!selectedEvent && (
                    <Flex
                        className="hover-overlay"
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bg="rgba(0, 0, 0, 0.7)"
                        alignItems="center"
                        justifyContent="center"
                        opacity={0}
                        transition="opacity 0.3s ease-in-out"
                    >
                        <Button
                            onClick={handleButtonClick}
                            sx={viewEventButtonSx}
                        >
                            {getButtonText()}
                        </Button>
                    </Flex>
                )}
            </Box>
        </>
    );
};

export default EventImage;
