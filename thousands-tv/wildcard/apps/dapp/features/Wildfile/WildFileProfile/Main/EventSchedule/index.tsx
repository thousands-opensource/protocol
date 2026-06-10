import { LiveEventsBanner } from "@/components/Banners";
import {
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    THEME_COLOR_FOG_GREY,
} from "@/constants/constants";
import { gilroyBlack, gilroyMedium } from "@/utils/themeUtil";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useContext } from "react";
import ProfileContext from "../../../WildfileContext";
import ShowdownEventTable from "./ShowdownEventTable";

const EventSchedule = () => {
    const {
        upcomingShowdownEvents,
        currentShowdownEvent,
        pastShowdownEvents,
        pageOwnerUser,
    } = useContext(ProfileContext);
    const renderEventTableTitle = (title: string) => {
        return (
            <Text
                pl={{ base: 4, lg: 20 }}
                textTransform="uppercase"
                className={gilroyBlack.className}
                letterSpacing="2px"
                mb={2}
                fontSize={{ base: "sm", sm: "md" }}
                textAlign={{ base: "start", md: "start" }}
                textColor={THEME_COLOR_DARK_GOLDEN_YELLOW}
            >
                {title}
            </Text>
        );
    };

    const renderLiveEventBanner = () => {
        if (!currentShowdownEvent) {
            return null;
        }

        return (
            <Box as="section" pb={{ base: "5" }} ml={"-1%"} w={"102%"}>
                <LiveEventsBanner currentShowdownEvent={currentShowdownEvent} />
            </Box>
        );
    };

    return (
        <Flex
            minH="100vh"
            backgroundImage="url(/images/WildfileAssets/stripes-background.svg) "
            backgroundRepeat={"no-repeat"}
            backgroundPosition="left top"
            backgroundSize={"cover"}
            bgColor={THEME_COLOR_FOG_GREY}
            borderTop={`5px solid ${THEME_COLOR_DARK_GOLD}`}
            flexDir={"column"}
            px={{ base: 4, sm: 8, md: 10, lg: 24, xl: 44, "2xl": 80 }}
            py={{ base: 8, sm: 8, md: 6, lg: 6, xl: 10 }}
            flexGrow={1}
        >
            <Box>
                <Text
                    color={THEME_COLOR_DARK_GOLD}
                    fontSize={"xs"}
                    className={gilroyBlack.className}
                    textTransform="uppercase"
                    letterSpacing={"2px"}
                >
                    Raffle Event
                </Text>
            </Box>
            <Box mt={2}>
                <Text
                    fontSize={{ base: "3xl", lg: "5xl" }}
                    className={gilroyBlack.className}
                >
                    Attend events for more points!
                </Text>
            </Box>
            <Box mt={4} w={{ base: "100%", lg: "80%" }}>
                <Text
                    className={gilroyMedium.className}
                    color={"black"}
                    fontWeight={"thin"}
                >
                    Every point you earn increases your odds of winning in the
                    raffle.
                </Text>
            </Box>
            <Box
                mt={4}
                bgColor="white"
                borderRadius="10px"
                py={6}
                boxShadow={"md"}
            >
                {renderLiveEventBanner()}
                <Box>
                    {renderEventTableTitle("Upcoming Events")}
                    <ShowdownEventTable
                        rows={upcomingShowdownEvents}
                        user={pageOwnerUser}
                        isPastShowdownEvents={false}
                    />
                </Box>
                <Box mt={10}>
                    {renderEventTableTitle("Past Events")}
                    <ShowdownEventTable
                        rows={pastShowdownEvents}
                        user={pageOwnerUser}
                        isPastShowdownEvents={true}
                    />
                </Box>
            </Box>
        </Flex>
    );
};

export default EventSchedule;
