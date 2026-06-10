import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import {
    deleteNotification,
    updateNotificationReadStatus,
} from "@/utils/accountAPIUtil";
import {
    Icon,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    useDisclosure,
} from "@chakra-ui/react";
import { INotification } from "@repo/interfaces";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { GoRead, GoUnread } from "react-icons/go";
import { RiDeleteBin2Line } from "react-icons/ri";

interface IMenuItemProps {
    icon: JSX.Element;
    id: number;
    text: string;
    href?: string;
    onClick?: () => void;
}

interface NotificationCardMenuProps {
    notification: INotification;
    onReadStatusChange: (notificationId: string, isRead: boolean) => void;
    onDelete: (notificationId: string) => void;
    setIsRead: (isRead: boolean) => void;
    isRead: boolean;
}
/**
 * NotificationCardMenu component to display the menu options for a notification.
 */
const NotificationCardMenu = ({
    notification,
    onReadStatusChange,
    onDelete,
    setIsRead,
    isRead,
}: NotificationCardMenuProps) => {
    const notificationId: string = notification?._id?.toString() ?? "";
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { onMessage } = useInfoNotifications();

    const handleToggleReadStatus = async () => {
        const isReadOrUnread = isRead ? "read" : "unread";
        try {
            const updatedNotification = await updateNotificationReadStatus(
                notificationId,
                !isRead
            );
            setIsRead(updatedNotification.data.isRead);
            onReadStatusChange(notificationId, updatedNotification.data.isRead);

            onMessage({
                title: `Notification ${isReadOrUnread}`,
                description: `Notification has been marked as ${isReadOrUnread}`,
                status: "info",
            });
        } catch (error) {
            onMessage({
                title: "Error",
                description: `Failed to update notification read status`,
                status: "error",
            });
            console.error("Failed to update notification read status", error);
        }
    };

    const handleDeleteNotification = async () => {
        try {
            const updatedNotification = await deleteNotification(
                notificationId
            );
            onDelete(notificationId);

            if (updatedNotification.data.isDeleted) {
                onMessage({
                    title: "Notification Deleted",
                    description:
                        "Notification has been successfully marked as deleted",
                    status: "info",
                });
            }
        } catch (error) {
            onMessage({
                title: "Error",
                description: "Failed to delete notification",
                status: "error",
            });
            console.error("Failed to delete notification", error);
        }
    };

    const menuItems = [
        {
            icon: notification?.isRead ? <GoRead /> : <GoUnread />,
            id: 1,
            text: notification?.isRead ? "Mark as Unread" : "Mark as Read",
            onClick: handleToggleReadStatus,
        },
        {
            icon: <RiDeleteBin2Line />,
            text: "Delete",
            id: 5,
            onClick: onOpen,
        },
    ];

    const renderMenuItem = (item: IMenuItemProps) => {
        if (item.href) {
            return (
                <Link key={item.id} href={item.href}>
                    <MenuItem icon={item.icon}>{item.text}</MenuItem>
                </Link>
            );
        } else {
            return (
                <MenuItem key={item.id} icon={item.icon} onClick={item.onClick}>
                    {item.text}
                </MenuItem>
            );
        }
    };

    return (
        <>
            <Menu>
                <MenuButton>
                    <Icon as={BsThreeDotsVertical} boxSize="6" mx="4" />
                </MenuButton>
                <MenuList> {menuItems.map(renderMenuItem)}</MenuList>
            </Menu>
            <DeleteConfirmationModal
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={handleDeleteNotification}
                modalTitle="Delete Notification"
                itemToDeleteName={"this notification"}
            />
        </>
    );
};

export default NotificationCardMenu;
