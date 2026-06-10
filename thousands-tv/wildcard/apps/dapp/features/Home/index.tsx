import { poppinsBold } from "@/utils/themeUtil";
import { Flex, Box, Text } from "@chakra-ui/react";
import {
    EventsToStagesWithSeriesImages,
    SeriesToEvents,
} from "../../types";
import { EventStatus } from "../Event/types";
import EventBanner from "../Event/EventsSeries/Banner/EventBanner";
import router from "next/router";
import Carousel from "../../components/Carousel";
import useLoadingWithRouter from "@/hooks/loadingStateManagement/useLoadingWithRouter";
import TalentList from "./Talent/TalentList";
import { IdentityDoc } from "@repo/schemas";
import SponsoredEvents, {
    SponsoredEventRow,
} from "@/components/sponsoredEvents";
import FranchiseIndexLeaderboard, {
    FranchiseEntry,
} from "@/components/franchiseIndexLeaderboard";
import ThousandsXpBarGraph from "@/features/ThousandsXp/thousandsXpBarGraph";

interface HomeProps {
    seriesToEvents: SeriesToEvents[];
    sponsoredEvents: SponsoredEventRow[];
    franchiseLeaderboard: FranchiseEntry[];
    currentUserId?: string;
    serverCode: string;
    serverId: string;
    serverName: string;
    identities: IdentityDoc[];
    thousandsXp?: number;
    weekIndex?: number;
}

const Home = ({
    seriesToEvents,
    sponsoredEvents,
    franchiseLeaderboard,
    currentUserId,
    serverCode,
    serverId,
    serverName,
    identities,
    thousandsXp = 0,
    weekIndex,
}: HomeProps) => {
    const { startLoading } = useLoadingWithRouter();

    const championsMagicEdenLink =
        "https://magiceden.us/collections/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788";
    const summonsMagicEdenLink =
        "https://magiceden.us/collections/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788";

    var liveEvents: EventsToStagesWithSeriesImages[] = [];
    var upcomingEvents: EventsToStagesWithSeriesImages[] = [];
    for (const series of seriesToEvents) {
        for (const event of series.events) {
            for (const stage of event.stages) {
                if (stage.status === EventStatus.LIVE) {
                    var eventWithSeriesImageUrls: EventsToStagesWithSeriesImages =
                    {
                        ...event,
                        seriesImageUrl: series.imageUrl,
                        seriesBackgroundImageUrl: series.backgroundImageUrl,
                    };
                    liveEvents.push(eventWithSeriesImageUrls);
                    break;
                } else if (stage.status === EventStatus.UPCOMING) {
                    var eventWithSeriesImageUrls: EventsToStagesWithSeriesImages =
                    {
                        ...event,
                        seriesImageUrl: series.imageUrl,
                        seriesBackgroundImageUrl: series.backgroundImageUrl,
                    };
                    upcomingEvents.push(eventWithSeriesImageUrls);
                    break;
                }
            }
        }
    }

    /*
    const renderLiveEventsJSX = (liveEvents: EventsToStagesWithSeriesImages[]) => {
        if (liveEvents.length > 0) {
            const liveEvent = liveEvents[0];
            return liveEvents.map((item, index) => {
                return (
                    <EventBanner
                        key={item._id?.toString()}
                        eventToStages={item}
                        seriesImageUrl={item.seriesImageUrl}
                        seriesBackgroundImageUrl={item.seriesBackgroundImageUrl}
                        handleClick={() => { router.push("/wildcard/events/" + item.stages[0]._id) }}
                    />
                );
            });
        } else {
            return null;
        }
    };
    */

    const handleSponsoredEventSelect = (sponsoredEventId: string) => {
        startLoading("Loading sponsored event...");
        router.push(`/${serverCode}/sponsorevents/${sponsoredEventId}`);
    };

    const handleFranchiseSelect = (userId: string) => {
        startLoading("Loading franchise...");
        router.push(`/${serverCode}/franchises/${userId}`);
    };

    const renderLiveEventsJSXArray = (
        liveEvents: EventsToStagesWithSeriesImages[]
    ) => {
        if (liveEvents.length > 0) {
            var eventBanners: JSX.Element[] = [];
            liveEvents.forEach((item, index) => {
                eventBanners.push(
                    <EventBanner
                        key={item._id?.toString()}
                        eventToStages={item}
                        seriesImageUrl={item.seriesImageUrl}
                        seriesBackgroundImageUrl={item.seriesBackgroundImageUrl}
                        handleClick={() => {
                            startLoading(
                                `Loading ${item.stages[0].name || "event"}...`
                            );
                            router.push(
                                `/${serverCode}/events/` + item.stages[0]._id
                            );
                        }}
                        serverName={serverName}
                    />
                );
            });
            return eventBanners;
        }

        return [];
    };

    return (
        <Flex
            id="home-section"
            sx={{
                flexDirection: ["column"],
                // height: ["760px", "760px", "200px", "200px", "200px"],
                width: ["100%", "280px", "100%", "100%", "1400px"],
                mt: "0px",
            }}
        >
            <Flex flexDirection="column" gap={0}>
                {typeof weekIndex === "number" && (
                    <Flex justify="flex-end" mb={2}>
                        <Text color="whiteAlpha.900" fontWeight="bold">
                            WEEK {weekIndex}
                        </Text>
                    </Flex>
                )}
                {/*
                <Box mb={6}>
                    <ThousandsXpBarGraph thousandsXp={thousandsXp} />
                </Box>
                */}
                <Text
                    className={poppinsBold.className}
                    sx={{
                        fontSize: "16px",
                        mt: "0px",
                        mb: "10px",
                    }}
                >
                    Sponsorship Opportunities
                </Text>
                <SponsoredEvents
                    sponsoredEvents={sponsoredEvents}
                    onSelect={handleSponsoredEventSelect}
                    limit={5}
                />
                <Text
                    className={poppinsBold.className}
                    sx={{
                        fontSize: "16px",
                        mt: "48px",
                        mb: "10px",
                    }}
                >
                    Franchises
                </Text>
                <FranchiseIndexLeaderboard
                    leaderboard={franchiseLeaderboard}
                    currentUserId={currentUserId}
                    onSelect={handleFranchiseSelect}
                    limit={5}
                />                
            </Flex>
            {/*
            <Text
                className={poppinsBold.className}
                sx={{
                    fontSize: "16px",
                    mt: "38px",
                }}
            >
                {liveEvents.length > 0 ? "Live Events" : "Upcoming Events"}
            </Text>

            <Box
                sx={{
                    width: "100%",
                    pt: "8px",
                    pb: "8px",
                }}
            >
                {liveEvents.length > 0 && (
                    <Carousel
                        carouselItems={renderLiveEventsJSXArray(liveEvents)}
                    />
                )}
                {liveEvents.length == 0 && (
                    <Carousel
                        carouselItems={renderLiveEventsJSXArray(upcomingEvents)}
                    />
                )}
            </Box>
            */}
            {/* <Flex
                sx={{
                    flexDirection: ["row"],
                    mt: "30px",
                }}
            >
                <Text
                    className={poppinsBold.className}
                    sx={{
                        fontSize: "16px",
                        mr: "20px",
                    }}
                >
                    Featured Collections
                </Text>
                <Text
                    className={poppinsMedium.className}
                    sx={{
                        fontSize: "8px",
                        mt: "10px",
                        mr: "20px",
                        color: "#999",
                    }}
                >
                    Visit Magic Eden to view the collection
                </Text>
                <Box
                    sx={{
                        mt: "3px",
                    }}
                >
                    <Link target="_blank" href={summonsMagicEdenLink}>
                        <Image src="/images/magiceden.webp" alt="Magic Eden" />
                    </Link>
                </Box>
            </Flex>

            <Flex
                id="collections-section"
                sx={{
                    flexDirection: ["column", "column", "row", "row"],
                }}
            >
                <Box
                    sx={{
                        pt: "8px",
                        pb: "8px",
                        mr: "12px",
                        borderRadius: "16px",
                    }}
                >
                    <Link target="_blank" href={championsMagicEdenLink}>
                        <Image
                            sx={{
                                width: "100%",
                                borderRadius: "8px",
                                borderColor: "#0000ff",
                                borderWidth: "2px",
                                borderStyle: "solid",
                            }}
                            src="/images/champions.png"
                            alt="Champions"
                        />
                    </Link>
                </Box>

                <Box
                    sx={{
                        pt: "8px",
                        pb: "8px",
                    }}
                >
                    <Link target="_blank" href={summonsMagicEdenLink}>
                        <Image
                            sx={{
                                width: "100%",
                                borderRadius: "8px",
                                borderColor: "#ff8822",
                                borderWidth: "2px",
                                borderStyle: "solid",
                            }}
                            src="/images/summons.png"
                            alt="Summons"
                        />
                    </Link>
                </Box>
            </Flex> 
            */}

            {/*
            <Text
                className={poppinsBold.className}
                sx={{
                    fontSize: "16px",
                    mt: "30px",
                }}
            >
                Talent
            </Text>

            <Flex
                id="talent-section"
                sx={{
                    flexDirection: ["column", "column", "row", "row"],
                    mt: "10px",
                }}
            >
                <TalentList identities={identities} />
                {/*
                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/paytplaystalent.jpg`}
                        displayName="Payton"
                        role="Host"
                    />
                </Box>

                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/blake.jpg`}
                        displayName="Blake"
                        role="Shoutcaster"
                    />
                </Box>

                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/tytus.jpg`}
                        displayName="Tytus"
                        role="Shoutcaster"
                    />
                </Box>

                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/shadyshiba.png`}
                        displayName="ShadyShiba"
                        role="Shoutcaster"
                    />
                </Box>

                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/leah.png`}
                        displayName="Leah"
                        role="Field Reporter"
                    />
                </Box>

                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/remyd.png`}
                        displayName="RemyD"
                        role="Host"
                    />
                </Box>

                <Box
                    sx={{
                        mr: "16px",
                        mb: "16px",
                    }}
                >
                    <TalentAvatar
                        avatarImageUrl={`${window.location.origin}/images/pfps/magiceden.png`}
                        displayName="Magic Eden"
                        role="Host"
                    />
                </Box>
            </Flex>
            */}
        </Flex>
    );
};

export default Home;
