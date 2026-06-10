import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";
import { useStreamContext } from "@/contexts/streamContext";
import { WildcardActionMetaData, IdleEvent } from "@/types";
import { Tooltip, Flex, Text, Box, useToast } from "@chakra-ui/react";
import { WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { usePubNub } from "pubnub-react";
import { Dispatch, SetStateAction, useState } from "react";

interface ConsumableActionProps {
    metadata: WildcardActionMetaData;
    personalCredit: number;
    userId: string;
    userName: string;
}

interface SendCommandResponse {
    Success: boolean;
    Err: string;
    Timestamp: number;
    RolledUpPersonalCredits: number;
    IdleEvent: IdleEvent | undefined;
    IdleEvents?: IdleEvent[] | undefined;
}

const ConsumableAction = ({
    metadata,
    personalCredit,
    userId,
    userName,
}: ConsumableActionProps) => {
    const { title, command, credit, icon, description, joinable } = metadata;
    const { activeChannel, streamId, eventId, vendorEventId } =
        useStreamContext();
    const [isHover, setIsHover] = useState<boolean>(false);
    const toast = useToast();
    const { personalEvents, setPersonalEvents, setRolledUpPersonalCredit } =
        useChatAppIdleGameContext();
    const pubnub = usePubNub();

    const sendCommand = async (command: string) => {
        try {
            if (credit > personalCredit) {
                toast({
                    description: `Not enough credits`,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            console.log("sendCommand: userId: ", userId);
            console.log("sendCommand: userName: ", userName);
            console.log("sendCommand: eventId: ", eventId);
            console.log("sendCommand: vendorEventId: ", vendorEventId);

            const { data }: { data: WildcardApiResponse } = await axios.post(
                "/api/sendCommand",
                { streamId, eventId, vendorEventId, userId, userName, command },
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

            console.log(data);

            const {
                IdleEvent,
                Timestamp,
                Success,
                Err,
                RolledUpPersonalCredits,
            } = data.data as SendCommandResponse;

            if (!Success || IdleEvent == undefined) {
                console.log(Err);
                toast({
                    description: Err,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const idleEvent: IdleEvent = IdleEvent;
            if (idleEvent !== undefined && idleEvent) {
                setPersonalEvents([...personalEvents, idleEvent]);

                if (RolledUpPersonalCredits != 0) {
                    setRolledUpPersonalCredit(RolledUpPersonalCredits);
                }

                toast({
                    description: `Successfully sent action: ${idleEvent.name}`,
                    status: "success",
                    duration: 5000,
                    position: "top",
                });

                var publishConfig = {
                    channel: activeChannel.id,
                    message: {
                        text: description,
                        type: "personal",
                        user: {
                            id: pubnub.getUUID(),
                        },
                        icon,
                        actionLabel: title,
                        joinable,
                    },
                };
                pubnub.publish(publishConfig, function (status, response) {
                    // Publish message to current channel.
                    // console.log(status, response);
                });
            }
        } catch (e: any) {
            console.error(`Failed to send command`, e);
            toast({
                description: `Failed to send command: ${e.message}`,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }
    };

    return (
        <Tooltip hasArrow label={description} placement="bottom" key={command}>
            <Flex
                sx={{
                    backgroundColor: "var(--chakra-colors-blue-800)",
                    h: "95px",
                    w: "100px",
                    _hover: {
                        transform: "scale(1.05)",
                    },
                    gap: 2,
                    _first: { borderLeftRadius: "12px" },
                    _last: { borderRightRadius: "12px" },
                    cursor: "pointer",
                    justifyContent: "center",
                }}
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
                onClick={async () => {
                    await sendCommand(command);
                }}
            >
                <Flex
                    sx={{
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Text fontSize={"md"}>{title}</Text>
                    <Text fontSize={"xs"} display={isHover ? "block" : "none"}>
                        {credit}
                    </Text>
                    <Box w={"50px"} fontSize={"2.5rem"} alignSelf={"center"}>
                        {icon}
                    </Box>
                </Flex>
            </Flex>
        </Tooltip>
    );
};
export default ConsumableAction;
