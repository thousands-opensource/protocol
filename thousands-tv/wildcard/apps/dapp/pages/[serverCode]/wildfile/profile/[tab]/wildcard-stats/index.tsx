import { poppinsMedium, poppinsBold } from "@/utils/themeUtil";
import { Box, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { Stats } from "@repo/interfaces";

interface WildcardStatsProps {
    stats: Stats;
}

const WildcardStats = ({ stats }: WildcardStatsProps) => {
    const {
        gamesWon,
        gamesLoss,
        gamesAttended,
        minutesSpentPlaying,
        minutesSpentViewing,
    } = stats;

    const statsDisplay = [
        {
            label: "Games Played",
            value: (gamesWon + gamesLoss).toString(),
        },
        { label: "Win Record", value: `${gamesWon}-${gamesLoss}` },
        { label: "Games Attended", value: gamesAttended.toString() },
        { label: "Minutes Playing", value: minutesSpentPlaying.toString() },
        { label: "Minutes Viewing", value: minutesSpentViewing.toString() },
    ];

    /**
     * Render various stats with corresponding stat name and value
     * @param statsName - name of the stats
     * @param value - value corresponding to stats
     * @returns row element for stat name and value
     */
    const renderStats = (statsName: string, value: string) => {
        return (
            <Flex
                justifyContent={"space-between"}
                h="40px"
                alignItems={"center"}
                px={3}
                key={statsName}
            >
                <Text className={poppinsMedium.className} color={"#909090"}>
                    {statsName}
                </Text>
                <Text className={poppinsBold.className}>{value}</Text>
            </Flex>
        );
    };

    return (
        <Flex
            alignItems="center"
            flexDir={{
                base: "column",
            }}
        >
            <Flex
                flexDir={{
                    base: "column",
                }}
                gap={2}
            >
                <Box alignSelf={"flex-start"} pl={4}>
                    <Heading fontSize="xl">Wildcard Stats</Heading>
                </Box>
                <Card
                    flex="1"
                    borderRadius={"lg"}
                    bg="none"
                    border={`2px solid #2e2e2e`}
                    px={1}
                    minW={["240px", "280px", "320px"]}
                    sx={{
                        "div:not(:last-child)": {
                            borderBottom: "1px solid #2e2e2e",
                        },
                    }}
                >
                    {statsDisplay.map(({ label, value }) => {
                        return renderStats(label, value);
                    })}
                </Card>
            </Flex>
        </Flex>
    );
};
export default WildcardStats;
