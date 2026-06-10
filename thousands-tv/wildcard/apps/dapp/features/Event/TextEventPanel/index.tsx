import React, { useState } from "react";
import {
    MessageInput,
    useChannelMembers,
    usePresence,
} from "@pubnub/react-chat-components";
import { Flex, IconButton, VStack } from "@chakra-ui/react";
import { useTextEventContext } from "@/contexts/textEventContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { UserRole } from "@repo/interfaces";
import PubnubParticipants from "@/features/Stream/Body/SidePanel/PubnubChat/PubnubParticipants";
import PubnubChatbox from "@/features/Stream/Body/SidePanel/PubnubChat/PubnubChatbox";
import PubnubHeader from "@/features/Stream/Body/SidePanel/PubnubChat/PubnubHeader";
import Picker from "@emoji-mart/react";
import pickerData from "@emoji-mart/data";

interface TextEventPanelProps {}

const TextEventPanel = ({}: TextEventPanelProps) => {
    const { userDB } = useWildfileUserContext();
    const { activeChannel } = useTextEventContext();
    const [presence] = usePresence({
        channels: [activeChannel.id],
        includeUUIDs: true,
    });

    const [showParticipants, setShowParticipants] = useState(false);
    const channelOccupants = presence[activeChannel.id]?.occupants;
    const [members, fetchPage, refetchChannelMembers, total, error, isLoading] =
        useChannelMembers({
            channel: activeChannel.id,
            include: {
                customUUIDFields: true,
                UUIDFields: true,
            },
        });

    const canInviteUpOnStage: boolean =
        userDB?.roles.includes(UserRole.ORGANIZER) || false;

    const renderPubnubChatParticipantsJsx = () => {
        if (showParticipants) {
            return (
                <PubnubParticipants
                    canInviteUpOnStage={canInviteUpOnStage}
                    channelOccupants={channelOccupants}
                    members={members}
                />
            );
        }

        return <PubnubChatbox />;
    };

    return (
        <VStack
            sx={{
                alignItems: "flex-start",
                width: "100%",
                height: "100%",
                flexGrow: 1,
                gap: 0,
            }}
        >
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
                    <PubnubHeader
                        showParticipants={showParticipants}
                        setShowParticipants={setShowParticipants}
                        activeChannel={activeChannel}
                        setShowChat={() => {}}
                    />
                    {renderPubnubChatParticipantsJsx()}
                    <MessageInput
                        senderInfo={true}
                        emojiPicker={
                            <IconButton
                                aria-label="emoji"
                                as={Picker}
                                data={pickerData}
                                theme={"dark"}
                            />
                        }
                        actionsAfterInput={true}
                    />
                </Flex>
            </Flex>
        </VStack>
    );
};
export default TextEventPanel;
