import { Circle } from "@chakra-ui/react";

interface NotificationBadgeProps {
    count: number;
}

/**
 * Notification badge component for displaying the number of unread notifications.
 */
export const NotificationBadge = ({ count }: NotificationBadgeProps) => (
    <Circle
        size="20px"
        bg="red.500"
        color="white"
        fontSize="xs"
        position="absolute"
        top="-1"
        right="-1"
        fontWeight="bold"
        border="2px solid #1A1A1A"
    >
        {count}
    </Circle>
);
