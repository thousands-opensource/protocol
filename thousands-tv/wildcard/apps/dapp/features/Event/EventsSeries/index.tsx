import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Flex,
    VStack,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Text,
    Icon,
    Divider,
    Spinner,
    IconButton,
    useBreakpointValue,
    Image,
} from "@chakra-ui/react";
import { FaRegCalendarAlt, FaStar } from "react-icons/fa";
import EventCard from "./EventCard";
import WillCallView from "./WillCallView";
import { EventSection, EventStatus } from "../types";
import {
    accordionButtonSx,
    accordionPanelSx,
    boxContainerSx,
    eventSeriesFlex,
    eventTicketSectionFlex,
    imageBoxSx,
} from "./styles";
import EventBadge from "../EventBadge";
import { Channel, IRecognitionProgram, IStage } from "@repo/interfaces";
import {
    determineEventStatus,
    findDefaultEvent,
    getRandomEventImage,
    getStatusText,
} from "@/utils/eventUtil";
import { useParams, usePathname } from "next/navigation";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import EventImage from "./_ui/EventImage";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { eventSections } from "../config";
import Token2049EventFooter from "./Token2049EventFooter";
import { EventsToStages, SeriesToEvents, TextEvent } from "@/types";
import { useTextEventContext } from "@/contexts/textEventContext";
import TextEventPanel from "../TextEventPanel";
import { THEME_COLOR_CLOUD_GREY } from "@/constants/constants";
import { DEFAULT_CHANNEL } from "@/constants/stream";
import ProfileDetails from "./ProfileDetails";
import { useRouter } from "next/router";
import ViewEvents from "./ViewEvents";
import Collections from "../../Collections";
import Home from "../../Home";
import { IdentityDoc } from "@repo/schemas";
import { SponsoredEventRow } from "@/components/sponsoredEvents";
import { FranchiseEntry } from "@/components/franchiseIndexLeaderboard";

interface EventsSeriesProps {
    stages: IStage[];
    initialSelectedEvent?: IStage | null;
    seriesToEvents: SeriesToEvents[];
    formattedRecognitionProgram?: any;
    formattedRecognitionProgramTabs: IRecognitionProgram[];
    serverCode: string;
    serverId: string;
    serverName: string;
    sponsoredEvents: SponsoredEventRow[];
    franchiseLeaderboard: FranchiseEntry[];
    currentUserId?: string;
    identities: IdentityDoc[];
    userThousandsXp?: number;
}

const EventsSeries = ({
    stages,
    initialSelectedEvent,
    seriesToEvents,
    formattedRecognitionProgram,
    formattedRecognitionProgramTabs,
    serverCode,
    serverId,
    serverName,
    sponsoredEvents,
    franchiseLeaderboard,
    currentUserId,
    identities,
    userThousandsXp = 0
}: EventsSeriesProps) => {
    const [events, setEvents] = useState<IStage[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<IStage | null>(null);
    // const [selectedChannel, setSelectedChannel] = useState<any>(null);
    const [defaultEvent, setDefaultEvent] = useState<IStage | null>(null);
    const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(true);
    const [hasClaimedTicket, setHasClaimedTicket] = useState<boolean>(false);
    const visibleItems = useBreakpointValue(
        {
            base: 1,
            sm: 1,
            md: 1,
            lg: 3,
        },
        {
            fallback: "md",
        }
    );

    const { activeChannel, setActiveChannel } = useTextEventContext();
    const pathName = usePathname();
    const params = useParams();
    const router = useRouter();
    //id is stageId
    const { tab, id } = router.query as {
        tab: string;
        id: string;
    };
    const stageIds = id;
    const stageId = stageIds ? stageIds[0] : "";

    const { onMessage } = useInfoNotifications();

    const placeholderEventImage = getRandomEventImage(); // fallback image

    const eventSeriesDisplay = selectedEvent ? "flex" : "none";

    // Handle initial event loading and selection
    useEffect(() => {
        setIsLoadingEvent(true);
        if (stages) {
            setEvents(stages);
            const defaultEvt = findDefaultEvent(stages);
            setDefaultEvent(defaultEvt);

            const id = params?.id;
            if (id && typeof id === "string") {
                const eventFromUrl = stages.find(
                    (event: IStage) => event?._id?.toString() === id
                );
                if (eventFromUrl) {
                    setSelectedEvent(eventFromUrl);
                } else {
                    onMessage({
                        title: "Event not found",
                        description: "The requested event does not exist.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                    router.push("/events");
                }
            } else if (initialSelectedEvent) {
                setSelectedEvent(initialSelectedEvent);
            } else {
                setSelectedEvent(null);
            }
        }
        setIsLoadingEvent(false);
    }, [stages, params, initialSelectedEvent, router, onMessage]);

    // Callback to handle event selection and update URL
    const handleEventSelection = useCallback((event: IStage) => {
        //@todo redo: consolidate this set event function (seems to be duplicate)
        setSelectedEvent(event);
        setActiveChannel(DEFAULT_CHANNEL);
        const newUrl = `${pathName}${event._id}`;
        window.history.pushState({ eventId: event._id }, "", newUrl);

        // Add slight delay so content can render properly before scrolling
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }, 100);
    }, []);

    const handleChannelSelection = (channel: any) => {
        setSelectedEvent(null);
        setActiveChannel(channel);
        // Add slight delay so content can render properly before scrolling
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }, 100);
    };

    /**
     * Event instances as a list item
     */
    const renderChannel = (
        channel: Channel,
        isSelected: boolean,
        handleSelect: Function
    ) => {
        return (
            <Flex
                key={channel._id!.toString()}
                align="center"
                p={2}
                cursor="pointer"
                onClick={() => handleSelect(channel)}
                borderRadius="md"
                border={isSelected ? "1px" : "none"}
                borderColor={isSelected ? "blue.500" : "transparent"}
                _hover={{ bg: "gray.700" }}
            >
                <Text
                    ml={2}
                    color={
                        status === EventStatus.COMPLETED
                            ? "gray.500"
                            : "gray.300"
                    }
                >
                    {channel.name}
                </Text>
                <Text ml="auto" fontSize="sm">
                    Live
                </Text>
            </Flex>
        );
    };

    const renderStage = (stageEvent: IStage) => {
        return (
            <VStack
                align="stretch"
                spacing={1}
                key={stageEvent._id!.toString()}
            >
                <EventItem
                    event={stageEvent}
                    isSelected={selectedEvent?._id === stageEvent?._id}
                    onSelect={handleEventSelection}
                />
            </VStack>
        );
    };

    const renderEventsToStages = (event: EventsToStages) => {
        const { _id, eventName, stages } = event;
        return (
            <Accordion key={_id?.toString()} allowMultiple defaultIndex={[0]}>
                <AccordionItem border="none">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            {eventName}
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel sx={accordionPanelSx}>
                        {stages.map((stage: IStage) => {
                            return renderStage(stage);
                        })}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        );
    };

    const renderSeriesToEvents = (seriesToEvent: SeriesToEvents) => {
        const { _id, seriesName, events } = seriesToEvent;
        return (
            <Accordion key={_id?.toString()} allowMultiple defaultIndex={[0]}>
                <AccordionItem border="none">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            {seriesName}
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel sx={accordionPanelSx}>
                        <VStack align="stretch" spacing={1}>
                            {events.map((event: EventsToStages) => {
                                return renderEventsToStages(event);
                            })}
                            {/* {channels.map((channel: any) => {
                            const isSelectedChannel =
                                activeChannel.id === channel.id;
                            return renderChannel(
                                channel,
                                isSelectedChannel,
                                handleChannelSelection
                            );
                        })} */}
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        );
    };

    /**
     * Event instances as a list item
     */
    const EventItem = ({ event, isSelected, onSelect }: any) => {
        const status = determineEventStatus(event);
        return (
            <Flex
                align="center"
                p={2}
                cursor="pointer"
                onClick={() => onSelect(event)}
                borderRadius="md"
                border={isSelected ? "1px" : "none"}
                borderColor={isSelected ? "blue.500" : "transparent"}
                _hover={{ bg: "gray.700" }}
            >
                <Icon
                    as={FaStar}
                    color={
                        status === EventStatus.LIVE ? "blue.400" : "gray.500"
                    }
                />
                <Text
                    ml={2}
                    color={
                        status === EventStatus.COMPLETED
                            ? "gray.500"
                            : "gray.300"
                    }
                >
                    {event.name}
                </Text>
                <Text ml="auto" fontSize="sm" color={getStatusColor(status)}>
                    {getStatusText(status, new Date(event.startDate))}
                </Text>
            </Flex>
        );
    };

    const getStatusColor = (status: EventStatus): string => {
        switch (status) {
            case EventStatus.LIVE:
                return "orange.500";
            case EventStatus.COMPLETED:
            case EventStatus.UPCOMING:
                return "gray.500";
            default:
                return "gray.300";
        }
    };

    // Render content based on the selected event section
    const renderSelectedEventContent = (section: EventSection) => {
        switch (section) {
            case EventSection.STAGES:
                return (
                    <VStack align="stretch" spacing={1}>
                        {seriesToEvents.map((seriesToEvent: SeriesToEvents) => {
                            return renderSeriesToEvents(seriesToEvent);
                        })}
                        {/* {events.map((event) => (
                            <EventItem
                                key={event._id}
                                event={event}
                                isSelected={selectedEvent?._id === event._id}
                                onSelect={handleEventSelection}
                            />
                        ))} */}
                    </VStack>
                );
            case EventSection.BADGES:
                return (
                    <VStack align="start">
                        <Image
                            src="/images/sample-badges.svg"
                            h="55"
                            w="55"
                            alt="active badges"
                            loading="lazy"
                        />
                    </VStack>
                );
            case EventSection.STORE:
                return (
                    <VStack align="start">
                        <Image
                            src="/images/sample-store.svg"
                            h="55"
                            w="55"
                            alt="active store"
                            loading="lazy"
                        />
                    </VStack>
                );
            case EventSection.LEADERBOARDS:
                return <Text>Coming Soon!</Text>;
            default:
                return null;
        }
    };

    // Determine which event to display in the EventCard
    const displayedEvent = selectedEvent || defaultEvent;

    /**
     * Handles showing the current event on the preview card
     */
    const handleCurrentEventDisplayClick = useCallback(() => {
        if (displayedEvent) {
            //@todo redo: use one onclick func for selected events
            setSelectedEvent(displayedEvent);
            setActiveChannel(DEFAULT_CHANNEL);
            const newUrl = `${pathName}${displayedEvent._id}`;
            window.history.pushState(
                { eventId: displayedEvent._id },
                "",
                newUrl
            );
        }
    }, [displayedEvent]);

    // Render Event Series content (left side)
    const renderEventsContent = () => {
        const status = displayedEvent
            ? determineEventStatus(displayedEvent)
            : EventStatus.LIVE;

        const eventsDisplay = selectedEvent ? "none" : "block";
        return (
            <Box
                sx={{
                    ...boxContainerSx,
                    display: [
                        eventsDisplay,
                        eventsDisplay,
                        eventsDisplay,
                        "block",
                    ],
                    // @todo - todo resize left sidebar event content
                    width: ["100%", "100%", "100%", "100%"],
                }}
            >
                <VStack align="stretch" spacing={4}>
                    <Box sx={imageBoxSx} position={"relative"}>
                        <EventImage
                            displayedEvent={displayedEvent}
                            placeholderEventImage={placeholderEventImage}
                            handleCurrentEventDisplayClick={
                                handleCurrentEventDisplayClick
                            }
                            selectedEvent={selectedEvent}
                            eventStatus={status}
                            setHasClaimedTicket={setHasClaimedTicket}
                            hasClaimedTicket={hasClaimedTicket}
                        />
                        <EventBadge
                            eventType={
                                (displayedEvent?.status as EventStatus) ??
                                EventStatus.NEXT_EVENT
                            }
                        />
                    </Box>

                    <Flex
                        justifyContent={"space-between"}
                        onClick={() => {
                            handleCurrentEventDisplayClick();
                        }}
                        cursor="pointer"
                        _hover={{ bg: "whiteAlpha.200" }}
                        p={2}
                        borderRadius="md"
                    >
                        <Flex alignItems={"center"} gap="10px">
                            <Icon as={FaRegCalendarAlt} color={"gray.500"} />
                            <Text>
                                {displayedEvent?.name || "No event selected"}
                            </Text>
                        </Flex>
                        <Text color="orange.500">
                            {displayedEvent
                                ? getStatusText(
                                    status,
                                    new Date(displayedEvent.startDate)
                                )
                                : ""}
                        </Text>
                    </Flex>

                    <Divider orientation="horizontal" />

                    {/* Accordion menu items */}
                    <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
                        {eventSections.map((item) => (
                            <AccordionItem key={item.name} border="none">
                                <AccordionButton
                                    sx={accordionButtonSx}
                                    color={item.colorScheme}
                                    _hover={{
                                        color: item.colorScheme,
                                        opacity: 0.85,
                                    }}
                                >
                                    <Box
                                        flex="1"
                                        textAlign="left"
                                        color={item.colorScheme}
                                    >
                                        {item.name}{" "}
                                        {item.isComingSoon
                                            ? "| coming soon"
                                            : ""}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                                <AccordionPanel sx={accordionPanelSx}>
                                    <VStack align="stretch" spacing={1}>
                                        {renderSelectedEventContent(item.name)}
                                    </VStack>
                                </AccordionPanel>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </VStack>
            </Box>
        );
    };

    /**
     * Event Details card info JSX
     */
    const renderEventDetailsJSX = () => {
        if (isLoadingEvent) {
            return <Spinner size="xl" />;
        }

        if (!selectedEvent) {
            return null;
        }

        return (
            <EventCard
                imageUrl={selectedEvent.imageUrl || placeholderEventImage}
                seriesName={selectedEvent.name}
                seriesNumber=""
                date={
                    selectedEvent.startDate
                        ? new Date(selectedEvent.startDate).toLocaleDateString()
                        : ""
                }
                description={
                    selectedEvent.description || "No description available"
                }
            />
        );
    };

    /**
     * Event Details card info JSX
     */
    const renderChannelDetailsJSX = () => {
        // if (isLoadingEvent) {
        //     return <Spinner size="xl" />;
        // }

        // activeChannel cannot be null nor empty string id
        if (!activeChannel || !activeChannel.id) {
            return null;
        }

        return (
            <>
                <Flex
                    sx={{
                        flexDirection: "column",
                        alignSelf: "flex-start",
                        height: "550px",
                        flexBasis: ["1600px", "1600px", "1600px", "500px"],
                        width: ["100%", "100%", "100%", "auto"],
                        overflow: "hidden",
                        borderColor: "gray",
                        borderWidth: "2px",
                        borderRadius: "var(--chakra-radii-lg)",
                        "& .pn-msg-input": {
                            backgroundColor: "#1E1E1E",
                            width: "100%",
                        },
                        "& .pn-msg-input__textarea": {
                            backgroundColor: "#232323",
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            margin: 0,
                            border: "1px solid #343435",
                            borderRight: "transparent",
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                            scrollbarWidth: "thin",
                        },
                        "& .pn-msg-input__icons": {
                            backgroundColor: "#232323",
                            height: "32px",
                            border: "1px solid #343435",
                            borderLeft: "transparent",
                            borderRight: "transparent",
                            "& button": {
                                margin: "0 4px",
                                color: "white",
                            },
                        },
                        "& .pn-msg-input__emoji-toggle": {
                            display: "flex",
                            "& svg": {
                                verticalAlign: "middle",
                                width: "1em",
                                height: "1em",
                                display: "inline-block",
                                lineHeight: "1em",
                                flexShrink: 0,
                                fontSize: "x-large",
                            },
                        },
                        "& .pn-msg-input__emoji-picker": {
                            bottom: "40px",
                            right: 0,
                        },
                        "& .special-actions": {
                            borderRadius: "24px",
                            border: "2px solid #ED7E5F",
                        },
                        "& .chatActionCredit": {
                            borderRadius: "24px",
                            border: "2px solid white",
                            fontSize: "x-small",
                            color: "unset",
                        },
                        "& .pn-msg-input__send--active": {
                            color: THEME_COLOR_CLOUD_GREY,
                        },
                        "& .pn-msg-input__send": {
                            borderTopRightRadius:
                                "var(--msg-input__textarea__borderRadius)",
                            borderBottomRightRadius:
                                "var(--msg-input__textarea__borderRadius)",
                            border: "1px solid #343435",
                            height: "32px",
                            borderLeft: "transparent",
                            margin: "0",
                            marginLeft: "-2px",
                            backgroundColor: "#232323",
                            padding: "0px 6px",
                        },
                    }}
                >
                    <TextEventPanel />
                </Flex>
            </>
        );
    };

    /**
     * Tickets Carousel JSX
     */
    /*
    const renderTicketCarouselJSX = () => {
        if (isLoadingEvent || !selectedEvent) {
            return null;
        }

        return (
            <WillCallView
                event={selectedEvent}
                visibleItems={visibleItems}
                serverCode={serverCode}
            />
        );
    };
    */

    const renderProfileDetails = () => {
        return (
            <ProfileDetails
                formattedRecognitionProgram={formattedRecognitionProgram}
                formattedRecognitionProgramTabs={
                    formattedRecognitionProgramTabs
                }
            />
        );
    }

    const renderViewEvents = () => {
        return (
            <ViewEvents
                initialSelectedStage={initialSelectedEvent}
                seriesToEvents={seriesToEvents}
                serverName={serverName}
                serverCode={serverCode}
            />
        );
    };

    return (
        <Flex color="white">
            {/* {renderEventsContent()} */}

            {/* Main content area */}
            <Flex
                sx={{
                    ...eventSeriesFlex,
                    // display: [
                    //     eventSeriesDisplay,
                    //     eventSeriesDisplay,
                    //     eventSeriesDisplay,
                    //     "flex",
                    // ],
                }}
            >
                {/* <Box
                    mr={[0, 0, 0, "15px"]}
                    w={["100%", "100%", "100%", "600px"]}
                >
                    {renderEventDetailsJSX()}
                </Box> */}
                {/* <Box mr={[0, 0, 0, 0]} w={["100%", "100%", "100%", "600px"]}>
                    {renderChannelDetailsJSX()}
                </Box> */}
                {/* <Flex sx={eventTicketSectionFlex}></Flex> */}
                {/* <Box
                    mr={[0, 0, 0, "15px"]}
                    w={["100%", "100%", "100%", "600px"]}
                >
                    {renderTicketCarouselJSX()}
                </Box> */}
                {!stageId &&
                    (tab === "home" ||
                        tab === "" ||
                        tab === null ||
                        tab === undefined) && (
                        <Box id="home" w={["100%", "100%", "100%"]} p={4} pt={10}>
                            <Home
                                seriesToEvents={seriesToEvents}
                                sponsoredEvents={sponsoredEvents}
                                franchiseLeaderboard={franchiseLeaderboard}
                                currentUserId={currentUserId}
                                identities={identities}
                                serverId={serverId}
                                serverCode={serverCode}
                                serverName={serverName}
                                thousandsXp={userThousandsXp}
                            />
                        </Box>
                    )}
                {(tab === "events" || !!stageId) && (
                    <Box id="events" w={["100%", "100%", "100%"]}>
                        {renderViewEvents()}
                    </Box>
                )}
                {/* {!stageId && tab === "collections" && (
                    <Box id="collections" w={["100%", "100%", "100%"]}>
                        <Collections />
                    </Box>
                )} */}
                {!stageId && tab === "profile" && (
                    <Box id="profile" w={["100%", "100%", "100%"]}>
                        {renderProfileDetails()}
                    </Box>
                )}
            </Flex>
        </Flex>
    );
};

export default EventsSeries;
