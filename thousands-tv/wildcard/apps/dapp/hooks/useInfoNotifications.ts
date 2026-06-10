"use client";
import { useToast, UseToastOptions } from "@chakra-ui/react";
import { useCallback } from "react";

export function useInfoNotifications() {
    const toast = useToast();

    const onMessage = useCallback(
        ({
            id = "info-toast", // Default ID for the toast (prevents rerendering of multiple notifications)
            position = "bottom",
            status = "info",
            duration = 5000,
            ...rest
        }: UseToastOptions) => {
            if (!toast.isActive(id)) {
                toast({
                    id,
                    position: position,
                    variant: status,
                    status: status,
                    duration: duration,
                    isClosable: true,
                    ...rest,
                });
            }
        },
        [toast]
    );

    return { onMessage };
}
