import { Card, Flex, Stack, Text, useOutsideClick } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import NotificationCardMenu from "./NotificationCardMenu";
import { formatDateTime } from "@/utils/userNotificationUtil";
import { INotification } from "@repo/interfaces";

export interface NotificationCardProps {
    notification: INotification;
    onReadStatusChange: (notificationId: string, isRead: boolean) => void;
    onDelete: (notificationId: string) => void;
}

/**
 * NotificationCard component to display a notification.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
    notification,
    onReadStatusChange,
    onDelete,
}) => {
    const dropdownRef = useRef(null);
    const [dropdownIsOpen, setDropdownIsOpen] = useState(false);
    const [isRead, setIsRead] = useState(notification?.isRead);

    useOutsideClick({
        ref: dropdownRef,
        handler: () => {
            if (dropdownIsOpen) {
                setDropdownIsOpen(false);
            }
        },
    });

    if (!notification) {
        return null;
    }

    return (
        <Card
            ref={dropdownRef}
            _hover={{ bg: "whiteAlpha.300" }}
            bg={"whiteAlpha.100"}
            border={"none"}
            borderTop="8px"
            borderTopColor={isRead ? "transparent" : "blue.500"}
            p="10px"
        >
            <Flex>
                <Stack spacing={2} ml="4" w="100%">
                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                        {notification.subject}
                    </Text>
                    <Text fontSize={{ base: "md", md: "lg" }}>
                        {notification.body}
                    </Text>
                    <Stack justifyContent={"space-between"}>
                        {notification.sentAt ? (
                            <Text fontSize="md">
                                {new Date(
                                    notification.sentAt
                                ).toLocaleDateString()}
                            </Text>
                        ) : null}
                    </Stack>
                    <Stack justifyContent={"space-between"}>
                        {notification.createdAt ? (
                            <Text fontSize="md">
                                {formatDateTime(notification.createdAt)}
                            </Text>
                        ) : null}
                    </Stack>
                </Stack>

                <Flex align={"flex-start"} p="2">
                    <NotificationCardMenu
                        notification={notification}
                        onReadStatusChange={onReadStatusChange}
                        onDelete={onDelete}
                        setIsRead={setIsRead}
                        isRead={isRead}
                    />
                </Flex>
            </Flex>
        </Card>
    );
};
