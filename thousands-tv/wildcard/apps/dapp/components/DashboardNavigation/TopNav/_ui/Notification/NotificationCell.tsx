import { WILDFILE_ROUTES } from "@/constants/routes";
import { Divider, Flex, HStack, Stack, Tag, Text } from "@chakra-ui/react";
import { INotification } from "@repo/interfaces";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { FC } from "react";

interface INotificationCellProps {
    notification: INotification;
    onClose: () => void;
}

/**
 * Notification cell component for the notification popover.
 */
const NotificationPopoverCell: FC<INotificationCellProps> = ({
    notification,
    onClose,
}) => {
    const router = useRouter();

    return (
        <>
            <Flex
                transition="all 0.2s ease-in-out"
                _hover={{ bg: "glass.hover", opacity: 0.9 }}
                cursor="pointer"
                onClick={() => {
                    router.push(WILDFILE_ROUTES.SERVER.NOTIFICATIONS.BASE.url);
                    onClose();
                }}
                p={4}
            >
                <Stack w="full">
                    <HStack justify="end">
                        {notification.createdAt &&
                        !isNaN(new Date(notification.createdAt).valueOf()) ? (
                            <Tag fontSize="sm">
                                {formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    {
                                        addSuffix: true,
                                        includeSeconds: true,
                                    }
                                )}
                            </Tag>
                        ) : null}
                    </HStack>

                    <Text fontSize="md" noOfLines={3} fontWeight="medium">
                        {notification.subject}
                    </Text>
                </Stack>
            </Flex>
            <Divider />
        </>
    );
};
export default NotificationPopoverCell;
