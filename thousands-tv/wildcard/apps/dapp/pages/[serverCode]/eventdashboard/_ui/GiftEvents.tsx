import { THEME_COLOR_DARK_GOLDEN_YELLOW } from "@/constants/constants";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { CheckCircleIcon } from "@chakra-ui/icons";
import {
    Flex,
    Box,
    Button,
    Text,
    Skeleton,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useToast,
    textDecoration,
} from "@chakra-ui/react";
import { IGiftEvent, WildcardApiResponse } from "@repo/interfaces";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useGlobalContext } from "@/contexts/globalContext";

const GiftEvents = () => {
    const [isRefreshLoading, setIsRefreshLoading] = useState<boolean>(false);
    const [isGiftEventsLoading, setIsGiftEventsLoading] =
        useState<boolean>(false);
    const [giftEvents, setGiftEvents] = useState<IGiftEvent[]>([]);
    const toast = useToast();
    const { setLoadingSpinner } = useGlobalContext();

    const fetchGiftEvents = async () => {
        setIsRefreshLoading(true);
        try {
            const { data }: { data: WildcardApiResponse } =
                await axiosAuthClientInstance.get(`/api/fetchGiftEvents`);

            setGiftEvents(data.data);
        } catch (error) {
            console.error("Failed to fetch gift events:", error);
        } finally {
            setIsRefreshLoading(false);
        }
    };

    const handleComplete = (giftEventId: string) => async () => {
        try {
            setLoadingSpinner(true);
            const body = { giftEventId };
            const { data }: { data: WildcardApiResponse } =
                await axiosAuthClientInstance.post(
                    `/api/completeGiftEvent`,
                    body
                );
            toast({
                title: "Successfully complete gift event",
                status: "success",
                duration: 3000,
                position: "top",
            });
            setGiftEvents(data.data);
        } catch (error) {
            console.error("Failed to complete gift event:", error);
            toast({
                title: "Failed to complete gift event",
                status: "error",
                duration: 3000,
                position: "top",
            });
        } finally {
            setLoadingSpinner(false);
        }
    };

    const renderGiftEvents = () => {
        if (isGiftEventsLoading) {
            return <Skeleton height="200px" />;
        }

        if (!giftEvents || giftEvents.length === 0) {
            return (
                <Text color="gray.500" textAlign={"center"}>
                    No vote history available
                </Text>
            );
        }

        return (
            <Table size="sm" variant="simple">
                <Thead>
                    <Tr>
                        <Th>Twitch Stream</Th>
                        <Th># of Subs</Th>
                        <Th>Action</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {giftEvents.map((giftEvent, index) => (
                        <Tr key={index}>
                            <Td>
                                <Link
                                    href={`https://twitch.tv/${giftEvent.platformUserName}`}
                                    target="_blank"
                                    style={{
                                        textDecoration: "underline",
                                        color: "lightskyblue",
                                    }}
                                >
                                    {giftEvent.platformUserName}
                                </Link>
                            </Td>
                            <Td>{giftEvent.numberOfSubs}</Td>
                            <Td>
                                {giftEvent.completedOn ? (
                                    <CheckCircleIcon
                                        color={"green"}
                                        fontSize={"2xl"}
                                    />
                                ) : (
                                    <Button
                                        onClick={handleComplete(
                                            giftEvent?._id!.toString()
                                        )}
                                    >
                                        Mark as Completed
                                    </Button>
                                )}
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        );
    };

    useEffect(() => {
        setIsGiftEventsLoading(true);
        fetchGiftEvents();
        setIsGiftEventsLoading(false);
    }, []);

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={5}
            shadow="md"
            width="100%"
            bgColor={"var(--chakra-colors-gray-700)"}
        >
            <Flex direction="row" gap={4} mb={4}>
                <Text fontSize="xl" fontWeight="bold" textAlign="left">
                    Gift Events
                </Text>
                <Button
                    onClick={fetchGiftEvents}
                    bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                    size="sm"
                    isLoading={isRefreshLoading}
                >
                    Refresh
                </Button>
            </Flex>
            {renderGiftEvents()}
        </Box>
    );
};

export default GiftEvents;
