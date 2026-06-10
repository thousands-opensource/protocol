import { useState, useCallback } from "react";
import axios from "axios";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { useRouter } from "next/router";
import useLoadingWithRouter from "../loadingStateManagement/useLoadingWithRouter";

interface UseEnterEventReturn {
    isEntering: boolean;
    fetchStreamId: (eventId: string) => Promise<string | null>;
    enterEvent: (streamId: string) => void;
}

/**
 * Hook to Enter an Event
 */
export const useEnterEvent = (): UseEnterEventReturn => {
    const [isEntering, setIsEntering] = useState<boolean>(false);
    const { onMessage } = useInfoNotifications();
    const router = useRouter();
    const { serverCode } = router.query;
    const { startLoading } = useLoadingWithRouter();

    const fetchStreamId = useCallback(
        async (stageId: string): Promise<string | null> => {
            if (!stageId) {
                onMessage({
                    title: "Error",
                    description: "Event ID is missing. Cannot enter the stage.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return null;
            }

            setIsEntering(true);

            try {
                const response = await axios.get(
                    `/api/claimedTickets/getStreamIdByStageId?stageId=${stageId}`
                );
                const streamId = response.data.streamId;

                if (!streamId) {
                    onMessage({
                        title: "Error",
                        description:
                            "Stream ID not found. Please try again later.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                    return null;
                }

                return streamId;
            } catch (error) {
                console.error("Error fetching stream ID:", error);
                onMessage({
                    title: "Error",
                    description: "Failed to fetch stream ID. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return null;
            } finally {
                setIsEntering(false);
            }
        },
        [onMessage]
    );

    const enterEvent = useCallback(
        (streamId: string) => {
            startLoading(`Loading event...`);

            window.location.href = `/${serverCode}/stream/${streamId}`;
        },
        [serverCode]
    );
    return { isEntering, fetchStreamId, enterEvent };
};
