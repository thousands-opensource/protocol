import { Button, Image } from "@chakra-ui/react";

interface RawChatActionBodyProps {
    chatAction: any;
    setSelectedChatAction: any;
}
const RawChatActionBody = ({
    chatAction,
    setSelectedChatAction,
}: RawChatActionBodyProps) => {
    const {
        actionLabel,
        text,
        type,
        optionAImageUrl,
        optionBImageUrl,
        chatActionGuid,
        eventId,
        durationMs,
        timestamp,
    } = chatAction;
    if (type === "system-yesno") {
        return (
            <>
                <Image
                    loading="lazy"
                    objectFit="contain"
                    maxH="45px"
                    maxW="45px"
                    sx={{
                        alignSelf: "center",
                        cursor: "pointer",
                        borderRadius: "25px",
                    }}
                    src={optionAImageUrl as string}
                    alt="option-a-image-url"
                    onClick={() =>
                        setSelectedChatAction({
                            actionLabel,
                            text,
                            type,
                            optionAImageUrl,
                            chatActionGuid,
                            eventId,
                            command: "joinyes",
                            durationMs,
                            timestamp,
                        })
                    }
                />
                <Image
                    loading="lazy"
                    objectFit="contain"
                    maxH="45px"
                    maxW="45px"
                    sx={{
                        alignSelf: "center",
                        cursor: "pointer",
                        borderRadius: "25px",
                    }}
                    src={optionBImageUrl as string}
                    alt="option-a-image-url"
                    onClick={() =>
                        setSelectedChatAction({
                            actionLabel,
                            text,
                            type,
                            optionBImageUrl,
                            chatActionGuid,
                            eventId,
                            command: "joinno",
                            durationMs,
                            timestamp,
                        })
                    }
                />
            </>
        );
    } else if (type === "system-join") {
        // temporary fix for now
        if (!optionAImageUrl) {
            return null;
        }

        return (
            <Image
                loading="lazy"
                objectFit="contain"
                maxH="45px"
                maxW="45px"
                sx={{
                    alignSelf: "center",
                    cursor: "pointer",
                    borderRadius: "25px",
                }}
                src={optionAImageUrl as string}
                alt="option-a-image-url"
                onClick={() =>
                    setSelectedChatAction({
                        actionLabel,
                        text,
                        type,
                        optionAImageUrl,
                        chatActionGuid,
                        eventId,
                        durationMs,
                        command: "joinyes",
                        timestamp,
                    })
                }
            />
        );
    }
};
export default RawChatActionBody;
