import { SeriesToEvents } from "@/types";
import { poppinsBold, poppinsMedium } from "@/utils/themeUtil";
import { Flex, Box, Image, Text } from "@chakra-ui/react";

interface SeriesBannerProps {
    seriesToEvent: SeriesToEvents;
    handleClick: () => void;
    serverName: string;
}

const SeriesBanner = ({
    seriesToEvent,
    handleClick,
    serverName,
}: SeriesBannerProps) => {
    const { seriesName, backgroundImageUrl, imageUrl, startDate, endDate } =
        seriesToEvent;

    const startDateStr = new Date(startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    const endDateStr = new Date(endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return (
        <Flex
            id="series-banner"
            sx={{
                flexDirection: ["column", "column", "row", "row", "row"],
                height: ["760px", "760px", "400px", "400px", "400px"],
                width: ["100%", "280px", "100%", "100%", "960px"],
                cursor: "pointer",
                borderRadius: "16px",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundImage: `url(${backgroundImageUrl})`,
            }}
            onClick={handleClick}
        >
            <Box
                sx={{
                    width: "100%",
                    height: "auto",
                    alignContent: "center",
                }}
            >
                <Image
                    alt="series-banner"
                    sx={{
                        height: "75%",
                        margin: "auto",
                    }}
                    src={imageUrl}
                />
            </Box>
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    bgColor: "#303030",
                    borderRadius: "16px",
                    borderLeftRadius: ["16px", "16px", "none", "none", "none"],
                    borderTopLeftRadius: [
                        "none",
                        "none",
                        "none",
                        "none",
                        "none",
                    ],
                    borderTopRightRadius: [
                        "none",
                        "none",
                        "16px",
                        "16px",
                        "16px",
                    ],
                }}
            >
                <Flex
                    sx={{
                        flexDirection: "column",
                        justifyContent: "space-between",
                        width: "100%",
                        height: "100%",
                        p: ["20px", "20px", "20px", "40px"],
                    }}
                >
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            lineHeight: 1.35,
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
                            }}
                        >
                            {seriesName}
                        </Text>
                        <Text
                            className={poppinsMedium.className}
                            sx={{
                                fontSize: "14px",
                            }}
                        >
                            {startDateStr} - {endDateStr}
                        </Text>
                    </Box>
                    <Box>
                        <Text
                            sx={{
                                fontSize: "14px",
                            }}
                        >
                            {seriesToEvent.seriesDescription}
                        </Text>
                    </Box>
                </Flex>
            </Box>
        </Flex>
    );
};

export default SeriesBanner;
