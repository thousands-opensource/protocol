import { poppinsBold, poppinsMedium } from "@/utils/themeUtil";
import { Flex, Box, Image, Text } from "@chakra-ui/react";
import { IStage } from "@repo/interfaces";

interface StageBannerProps {
    stage: IStage;
    handleClick: () => void;
    seriesImageUrl: string;
    seriesBackgroundImageUrl: string;
    serverName: string;
}

const StageBanner = ({
    stage,
    handleClick,
    seriesImageUrl,
    seriesBackgroundImageUrl,
    serverName,
}: StageBannerProps) => {
    const { name, _id } = stage;
    return (
        <Flex
            key={_id?.toString()}
            id="stage-banner"
            sx={{
                flexDirection: ["column", "column", "row", "row", "row"],
                height: ["560px", "560px", "260px", "80px"],
                width: ["100%", "280px", "100%", "600px", "600px"],
                cursor: "pointer",
                borderRadius: "16px",
            }}
            onClick={handleClick}
        >
            <Box
                sx={{
                    width: ["100%", "100%", "100%", "80px"],
                    height: "auto",
                    borderRadius: "16px",
                    borderRightRadius: ["16px", "16px", "none"],
                    borderBottomRightRadius: ["none", "none", "none"],
                    borderBottomLeftRadius: ["none", "none", "16px", "16px"],
                    backgroundPosition: "left",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundImage: `url(${seriesBackgroundImageUrl})`,
                    alignContent: "center",
                }}
            >
                <Image
                    alt="series-banner"
                    sx={{
                        height: "80%",
                        width: "100%",
                        borderRadius: "16px",
                        borderRightRadius: "none",
                    }}
                    src={seriesImageUrl}
                />
            </Box>
            <Box
                sx={{
                    width: ["100%", "100%", "100%", "100%", "880px"],
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
                        p: ["20px", "20px", "20px", "10px 30px"],
                    }}
                >
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        <Flex sx={{ gap: 2, alignItems: "center", mb: 2 }}>
                            <Image
                                src={"/images/event-selected.svg"}
                                alt="event-selected"
                                w="16px"
                                h="16px"
                            />
                            <Text
                                className={poppinsBold.className}
                                sx={{
                                    fontSize: "12px",
                                    color: "#A5A5A5",
                                }}
                            >
                                {serverName}
                            </Text>
                        </Flex>
                        <Flex
                            sx={{
                                width: "100%",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Text
                                className={poppinsBold.className}
                                sx={{
                                    fontSize: "32px",
                                    lineHeight: 1,
                                }}
                            >
                                {name}
                            </Text>
                        </Flex>
                    </Box>
                </Flex>
            </Box>
        </Flex>
    );
};

export default StageBanner;
