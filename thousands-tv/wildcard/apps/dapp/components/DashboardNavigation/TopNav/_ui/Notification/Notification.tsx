import { blurredBackgroundDark } from "@/theme/components/shared";
import { THEME_COLOR_COLOR_PRIMARY } from "@/theme/constants";
import { BellIcon } from "@chakra-ui/icons";
import {
    Button,
    Center,
    Icon,
    Link,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import NotificationPopoverCell from "./NotificationCell";
import { WILDFILE_ROUTES } from "@/constants/routes";
import {
    getNotifications,
    getUnreadNotificationsCount,
} from "@/utils/accountAPIUtil";
import { NotificationCounter } from "@/features/Notifications/NotificationCounter";
import { getUserDBSessionObj } from "@/utils/sessionUtil";
import { useSession } from "next-auth/react";
import { INotification } from "@repo/interfaces";
import { MINIMUM_NOTIFICATIONS_SHOWN } from "@/constants/constants";
import { THEME_COLOR_SECONDARY } from "@/constants";

interface NotificationProps {}

/**
 * Notification bell popover component. (Notification icon in the top navigation bar)
 */
export function NotificationBellPopover({}: NotificationProps) {
    const { onOpen, onClose, isOpen } = useDisclosure();
    const firstFieldRef = useRef(null);

    const { data: session } = useSession();
    const userDB = getUserDBSessionObj(session);

    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch user and notifications
    const userId = userDB?._id?.toString() ?? "";

    const fetchUnreadCount = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const count = await getUnreadNotificationsCount(userId);
            setUnreadCount(count);
        } catch (error) {
            setIsError(true);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (userId) {
            fetchUnreadCount();
        }
    }, [isOpen, userId]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const data = await getNotifications(
                userId,
                1,
                MINIMUM_NOTIFICATIONS_SHOWN
            );
            setNotifications(data.data);
        } catch (error) {
            setIsError(true);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const renderNotifications = (notifications: INotification[]) => {
        switch (true) {
            case isError:
                return (
                    <Text textAlign="center" color="red.400">
                        Error loading notifications.
                    </Text>
                );
            case isLoading:
                return <Text textAlign="center">Loading...</Text>;
            case notifications.length === 0:
                return (
                    <Text
                        textAlign="center"
                        fontSize="sm"
                        color={THEME_COLOR_SECONDARY}
                    >
                        No notifications found.
                    </Text>
                );
            default:
                return (
                    <>
                        {notifications.map((notification) => (
                            <NotificationPopoverCell
                                key={notification._id}
                                notification={notification}
                                onClose={onClose}
                            />
                        ))}
                        <Center px="4">
                            <Link
                                _hover={{
                                    bg: "blackAlpha.700",
                                    _before: {
                                        content: '""',
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: "4px",
                                        bg: THEME_COLOR_SECONDARY,
                                    },
                                }}
                                href={
                                    WILDFILE_ROUTES.SERVER.NOTIFICATIONS.BASE
                                        .url
                                }
                                color={THEME_COLOR_COLOR_PRIMARY}
                            >
                                View All
                            </Link>
                        </Center>
                    </>
                );
        }
    };

    return (
        <Popover
            isOpen={isOpen}
            initialFocusRef={firstFieldRef}
            onOpen={onOpen}
            onClose={onClose}
        >
            <PopoverTrigger>
                <Button variant="unstyled" mt={1}>
                    <Icon
                        as={BellIcon}
                        _hover={{ color: "gray.300" }}
                        boxSize={{
                            base: 6,
                            lg: 8,
                        }}
                    />
                    <NotificationCounter count={unreadCount} />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                p="0"
                bg="blackAlpha.900"
                maxW="200px"
                mr="40px"
                px="0"
                border={"1px solid"}
                borderColor={"whiteAlpha.500"}
                borderRadius="lg"
            >
                <PopoverArrow />
                <PopoverHeader
                    px={{
                        base: 4,
                        lg: 6,
                    }}
                    py="4"
                    justifyContent="start"
                    display="flex"
                >
                    Notifications
                </PopoverHeader>
                <PopoverBody>{renderNotifications(notifications)}</PopoverBody>
            </PopoverContent>
        </Popover>
    );
}
