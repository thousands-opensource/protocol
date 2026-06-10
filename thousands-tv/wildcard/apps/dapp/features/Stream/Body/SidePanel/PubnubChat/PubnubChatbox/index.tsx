import { useEffect, useRef } from "react";
import { Flex, Text } from "@chakra-ui/react";
import {
    MessageList,
    MessageEnvelope,
    MessagePayload,
    MessageRendererProps,
} from "@pubnub/react-chat-components";
import { ObjectCustom, UUIDMetadataObject } from "pubnub";
import MessageItem from "./MessageItem";
import ChatAction from "@/features/Stream/Footer/ChatAction";
import FinalizedChatActionBody from "@/features/Stream/Footer/ChatAction/FinalizedChatActionBody";

const PubnubChatbox = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Function to scroll to the bottom of the message list
    const scrollToBottom = () => {
        if (containerRef.current) {
            const scroller = containerRef.current.querySelector(
                ".pn-msg-list-scroller"
            );
            if (scroller) {
                scroller.scrollTop = scroller.scrollHeight;
            }
        }
    };

    // This useEffect will trigger scroll when the component mounts
    useEffect(() => {
        scrollToBottom();
    }, []);

    return (
        <Flex
            flexDirection={"column"}
            // bg="red"
            h="100%"
            w="100%"
            justifyContent={"space-between"}
            sx={{
                "& .pn-msg__actions": {
                    display: "block",
                },
                "& .pn-msg-list": {
                    backgroundColor: "#231E32",
                },
                "& .pn-msg": {
                    padding: "6px 16px",
                },
            }}
            overflowY={"auto"}
            ref={containerRef}
        >
            <MessageList
                fetchMessages={25}
                messageRenderer={(message: MessageRendererProps) => {
                    const messagePayload = message.message
                        .message as MessagePayload;
                    console.log("message", message);
                    const actionLabel = messagePayload["actionLabel"] as string;
                    console.log(
                        "message.type/messagePayload: ",
                        messagePayload.type,
                        messagePayload
                    );

                    const time = message.time;
                    const sender =
                        messagePayload.sender as UUIDMetadataObject<ObjectCustom>;
                    const name = sender?.name
                        ? (sender.name as string)
                        : "Anonymous";
                    const pfp = sender?.profileUrl ? sender?.profileUrl : "";

                    if (messagePayload.type === "personalAction") {
                        if (!messagePayload["personalAction"]) {
                            return <></>;
                        }

                        return (
                            <MessageItem time={time} name={name} pfp={pfp}>
                                <Flex borderRadius={"6px"}>
                                    <Flex flexDir={"column"} w="100%" gap={2}>
                                        <ChatAction
                                            chatAction={
                                                messagePayload["personalAction"]
                                            }
                                            isMessage={true}
                                        >
                                            <FinalizedChatActionBody
                                                chatAction={
                                                    messagePayload[
                                                        "personalAction"
                                                    ]
                                                }
                                            />
                                        </ChatAction>
                                        <Text
                                            flexWrap={"wrap"}
                                            sx={{
                                                fontSize: "12px",
                                                wordBreak: "break-all",
                                            }}
                                        >
                                            {messagePayload.text}
                                        </Text>
                                    </Flex>
                                </Flex>
                            </MessageItem>
                        );
                    }

                    return (
                        <MessageItem time={time} name={name} pfp={pfp}>
                            <Flex borderRadius={"6px"}>
                                <Flex flexDir={"column"} w="100%">
                                    <Text
                                        fontSize={"sm"}
                                        textTransform={"capitalize"}
                                    >
                                        {actionLabel}
                                    </Text>
                                    <Text
                                        flexWrap={"wrap"}
                                        sx={{
                                            fontSize: "12px",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {messagePayload.text}
                                    </Text>
                                </Flex>
                            </Flex>
                        </MessageItem>
                    );
                }}
                filter={(message: MessageEnvelope) => {
                    const messagePayload = message.message as MessagePayload;
                    if (!messagePayload.type) {
                        return false;
                    }

                    if (
                        !["default", "chatAction", "personalAction"].includes(
                            messagePayload.type
                        )
                    ) {
                        return false;
                    }

                    return true;
                }}
            />
        </Flex>
    );
};
export default PubnubChatbox;
