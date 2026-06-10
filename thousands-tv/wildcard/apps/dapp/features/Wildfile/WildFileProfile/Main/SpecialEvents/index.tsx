import {
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_STEEL_GREY,
    toastDefaultOptions,
} from "@/constants/constants";
import { Text, Flex, Image, Box, useToast } from "@chakra-ui/react";
import PickASide from "@/public/images/WildfileAssets/pickASide.svg";
import React, { useState } from "react";
import RaffleTeamCard from "../RaffleTeamCard";
import { IUser } from "@repo/interfaces";
import axios from "axios";
import { gilroyBlack, gilroyMedium } from "@/utils/themeUtil";
import { useAccount } from "wagmi";
import { useGlobalContext } from "@/contexts/globalContext";

enum TeamChoices {
    BAYC = "BAYC",
    OKAY_BEARS = "Okay Bears",
}

interface SpecialEventsProps {
    selection: string;
    user: IUser;
    isOwner: boolean;
}

const SpecialEvents: React.FC<SpecialEventsProps> = ({
    selection,
    user,
    isOwner,
}) => {
    const [teamChoice, setTeamChoice] = useState(selection);
    const { address } = useAccount();
    const toast = useToast();
    const { loggedIn } = useGlobalContext();
    const pickAsideDesc = `Pick a side for your chance to win an NFT! There will be an epic Wildcard showdown between the two sides, with a few lucky raffle winners chosen from the supporters of the winning side! Tweet your support to increase your raffle odds by 10x!`;

    /**
     * Select a team by updating state and writing to DB
     * @param selection - the team being selected
     */
    async function selectTeam(selection: string) {
        if (!loggedIn) {
            toast({
                ...toastDefaultOptions,
                description: "Login first to select your side!",
                status: "warning",
                duration: 10000,
            });
            return;
        }
        setTeamChoice(selection);
        await axios.post("/api/updateAlphaSeriesSelection/", {
            selection,
            address,
        });
    }
    const renderRaffleCards = () => {
        return (
            <Flex
                id="raffle-cards"
                w={"45%"}
                justifyContent={"center"}
                alignItems={"center"}
            >
                <Flex>
                    <Box mr={4}>
                        <RaffleTeamCard
                            teamName={TeamChoices.BAYC}
                            teamImg=""
                            selected={teamChoice === TeamChoices.BAYC}
                            onClick={() => selectTeam(TeamChoices.BAYC)}
                            isOwner={isOwner}
                            canTweet={Boolean(
                                user.twitterProvider && user.twitterProvider.id
                            )}
                        />
                    </Box>
                    <Box ml={4}>
                        <RaffleTeamCard
                            teamName={TeamChoices.OKAY_BEARS}
                            teamImg=""
                            selected={teamChoice === TeamChoices.OKAY_BEARS}
                            onClick={() => selectTeam(TeamChoices.OKAY_BEARS)}
                            isOwner={isOwner}
                            canTweet={Boolean(
                                user.twitterProvider && user.twitterProvider.id
                            )}
                        />
                    </Box>
                </Flex>
            </Flex>
        );
    };

    const renderEventDetails = () => {
        return (
            <Flex
                id="event-details"
                flexDirection={"column"}
                w={["90%", "90%", "45%"]}
                alignItems={"center"}
                mb={"25px"}
            >
                <Image
                    src={PickASide.src}
                    alt="pick a side"
                    maxW={"350px"}
                    w={"90%"}
                    mb={4}
                />
                <Text
                    className={gilroyMedium.className}
                    fontSize={"sm"}
                    fontStyle={"italic"}
                    color={THEME_COLOR_STEEL_GREY}
                    mb={6}
                >
                    {pickAsideDesc}
                </Text>
                <Text color={THEME_COLOR_DARK_GOLD}>
                    SERIES 01 SHOWDOWN: JULY 10, 2023
                </Text>
            </Flex>
        );
    };

    return (
        <Box mt={10} id="special-events" maxW={"100%"}>
            <Flex
                flexDirection={"column"}
                alignItems={"start"}
                h={"100%"}
                color="black"
                maxW={"1000px"}
                w={"100%"}
            >
                <Flex
                    px={"10px"}
                    w={"100%"}
                    flexDirection="column"
                    alignItems={"center"}
                    className={gilroyBlack.className}
                >
                    <Text fontSize={"4xl"} mt={1} textAlign={"center"}>
                        Wildcard Special Events
                    </Text>
                    <Text
                        color={THEME_COLOR_DARK_GOLD}
                        fontSize={"3xl"}
                        fontFamily="gilroy-black"
                        mb={2}
                        textAlign={"center"}
                    >
                        Join us in celebrating other communities
                    </Text>
                </Flex>
                <Flex
                    boxShadow={"lg"}
                    rounded="md"
                    m={"15px"}
                    bg="white"
                    p={[3, 6, 10]}
                    flexDirection="column"
                    id="card-content-wrapper"
                >
                    <Flex
                        id="card-content"
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        flexDirection={["column", "column", "row"]}
                    >
                        {renderEventDetails()}
                        {renderRaffleCards()}
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
};

export default SpecialEvents;
