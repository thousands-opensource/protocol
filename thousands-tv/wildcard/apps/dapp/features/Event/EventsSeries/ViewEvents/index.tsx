import { EventsToStages, SeriesToEvents } from "@/types";
import {
    Box,
    Button,
    Card,
    Flex,
    HStack,
    IconButton,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import EventBanner from "../Banner/EventBanner";
import { IStage } from "@repo/interfaces";
import StageBanner from "../Banner/StageBanner";
import EventCard from "../EventCard";
import { getRandomEventImage } from "@/utils/eventUtil";
import SeriesBanner from "../Banner/SeriesBanner";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import WillCallView from "../WillCallView";
import { getServerCodeFromPath } from "@/utils/serverUtil";
import { useRouter } from "next/router";
import ClaimTicketButtonForWildPassOwner from "../_ui/ClaimTicketForWildpassOwnerButton";

interface ViewEventsProps {
    initialSelectedStage?: IStage | null;
    seriesToEvents: SeriesToEvents[];
    serverName: string;
    serverCode: string;
}

enum ViewLevel {
    SERIES = "series",
    EVENT = "event",
    STAGE = "stage",
    DETAILS = "details",
}

const ViewEvents = ({
    initialSelectedStage,
    seriesToEvents,
    serverName,
    serverCode,
}: ViewEventsProps) => {
    const [viewLevel, setViewLevel] = useState<ViewLevel>(
        initialSelectedStage ? ViewLevel.DETAILS : ViewLevel.SERIES
    );
    const [selectedSeries, setSelectedSeries] = useState<SeriesToEvents | null>(
        null
    );
    const [selectedEvent, setSelectedEvent] = useState<EventsToStages | null>(
        null
    );

    const router = useRouter();
    const serverCodeViaRoute = getServerCodeFromPath(router);

    const [selectedStage, setSelectedStage] = useState<IStage | null>(null);
    const placeholderEventImage = getRandomEventImage();
    const { onMessage } = useInfoNotifications();

    const viewEvents = (seriesToEvent: SeriesToEvents) => {
        setSelectedSeries(seriesToEvent);
        setViewLevel(ViewLevel.EVENT);
        window.scrollTo({ behavior: "smooth", top: 0 });
    };

    const viewStages = (eventToStages: EventsToStages) => {
        setSelectedEvent(eventToStages);
        if (eventToStages.stages.length === 1) {
            viewStageDetails(eventToStages.stages[0]);
            return;
        }

        setViewLevel(ViewLevel.STAGE);
        window.scrollTo({ behavior: "smooth", top: 0 });
    };

    const viewStageDetails = (stage: IStage) => {
        setSelectedStage(stage);
        setViewLevel(ViewLevel.DETAILS);
        window.scrollTo({ behavior: "smooth", top: 0 });
    };

    const goBack = () => {
        if (viewLevel === ViewLevel.DETAILS) {
            if (
                selectedEvent &&
                selectedEvent?.stages &&
                selectedEvent.stages.length === 1
            ) {
                setViewLevel(ViewLevel.EVENT);
                setSelectedStage(null);
                return;
            }

            setViewLevel(ViewLevel.STAGE);
            setSelectedStage(null);
        } else if (viewLevel === ViewLevel.STAGE) {
            setViewLevel(ViewLevel.EVENT);
            setSelectedEvent(null);
        } else if (viewLevel === ViewLevel.EVENT) {
            setViewLevel(ViewLevel.SERIES);
            setSelectedSeries(null);
        }
    };

    const renderBreadcrumbs = () => {
        switch (viewLevel) {
            case ViewLevel.DETAILS:
                return `${selectedSeries?.seriesName} / ${selectedEvent?.eventName} / ${selectedStage?.name}`;
            case ViewLevel.STAGE:
                return `${selectedSeries?.seriesName} / ${selectedEvent?.eventName}`;
            case ViewLevel.EVENT:
                return `${selectedSeries?.seriesName}`;
            default:
                return "";
        }
    };

    const renderBackButton = () => {
        return (
            <Flex
                sx={{ gap: "2", alignItems: "center", alignSelf: "flex-start" }}
            >
                <IconButton
                    aria-label="back-btn"
                    onClick={goBack}
                    background={"none"}
                    variant={"solid"}
                >
                    <ArrowBackIcon fontSize={"larger"} />
                </IconButton>
                <Text>{renderBreadcrumbs()}</Text>
            </Flex>
        );
    };

    const renderSeries = () => {
        if (viewLevel !== ViewLevel.SERIES) {
            return null;
        }

        return seriesToEvents.map((seriesToEvent: SeriesToEvents) => (
            <SeriesBanner
                key={seriesToEvent._id?.toString()}
                seriesToEvent={seriesToEvent}
                handleClick={() => viewEvents(seriesToEvent)}
                serverName={serverName}
            />
        ));
    };

    const renderEvents = () => {
        if (viewLevel !== ViewLevel.EVENT || !selectedSeries) {
            return null;
        }

        return (
            <Flex
                sx={{
                    flexDirection: ["column"],
                    width: ["100%", "100%", "100%", "100%", "960px"],
                    gap: 6,
                }}
            >
                {renderBackButton()}
                {selectedSeries.events.map((eventToStages: EventsToStages) => (
                    <EventBanner
                        key={eventToStages._id?.toString()}
                        eventToStages={eventToStages}
                        handleClick={() => viewStages(eventToStages)}
                        seriesImageUrl={selectedSeries.imageUrl}
                        seriesBackgroundImageUrl={
                            selectedSeries.backgroundImageUrl
                        }
                        serverName={`${serverName}`}
                    />
                ))}
            </Flex>
        );
    };

    const renderStages = () => {
        if (
            viewLevel !== ViewLevel.STAGE ||
            !selectedEvent ||
            !selectedSeries
        ) {
            return null;
        }

        return (
            <>
                {renderBackButton()}
                {selectedEvent.stages.length !== 0 && (
                    <EventCard
                        imageUrl={
                            selectedEvent?.imageUrl || placeholderEventImage
                        }
                        seriesName={selectedEvent.stages[0].name}
                        seriesNumber=""
                        date={
                            selectedEvent.stages[0].startDate
                                ? new Date(
                                      selectedEvent.stages[0].startDate
                                  ).toLocaleDateString()
                                : ""
                        }
                        description={
                            selectedEvent.stages[0].description ||
                            "No description available"
                        }
                    />
                )}
                {selectedEvent.stages.map((stage: IStage) => {
                    return (
                        <StageBanner
                            key={stage._id?.toString()}
                            handleClick={() => viewStageDetails(stage)}
                            stage={stage}
                            seriesImageUrl={selectedSeries.imageUrl}
                            seriesBackgroundImageUrl={
                                selectedSeries.backgroundImageUrl
                            }
                            serverName={serverName}
                        />
                    );
                })}
            </>
        );
    };

    const renderStageDetails = () => {
        if (
            viewLevel !== ViewLevel.DETAILS ||
            !selectedStage ||
            !selectedEvent
        ) {
            return null;
        }

        return (
            <>
                {renderBackButton()}
                <EventCard
                    imageUrl={selectedEvent.imageUrl || placeholderEventImage}
                    seriesName={selectedStage.name}
                    seriesNumber=""
                    date={
                        selectedStage.startDate
                            ? new Date(
                                  selectedStage.startDate
                              ).toLocaleDateString()
                            : ""
                    }
                    description={
                        selectedStage.description || "No description available"
                    }
                />
                <WillCallView
                    event={selectedStage}
                    visibleItems={3}
                    serverCode={serverCode}
                />
            </>
        );
    };

    useEffect(() => {
        if (initialSelectedStage) {
            setViewLevel(ViewLevel.DETAILS);
            setSelectedStage(initialSelectedStage);

            const series = seriesToEvents.find(
                (seriesToEvent: SeriesToEvents) =>
                    seriesToEvent._id?.toString() ===
                    initialSelectedStage.seriesId?.toString()
            );

            if (!series) {
                onMessage({
                    title: "Series not found",
                    description: "The requested series does not exist.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            const event = series.events.find(
                (eventToStages: EventsToStages) =>
                    eventToStages._id?.toString() ===
                    initialSelectedStage.eventId
            );

            if (!event) {
                onMessage({
                    title: "Event not found",
                    description: "The requested event does not exist.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            setSelectedSeries(series);
            setSelectedEvent(event);
        }
    }, []);

    return (
        <Stack
            spacing={2}
            sx={{
                gap: 6,
                alignItems: ["center", "center", "center", "flex-start"],
            }}
        >
            {renderSeries()}
            {renderEvents()}
            {renderStages()}
            {renderStageDetails()}
        </Stack>
    );
};

export default ViewEvents;
