import React from "react";
import { Box } from "@chakra-ui/react";

interface NotificationCounterProps {
    count: number;
}

/**
 * Notification Counter component to display the count of unread notifications.
 */
export const NotificationCounter: React.FC<NotificationCounterProps> = ({
    count,
}) => {
    if (count <= 0) return null;

    return (
        <Box
            position="absolute"
            top="-1"
            right="-1"
            px="2"
            py="1"
            fontSize="xs"
            fontWeight="bold"
            lineHeight="none"
            color="white"
            bg="red.500"
            borderRadius="full"
        >
            {count}
        </Box>
    );
};
