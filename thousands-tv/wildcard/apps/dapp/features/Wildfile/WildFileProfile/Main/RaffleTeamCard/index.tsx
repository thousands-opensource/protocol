import { Text, Flex, Image, Box, VStack } from "@chakra-ui/react";
import React from "react";
import Selected from "@/public/images/WildfileAssets/selected.svg";
import Unselected from "@/public/images/WildfileAssets/unselected.svg";
import GradientButton from "@/components/GradientButton";
import { generateShareToTwitterWebIntentURL } from "@/utils/util";
import TweetButton from "@/components/TweetButton";

interface RaffleTeamCardProps {
    teamName: string;
    teamImg: string;
    selected: boolean;
    onClick: Function;
    isOwner: boolean;
    canTweet: boolean;
}

const RaffleTeamCard: React.FC<RaffleTeamCardProps> = ({
    teamName,
    teamImg,
    selected,
    onClick,
    isOwner,
    canTweet,
}) => {
    const TWITTER_SHARE_WEB_URL = "pic.twitter.com/1AIDDADNat";
    const TWITTER_SHARE_TEXT = `I chose ${teamName}! Join in on the Wildcard experience: My Wildfile is ready!`;
    const TWITTER_SHARE_HASH_TAGS = ["wildcard", "web3"];
    const tweetUrl = generateShareToTwitterWebIntentURL(
        TWITTER_SHARE_TEXT,
        TWITTER_SHARE_WEB_URL,
        TWITTER_SHARE_HASH_TAGS
    );
    return (
        <VStack position={"relative"}>
            <Flex
                bgColor={"hsl(0, 0%, 85%)"}
                p={4}
                pt={2}
                borderRadius={"8px"}
                justifyContent="space-between"
                flexDirection={"column"}
                alignItems={"center"}
                h={"200px"}
                w={"140px"}
            >
                <Box w={"100%"}>
                    <Image
                        src={selected ? Selected.src : Unselected.src}
                        alt="select"
                        w={"30px"}
                    />
                </Box>
                <Image src={teamImg || Unselected.src} alt="team-image" />
                <Text>{teamName}</Text>
            </Flex>
            {isOwner && (
                <GradientButton
                    label={selected ? "SELECTED" : "SELECT"}
                    onClick={() => onClick()}
                />
            )}
            {selected && isOwner && (
                <TweetButton
                    tweetUrl={tweetUrl}
                    disabled={!canTweet}
                    sx={{ cursor: canTweet ? "pointer" : "not-allowed" }}
                />
            )}
        </VStack>
    );
};

export default RaffleTeamCard;
