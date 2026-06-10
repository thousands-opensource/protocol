import { MessageBox } from "@/components/MessageBox";
import { Grid, Flex } from "@chakra-ui/react";
import { NotificationCard } from "./NotificationCard";
import { useState, useEffect } from "react";
import { INotificationResponses } from "@/types";
import { INotification } from "@repo/interfaces";

export interface NotificationCardStatesProps {
    pages: (INotificationResponses | undefined)[] | undefined;
    notificationLength: number;
}

/**
 * NotificationCardStates Grid to display the list of notification cards.
 */
export function NotificationCardStates(props: NotificationCardStatesProps) {
    const { pages, notificationLength } = props;
    const [notifications, setNotifications] = useState<INotification[]>([]);

    useEffect(() => {
        if (pages) {
            const validNotifications = pages
                .flatMap((page) => page?.data)
                .filter(
                    (notification): notification is INotification =>
                        !!notification
                );
            setNotifications(validNotifications);
        }
    }, [pages]);

    const handleReadStatusChange = (
        notificationId: string,
        isRead: boolean
    ) => {
        setNotifications((prevNotifications) =>
            prevNotifications.map((notification) =>
                notification._id === notificationId
                    ? { ...notification, isRead }
                    : notification
            )
        );
    };

    const handleDelete = (notificationId: string) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter(
                (notification) => notification._id !== notificationId
            )
        );
    };

    if (notifications.length === 0) {
        return (
            <>
                <MessageBox text="No Notifications have been detected yet" />
            </>
        );
    }

    return (
        <Flex justifyContent="center" alignItems={"center"}>
            <Grid
                gap={{
                    md: "10",
                    base: "5",
                }}
                templateColumns={{
                    base: "repeat(1, 1fr)",
                }}
            >
                {notifications.map((notification: INotification) => (
                    <NotificationCard
                        key={notification._id}
                        notification={notification}
                        onReadStatusChange={handleReadStatusChange}
                        onDelete={handleDelete}
                    />
                ))}
            </Grid>
        </Flex>
    );
}
