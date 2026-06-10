import { Flex, Box, Image, Text } from "@chakra-ui/react";

interface SeriesBannerProps {}

const SeriesBanner = (props: any) => {
    return (
        <Flex
            id="series-banner"
            sx={{
                height: "300px",
                width: "750px",
            }}
        >
            <Box
                sx={{
                    width: "auto",
                    height: "auto",
                }}
            >
                <Image
                    alt="series-banner"
                    sx={{
                        height: "100%",
                        width: "100%",
                    }}
                    src={"/images/wildcardthumb02.png"}
                />
            </Box>
            <Flex
                sx={{
                    flexDirection: "column",
                    justifyContent: "space-between",
                    width: "100%",
                    height: "100%",
                    p: 8,
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <Text
                        sx={{
                            fontSize: "x-large",
                        }}
                    >
                        Alpha series one
                    </Text>
                    <Text
                        sx={{
                            fontSize: "small",
                        }}
                    >
                        Date
                    </Text>
                </Box>

                <Box>
                    <Text
                        sx={{
                            fontSize: "small",
                        }}
                    >
                        WARNING: The TCP backlog setting of 511 cannot be
                        enforced because kern.ipc.somaxconn is set to the lower
                        value of 128 WARNING: The TCP backlog setting of 511
                        cannot be enforced because kern.ipc.somaxconn is set to
                        the lower value of 128
                    </Text>
                </Box>
            </Flex>
        </Flex>
    );
};

export default SeriesBanner;
