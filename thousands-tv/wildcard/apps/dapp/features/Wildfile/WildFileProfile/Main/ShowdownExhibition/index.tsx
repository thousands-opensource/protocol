import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import { THEME_COLOR_DARK_GOLD } from "@/constants/constants";
import { gilroyBlackItalic, gilroyMedium, theme } from "@/utils/themeUtil";
import { Box, Center, Flex, Grid, GridItem, Text } from "@chakra-ui/react";
import Showdown from "@/public/images/WildfileAssets/showdown.svg";
import TeamMatch from "@/public/images/WildfileAssets/team-match.webp";

interface ShowdownExhibitionProps {}

const ShowdownExhibition = ({}: ShowdownExhibitionProps) => {
    return (
        <Flex
            minH="100vh"
            backgroundImage="url(/images/WildfileAssets/showdown-background.svg) "
            backgroundRepeat={"no-repeat"}
            backgroundPosition="top center"
            backgroundSize={"cover"}
            backgroundColor={theme.colors.brandDark.bg}
            alignItems="center"
        >
            <Box
                p={{ base: 10, md: 14, lg: 4, xl: 5, "2xl": 6 }}
                color="white"
                flexGrow={1}
            >
                <Center>
                    <ChakraNextImageSimple
                        src={Showdown.src}
                        alt="showdown exhibition logo"
                        width={"100"}
                        height={"100"}
                        sx={{
                            w: { base: "85%", md: "95%", lg: "75%", xl: "55%" },
                            h: "100%",
                        }}
                        priority
                    />
                </Center>
                <Box mt={8}>
                    <Grid
                        templateRows={{
                            base: "repeat(2, 1fr)",
                            lg: "repeat(1, 1fr)",
                        }}
                        templateColumns={{
                            base: "repeat(1, 1fr)",
                            lg: "repeat(2, 58% 42%)",
                        }}
                    >
                        <GridItem colSpan={1} position="relative">
                            <Box
                                position={{ base: "initial", lg: "absolute" }}
                                top={{ xl: "-10%" }}
                                left={{ lg: "10%", xl: "30%", "2xl": "40%" }}
                                height="100%"
                            >
                                <ChakraNextImageSimple
                                    src={TeamMatch}
                                    alt="team match logo"
                                    width={"100%"}
                                    height={"100%"}
                                    sx={{
                                        w: "100%",
                                        h: {
                                            base: "90%",
                                            sm: "90%",
                                            md: "90%",
                                            lg: "95%",
                                            xl: "110%",
                                            "2xl": "100%",
                                        },
                                    }}
                                    priority
                                />
                            </Box>
                        </GridItem>
                        <GridItem
                            px={{ base: 0, md: 10, lg: 0 }}
                            py={{ base: 2, sm: 4, md: 0, lg: 0 }}
                        >
                            <Box>
                                <Text
                                    fontSize={{
                                        base: "xl",
                                        sm: "3xl",
                                        md: "4xl",
                                        lg: "4xl",
                                        xl: "4xl",
                                        "2xl": "5xl",
                                    }}
                                    lineHeight={1.15}
                                    maxW={"500px"}
                                >
                                    Score Wildcard Points for a chance to win
                                    the Community Raffle.
                                </Text>
                            </Box>
                            <Box mt={4}>
                                <Text
                                    fontSize={{
                                        base: "lg",
                                        md: "2xl",
                                        lg: "2xl",
                                        xl: "2xl",
                                        "2xl": "3xl",
                                    }}
                                    color={THEME_COLOR_DARK_GOLD}
                                >
                                    There are many ways to collect.
                                </Text>
                            </Box>
                            <Box mt={4}>
                                <Text
                                    className={gilroyMedium.className}
                                    fontSize={{
                                        base: "sm",
                                        md: "lg",
                                        lg: "lg",
                                        xl: "lg",
                                        "2xl": "xl",
                                    }}
                                    maxW={"500px"}
                                >
                                    The more points you score, the greater your
                                    chances to win. Each event is an opportunity
                                    to score points for your team.
                                </Text>
                            </Box>
                            <Box mt={4}>
                                <Text
                                    className={gilroyBlackItalic.className}
                                    fontSize={{
                                        base: "4xl",
                                        md: "5xl",
                                        lg: "6xl",
                                        xl: "6xl",
                                        "2xl": "7xl",
                                    }}
                                >
                                    07.30.23
                                </Text>
                            </Box>
                        </GridItem>
                    </Grid>
                </Box>
            </Box>
        </Flex>
    );
};
export default ShowdownExhibition;
