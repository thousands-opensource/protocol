import { MutableRefObject } from "react";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useStreamContext } from "@/contexts/streamContext";
import { IconButton, useToast } from "@chakra-ui/react";
import { MessageInput, MessagePayload } from "@pubnub/react-chat-components";
import axios from "axios";
import { UriFileInput } from "pubnub";
import Picker from "@emoji-mart/react";
import pickerData from "@emoji-mart/data";
import ChatActionsPopover from "../ChatActionsPopover";
import { WildcardApiResponse } from "@repo/interfaces";
import { IdleEvent } from "@/types";
import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";

interface PubnubChatInputProps {
    pubnubInputRef: MutableRefObject<HTMLDivElement | null>;
}

interface SendCommandResponse {
    Success: boolean;
    Err: string;
    Timestamp: number;
    RolledUpPersonalCredits: number;
    IdleEvent: IdleEvent | undefined;
}

const PubnubChatInput = ({ pubnubInputRef }: PubnubChatInputProps) => {
    const {
        streamId,
        eventId,
        vendorEventId,
        selectedChatAction,
        setSelectedChatAction,
        setOpenChatActions,
        showChat,
    } = useStreamContext();
    const { personalEvents, setPersonalEvents, setRolledUpPersonalCredit } =
        useChatAppIdleGameContext();
    const { userDB } = useWildfileUserContext();
    const toast = useToast();

    // const onSend = (message: MessagePayload | File | UriFileInput) => {
    //     console.log("on send", message);
    //     //    if ((message as MessagePayload | File).type === "default") {
    //     //    }
    // };

    const sendActionCommand = async () => {
        const userId: string = userDB?._id!.toString() ?? "";
        const userName: string = userDB?.preferences.displayName ?? "";
        const chatActionGuid: string = selectedChatAction.chatActionGuid;
        const command: string = selectedChatAction.command;
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
        }
    };

    const onBeforeSend = (message: MessagePayload) => {
        // Not in V1
        // if (selectedChatAction) {
        //     // call the api regarding chat action
        //     try {
        //         sendActionCommand();
        //     } catch (e: any) {
        //         console.log("Failed to send vote option to idle service");
        //     }
        //     // send chatAction payload to render it in the pubnub message
        //     message["chatAction"] = selectedChatAction;
        //     message.type = "chatAction";
        //     setOpenChatActions(false);
        //     setSelectedChatAction(null);
        // }
        return message;
    };

    if (!showChat) {
        return null;
    }

    return (
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
            extraActionsRenderer={() => {
                return <ChatActionsPopover pubnubInputRef={pubnubInputRef} />;
            }}
            // onSend={onSend}
            onBeforeSend={onBeforeSend}
        />
    );
};
export default PubnubChatInput;
