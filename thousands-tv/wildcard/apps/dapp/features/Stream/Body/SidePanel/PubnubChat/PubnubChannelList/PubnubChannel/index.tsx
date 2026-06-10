import { useState } from "react";
import { THEME_COLOR_CLOUD_GREY } from "@/constants/constants";
import { useStreamContext } from "@/contexts/streamContext";
import { poppinsMedium } from "@/utils/themeUtil";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Flex, Text, Avatar } from "@chakra-ui/react";
import { ChannelEntity } from "@pubnub/react-chat-components";
import { ObjectCustom } from "pubnub";
import { usePubNub } from "pubnub-react";
import { IoMdShare } from "react-icons/io";

interface PubnubChannelProps {
    channel: ChannelEntity;
}

const PubnubChannel = ({ channel }: PubnubChannelProps) => {
    const { activeChannel, setActiveChannel, setShowChat } = useStreamContext();
    const { id, name, custom } = channel;
    const [isHover, setIsHover] = useState<boolean>(false);
    const pubnub = usePubNub();

    const customProps = custom as ObjectCustom;
    const channelIcon = customProps["profileUrl"] as string;
    const fallbackIcon = "/images/wildcard-gold-logo.png";

    const handleClickChannel = () => {
        setActiveChannel(channel);
        setShowChat(true);
    };

    return (
        <Flex
            justifyContent={"space-between"}
            alignItems={"center"}
            px={3}
            py={2}
            cursor={"pointer"}
            color={activeChannel.id === id ? "white" : THEME_COLOR_CLOUD_GREY}
            _hover={{
                backgroundColor: "var(--channel--hover__background)",
                color: "white",
            }}
            onClick={handleClickChannel}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            backgroundColor={
                activeChannel.id === id
                    ? "var(--channel--active__background)"
                    : "transparent"
            }
        >
            <Flex gap={3} alignItems={"center"}>
                <IoMdShare />
                <Avatar
                    boxSize={"25px"}
                    backgroundColor={"orange"}
                    src={channelIcon ?? fallbackIcon}
                />
                <Text fontSize={"xs"} className={poppinsMedium.className}>
                    {name}
                </Text>
            </Flex>
            <Box display={isHover ? "block" : "none"}>
                <ArrowForwardIcon w={"100%"} />
            </Box>
        </Flex>
    );
};

export default PubnubChannel;
