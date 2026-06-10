import React, { useRef, useState } from "react";
import { Box, Flex, Text, useToast, useDisclosure } from "@chakra-ui/react";
import PubnubHeader from "./PubnubHeader";
import PubnubParticipants from "./PubnubParticipants";
import PubnubChatbox from "./PubnubChatbox";
import { UserEntityWithMembership } from "@pubnub/react-chat-components";
import PubnubChannelList from "./PubnubChannelList";
import { poppinsBold } from "@/utils/themeUtil";
import { ICollectible } from "@repo/interfaces";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { THEME_COLOR_BG_PRIMARY } from "@/constants";
import { useStreamContext } from "@/contexts/streamContext";

type PubnubChatProps = {
    channelOccupants: { uuid: string }[];
    members: UserEntityWithMembership[];
    canInviteUpOnStage: boolean;
    collectibles: ICollectible[];
};

const PubnubChat = ({
    channelOccupants,
    members,
    canInviteUpOnStage,
    collectibles,
}: PubnubChatProps): JSX.Element => {
    const [showParticipants, setShowParticipants] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { activeChannel, showChat, setShowChat, streamId } =
        useStreamContext();
    const toast = useToast();
    const selectedCollectibleRef = useRef<string>("");

    const renderPubnubChatParticipantsJsx = () => {
        if (showParticipants) {
            return (
                <PubnubParticipants
                    canInviteUpOnStage={canInviteUpOnStage}
                    channelOccupants={channelOccupants}
                    members={members}
                    streamId={streamId}
                />
            );
        }

        return <PubnubChatbox />;
    };

    const renderPubnubChannelList = () => {
        return (
            <Flex
                flexDirection="column"
                overflow="hidden"
                height={"100%"}
                justifyContent={"space-between"}
            >
                <Flex
                    id="event-chats"
                    flexDirection={"column"}
                    height={"100%"}
                    backgroundColor={THEME_COLOR_BG_PRIMARY}
                    sx={{
                        "& .pn-channel-list": {
                            background: "#1E1E1E",
                        },
                    }}
                >
                    <Text
                        className={poppinsBold.className}
                        fontSize={"sm"}
                        px={3}
                        py={2}
                    >
                        Event Chats
                    </Text>
                    <Box height={"100%"} overflow={"auto"}>
                        <PubnubChannelList />
                    </Box>
                </Flex>
                {/*
                <Flex
                    flexDirection={"column"}
                    id="event-store"
                    height={"100%"}
                    overflow={"auto"}
                    backgroundColor={"#262626"}
                    px={3}
                    py={2}
                    rowGap={4}
                >
                    <Text className={poppinsBold.className} fontSize={"sm"}>
                        Event Store
                    </Text>
                    <Flex sx={{ flexDir: "column" }}>
                        <Text
                            fontSize="md"
                            color={THEME_COLOR_CLOUD_GREY}
                            className={poppinsMedium.className}
                            w={"23ch"}
                        >
                            Purchase items in the store to earn more Points.
                            Complete sets to earn exponential rewards
                        </Text>
                    </Flex>
                    <CollectibleStore
                        collectibles={collectibles}
                        openBuyModal={onOpen}
                        selectedCollectibleRef={selectedCollectibleRef}
                    />
                </Flex>
                 */}
            </Flex>
        );
    };

    const renderPubnubMain = () => {
        if (!showChat) {
            return renderPubnubChannelList();
        }

        return (
            <>
                <PubnubHeader
                    showParticipants={showParticipants}
                    setShowParticipants={setShowParticipants}
                    activeChannel={activeChannel}
                    setShowChat={setShowChat}
                />
                {renderPubnubChatParticipantsJsx()}
            </>
        );
    };

    return (
        <Flex flexDirection="column" w={"100%"} h="100%">
            <Flex
                flexDirection="column"
                height={"100%"}
                justifyContent={"space-between"}
                sx={{
                    "& .pn-member-list": {
                        backgroundColor: "#231E32",
                    },
                }}
            >
                {renderPubnubMain()}
            </Flex>
            <ConfirmationModal
                isOpen={isOpen}
                onClose={() => {
                    onClose();
                    selectedCollectibleRef.current = "";
                }}
                onConfirm={() => {
                    toast({
                        description: `Successfully bought ${selectedCollectibleRef.current}`,
                        status: "success",
                        duration: 5000,
                        position: "top",
                    });
                }}
                itemName={selectedCollectibleRef.current}
                modalTitle={"Buy Collectible NFT"}
            />
        </Flex>
    );
};

export default PubnubChat;
