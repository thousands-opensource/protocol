import {
    THEME_COLOR_CLOUD_GREY,
    THEME_COLOR_DARK_ONYX,
    THEME_COLOR_YELLOW_DARK,
} from "@/constants/constants";
import {
    Text,
    Image,
    Card,
    Stack,
    CardBody,
    Flex,
    useToast,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import CountdownProgress from "./CountdownProgress";
import { useStreamContext } from "@/contexts/streamContext";
import { WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";
import { IdleEvent, SendCommandResponse } from "@/types";
import { usePubNub } from "pubnub-react";
import { getActivePfpUrl } from "@repo/utils";

interface ChatActionProps {
    chatAction: any;
    isMessage?: boolean;
    isLiveAction?: boolean;
    children?: ReactNode | ReactNode[];
}

const ChatAction = ({
    chatAction,
    isMessage = false,
    isLiveAction = false,
    children,
}: ChatActionProps) => {
    const {
        chatActionGuid,
        actionLabel,
        text,
        durationMs,
        timestamp,
        optionAImageUrl,
        optionBImageUrl,
        type,
        command,
    } = chatAction;
    const {
        streamId,
        eventId,
        vendorEventId,
        setOpenChatActions,
        activeChannel,
    } = useStreamContext();
    const { userDB } = useWildfileUserContext();
    const { personalEvents, setPersonalEvents, setRolledUpPersonalCredit } =
        useChatAppIdleGameContext();
    const pubnub = usePubNub();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // const isCardClickable = !type && !optionAImageUrl && !optionBImageUrl;

    const sendActionCommand = async () => {
        const userId: string = userDB?._id!.toString() ?? "";
        const userName: string = userDB?.preferences.displayName ?? "";
        const { data }: { data: WildcardApiResponse } = await axios.post(
            "/api/sendCommand",
            {
                streamId,
                eventId,
                vendorEventId,
                userId,
                userName,
                command,
                chatActionGuid,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!data.success) {
            console.log(data.err);
            toast({
                description: data.err,
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        const { IdleEvent, Timestamp, Success, Err, RolledUpPersonalCredits } =
            data.data as SendCommandResponse;

        if (!Success || !IdleEvent) {
            console.log("Failed to find an idle event: ", Err);
            toast({
                description: Err,
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        const idleEvent: IdleEvent = IdleEvent;
        if (idleEvent.isPersonalEvent) {
            setPersonalEvents([...personalEvents, idleEvent]);

            console.log(
                "Action RolledUpPersonalCredits: ",
                RolledUpPersonalCredits
            );

            if (RolledUpPersonalCredits !== 0) {
                setRolledUpPersonalCredit(RolledUpPersonalCredits);
            }

            const publishParams = {
                channel: activeChannel.id,
                message: {
                    type: "personalAction",
                    personalAction: {
                        chatActionGuid,
                        actionLabel,
                        text,
                        durationMs: idleEvent.duration,
                        timestamp: idleEvent.timestamp,
                        command,
                        type,
                    },
                    sender: {
                        id: userDB?._id!.toString(),
                        name: userDB?.preferences?.displayName,
                        profileUrl: getActivePfpUrl(userDB),
                    },
                },
            };
            setOpenChatActions(false);

            pubnub.publish(publishParams, function (status, response) {
                // Publish message to current channel.
            });
        }
    };

    const handleCardClick = async () => {
        // Check if it is a message
        if (isMessage) {
            return;
        }

        // Check if action is currently clicked
        if (isLoading) {
            return;
        }

        try {
            setIsLoading(true);
            await sendActionCommand();
        } catch (e: any) {
            const errMsg = "Failed to send action to idle service";
            console.error(errMsg, e);
            toast({
                description: `${errMsg}: ${e.message}`,
                status: "error",
                duration: 5000,
                position: "top",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card
            direction={"row"}
            // overflow="hidden"
            variant="outline"
            backgroundColor={THEME_COLOR_DARK_ONYX}
            // maxW={"275px"}
            minW={"150px"}
            cursor={isMessage || isLoading ? "default" : "pointer"}
            onClick={handleCardClick}
            position="relative"
        >
            <Image
                objectFit="contain"
                maxH="60px"
                maxW="60px"
                src={"/images/goalieko.png"}
                alt="cheer"
            />

            <Stack w={"100%"}>
                <CardBody py={0} px={"0px"} h="100%">
                    <Flex
                        flexDirection={"row"}
                        w="100%"
                        h="91%"
                        columnGap={2}
                        mb={0.5}
                        // ml={2}
                        pl={2}
                    >
                        <Flex
                            flexDirection={"column"}
                            w="100%"
                            h="100%"
                            justifyContent={"center"}
                        >
                            <Text fontSize={"14px"}>{actionLabel}</Text>
                            <Text
                                fontSize={"10px"}
                                color={THEME_COLOR_CLOUD_GREY}
                                lineHeight={1.2}
                            >
                                {text}
                            </Text>
                        </Flex>
                        <Flex
                            flexDirection={"row"}
                            alignSelf="center"
                            w="100%"
                            flexShrink={2}
                            gap={1}
                        >
                            {children}
                        </Flex>
                    </Flex>
                    {isLiveAction && (
                        <CountdownProgress
                            chatActionGuid={chatActionGuid}
                            durationMs={durationMs}
                            eventActionTimestamp={timestamp}
                        />
                    )}
                </CardBody>
            </Stack>
            {isLoading && (
                <VStack
                    position={"absolute"}
                    w="100%"
                    h={"100%"}
                    backgroundColor={"#2d2d2dd9"}
                >
                    <Spinner
                        position={"absolute"}
                        top="20%"
                        left="50%"
                        size="md"
                        color={THEME_COLOR_YELLOW_DARK}
                    />
                </VStack>
            )}
        </Card>
    );
};

export default ChatAction;
