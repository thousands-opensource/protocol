import { EventsToStages } from "@/types";
import { poppinsBold, poppinsMedium } from "@/utils/themeUtil";
import { Flex, Box, Image, Text } from "@chakra-ui/react";

interface EventBannerProps {
    eventToStages: EventsToStages;
    handleClick: () => void;
    seriesImageUrl: string;
    seriesBackgroundImageUrl: string;
    serverName: string;
}

const EventBanner = ({
    eventToStages,
    handleClick,
    seriesImageUrl,
    seriesBackgroundImageUrl,
    serverName,
}: EventBannerProps) => {
    const { eventName, _id, imageUrl, startDate } = eventToStages;

    const startDateStr = new Date(startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return (
        <Flex
            key={_id?.toString()}
            id="event-banner"
            sx={{
                flexDirection: ["column", "column", "row", "row", "row"],
                height: ["760px", "760px", "200px", "200px", "200px"],
                width: ["100%", "280px", "100%", "100%", "100%"],
                cursor: "pointer",
                borderRadius: "16px",
            }}
            onClick={handleClick}
        >
            <Box
                sx={{
                    width: ["100%", "100%", "18%", "13%"],
                    height: "auto",
                    borderRadius: "16px",
                    borderRightRadius: ["16px", "16px", "none", "none"],
                    borderBottomRightRadius: ["none", "none", "none"],
                    borderBottomLeftRadius: ["none", "none", "16px", "16px"],
                    backgroundPosition: "35%",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundImage: `url(${seriesBackgroundImageUrl})`,
                    alignContent: "center",
                }}
            >
                <Image
                    alt="series-banner"
                    sx={{
                        height: ["75%", "75%", "50%"],
                        margin: "auto",
                    }}
                    src={seriesImageUrl}
                />
            </Box>
            <Box
                sx={{
                    width: ["100%", "100%", "28%", "38%"],
                    height: "auto",
                }}
            >
                <Image
                    alt="event-img"
                    sx={{
                        height: "100%",
                        width: "100%",
                    }}
                    src={imageUrl}
                />
            </Box>
            <Box
                sx={{
                    width: [
                        "100%",
                        "100%",
                        "-webkit-calc(54% - 1px)",
                        "-webkit-calc(49% - 1px)",
                        "-webkit-calc(49% - 1px)",
                    ],
                    height: "100%",
                    bgColor: "#303030",
                    borderRadius: "16px",
                    borderLeftRadius: ["16px", "16px", "none", "none"],
                    borderTopLeftRadius: ["none", "none", "none"],
                    borderTopRightRadius: ["none", "none", "16px", "16px"],
                }}
            >
                <Flex
                    sx={{
                        flexDirection: "column",
                        justifyContent: "space-between",
                        width: "100%",
                        height: "100%",
                        p: ["20px", "20px", "20px", "25px 40px"],
                    }}
                >
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        <Flex sx={{ gap: 2, alignItems: "center" }}>
                            <Image
                                src={"/images/event-selected.svg"}
                                alt="event-selected"
                                w="16px"
                                h="16px"
                            />
                            <Text
                                className={poppinsBold.className}
                                sx={{
                                    fontSize: "16px",
                                    color: "#A5A5A5",
                                }}
                            >
                                {serverName}
                            </Text>
                        </Flex>
                        <Text
                            className={poppinsBold.className}
                            sx={{
                                fontSize: "32px",
                                textWrap: "initial",
                                lineHeight: 1.25,
                            }}
                        >
                            {eventName}
                        </Text>
                    </Box>
                    <Box>
                        <Text
                            className={poppinsMedium.className}
                            sx={{
                                fontSize: "14px",
                            }}
                        >
                            {startDateStr}
                        </Text>
                    </Box>
                </Flex>
            </Box>
        </Flex>
    );
};

export default EventBanner;
