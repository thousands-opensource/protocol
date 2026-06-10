import { Dispatch, SetStateAction } from "react";
import { useStreamContext } from "@/contexts/streamContext";
import { poppinsBold } from "@/utils/themeUtil";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Text, Avatar } from "@chakra-ui/react";
import { ObjectCustom } from "pubnub";
import { FaComments, FaUsers } from "react-icons/fa";
import { IoMdShare } from "react-icons/io";
import { ChannelEntity } from "@pubnub/react-chat-components";

interface PubnubHeaderProps {
    showParticipants: boolean;
    setShowParticipants: Dispatch<SetStateAction<boolean>>;
    activeChannel: ChannelEntity;
    setShowChat: Dispatch<SetStateAction<boolean>>;
    hasBackButton?: boolean;
}

const PubnubHeader = ({
    showParticipants,
    setShowParticipants,
    activeChannel,
    setShowChat,
    hasBackButton = false,
}: PubnubHeaderProps) => {
    const { name, custom } = activeChannel;

    const customProps = custom as ObjectCustom;
    const channelIcon = customProps["profileUrl"] as string;
    const fallbackIcon = "/images/wildcard-gold-logo.png";

    const renderBackButton = () => {
        if (!hasBackButton) {
            return <></>;
        }

        return (
            <IconButton
                aria-label="Toggle chat"
                icon={<ArrowBackIcon />}
                onClick={() => {
                    setShowChat(false);
                    setShowParticipants(false);
                }}
                sx={{
                    cursor: "pointer",
                    height: "inherit",
                    fontSize: "1.5rem",
                    mr: 0,
                }}
                _hover={{ background: "unset" }}
                variant="ghost"
            />
        );
    };

    return (
        <Flex
            alignItems="center"
            height={"54px"}
            justifyContent={"space-between"}
            backgroundColor={"#231E32"}
        >
            <Flex flexDirection={"row"} alignItems={"center"} gap={2} px={2}>
                {renderBackButton()}
                <IoMdShare />
                <Avatar
                    boxSize={"25px"}
                    backgroundColor={"orange"}
                    src={channelIcon ?? fallbackIcon}
                />
                <Text fontSize="sm" className={poppinsBold.className}>
                    {name}
                </Text>
            </Flex>
            <IconButton
                aria-label="Toggle members"
                icon={showParticipants ? <FaComments /> : <FaUsers />}
                onClick={() => {
                    setShowParticipants(!showParticipants);
                }}
                _hover={{ background: "unset" }}
                variant="ghost"
            />
        </Flex>
    );
};

export default PubnubHeader;
