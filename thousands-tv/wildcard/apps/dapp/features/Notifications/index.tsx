import { NotificationCardStates } from "@/features/Notifications/_ui/NotificationCardStates";
import { getNotifications } from "@/utils/accountAPIUtil";
import {
    Center,
    Spinner,
    Grid,
    Card,
    Skeleton,
    Box,
    Container,
    Flex,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import {
    parentContainerSx,
    parentFlexSx,
} from "../Wildfile/WildFileProfile/styles";
import WildfileNavigation from "../Wildfile/WildFileProfile/WildfileNavigation";
import DashboardTopLayout from "@/components/DashboardTopLayout";
import DashboardTitle from "@/components/Dashboard/DashboardTitle";
import { IUser } from "@repo/interfaces";
import { INotificationResponses } from "@/types";

interface NotificationsProps {
    userDB: IUser | null;
}
/**
 * Notification Component that fetches the notifications for the user in a card format
 */
function Notifications({ userDB }: NotificationsProps) {
    const [notificationsResponses, setNotifications] =
        useState<INotificationResponses>();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // Fetch user
    const userId = userDB?._id?.toString() ?? "";

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await getNotifications(userId, page, limit);
            setNotifications(data);
            setIsLoading(false);
        } catch (err) {
            setError("Failed to fetch notifications");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId, page, limit]);

    if (!userDB) {
        return null;
    }

    return (
        <Container centerContent sx={parentContainerSx}>
            <Flex sx={parentFlexSx}>
                <WildfileNavigation
                    avatarThemeColor={{
                        colorName: "blue",
                        hexValue: "#3182ce",
                    }}
                />
                <DashboardTopLayout
                    leftChildren={
                        <DashboardTitle>Notifications</DashboardTitle>
                    }
                />

                <Flex
                    w="100%"
                    marginBottom="20"
                    p="10px"
                    justifyContent={"center"}
                >
                    {isLoading ? (
                        <>
                            <Center minH="80dvh">
                                <Spinner />
                            </Center>
                            <Grid
                                display={{
                                    base: "grid",
                                    md: "none",
                                }}
                                gap={{
                                    md: "10",
                                    base: "5",
                                }}
                                templateColumns={{
                                    base: "repeat(1, 1fr)",
                                }}
                            >
                                {new Array(5).fill("").map((item, index) => (
                                    <Card
                                        _hover={{ bg: "whiteAlpha.300" }}
                                        bg={"whiteAlpha.100"}
                                        border={"none"}
                                        borderTop={"8px"}
                                        key="index"
                                        p="0"
                                        h={{
                                            base: "340px",
                                            md: "153px",
                                            lg: "172px",
                                        }}
                                    >
                                        <Skeleton
                                            key={index}
                                            h="full"
                                            w="full"
                                        />
                                    </Card>
                                ))}
                            </Grid>
                        </>
                    ) : (
                        <NotificationCardStates
                            notificationLength={
                                notificationsResponses?.data?.length || 0
                            }
                            pages={[notificationsResponses]}
                        />
                    )}

                    <Box mt="4">
                        {isFetchingNextPage && (
                            <Center>
                                <Spinner />
                            </Center>
                        )}
                    </Box>
                </Flex>
            </Flex>
        </Container>
    );
}

export default Notifications;
