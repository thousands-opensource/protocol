import { useState, useEffect } from "react";
import { Progress, Box, Text } from "@chakra-ui/react";
import { useStreamContext } from "@/contexts/streamContext";
import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";

interface CountdownProgressProp {
    chatActionGuid: string;
    durationMs: number;
    eventActionTimestamp: number;
}

const CountdownProgress = ({
    chatActionGuid,
    durationMs,
    eventActionTimestamp,
}: CountdownProgressProp) => {
    const durationSeconds = Math.floor(durationMs / 1000);

    const { liveChatActions, setLiveChatActions, setSelectedChatAction } =
        useStreamContext();
    const { dateTimeOffsetRef } = useChatAppIdleGameContext();
    const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
    const [progress, setProgress] = useState<number>(100);

    useEffect(() => {
        if (!dateTimeOffsetRef || !dateTimeOffsetRef.current) {
            console.error("dateTimeOffsetRef.current is null");
            return;
        }

        const interval = setInterval(() => {
            const adjustedFrontendTimestamp =
                Date.now() - dateTimeOffsetRef.current;
            const elapsedMs = adjustedFrontendTimestamp - eventActionTimestamp;
            const newTimeLeft = Math.max(
                0,
                durationSeconds - Math.floor(elapsedMs / 1000)
            );
            setTimeLeft(newTimeLeft);
            setProgress((newTimeLeft / durationSeconds) * 100);

            // Clear interval when timeLeft reaches 0
            if (newTimeLeft <= 0) {
                const newLiveChatActions = liveChatActions.filter(
                    (pca: any) => {
                        pca.chatActionGuid !== chatActionGuid;
                    }
                );
                setLiveChatActions(newLiveChatActions);
                setSelectedChatAction(null);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    return (
        <Progress
            value={progress}
            height=".15rem"
            backgroundColor="var(--chakra-colors-whiteAlpha-300)"
            sx={{
                "& div": {
                    backgroundColor: "var(--chakra-colors-whiteAlpha-900)",
                },
            }}
        />
    );
};

export default CountdownProgress;
