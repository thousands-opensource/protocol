import MyCoinPositions from "@/components/MyCoinPositions";
import { useStreamContext } from "@/contexts/streamContext";
import { Tabs, TabPanels, TabPanel, TabList, Tab, Box } from "@chakra-ui/react";
import { ChatApp } from "@repo/interfaces";

const CoinPositionApp = () => {
    const { chatApp } = useStreamContext();
    return (
        <Box
            sx={{
                w: "100%",
                display: chatApp === ChatApp.STREMECOIN ? "block" : "none",
            }}
        >
            <Tabs
                variant="soft-rounded"
                colorScheme="green"
                sx={{
                    w: "100%",
                }}
            >
                <TabPanels>
                    <TabPanel>
                        <MyCoinPositions category={"my-positions"} />
                    </TabPanel>
                    <TabPanel>
                        <MyCoinPositions category={"top-positions"} />
                    </TabPanel>
                </TabPanels>
                <TabList
                    sx={{
                        height: "30px",
                        justifyContent: "center",
                        gap: 2,
                    }}
                >
                    <Tab>My Coins</Tab>
                    <Tab>Top Coins</Tab>
                </TabList>
            </Tabs>
        </Box>
    );
};
export default CoinPositionApp;
