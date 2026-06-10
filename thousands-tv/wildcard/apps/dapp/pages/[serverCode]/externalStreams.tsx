import { Box, Card, Flex, Text, Divider, useToast } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import EventLayout from "@/layouts/EventLayout";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";
import GiftEvents from "./eventdashboard/_ui/GiftEvents";
import { useGlobalContext } from "@/contexts/globalContext";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import {
    IExternalStream,
    IGiftEvent,
    WildcardApiResponse,
} from "@repo/interfaces";
import PlatformStream from "./eventdashboard/_ui/PlatformStream";
import StreamerList from "@/components/StreamerList";

interface ExternalStreamsProps {
    serverCode: string;
}

/**
 * Thousands external streams page
 */
function ExternalStreams({ serverCode }: ExternalStreamsProps) {
    const [externalStreams, setExternalStreams] = useState<IExternalStream[]>(
        []
    );
    const toast = useToast();

    const fetchExternalStreams = async () => {
        try {
            const { data }: { data: WildcardApiResponse } =
                await axiosAuthClientInstance.get(`/api/fetchExternalStreams`);

            setExternalStreams(data.data);
        } catch (error) {
            console.error("Failed to fetch gift events:", error);
        }
    };
    useEffect(() => {
        fetchExternalStreams();
    }, []);

    return (
        <EventLayout>
            <Flex flexDirection={"column"} gap="10px" width="70%" pt={"1rem"}>
                <Flex flexDirection="row" justify="space-between">
                    <OrganizerDashboardMenu serverCode={serverCode} />
                </Flex>

                <div style={{ position: "relative" }}>
                    <Card
                        border="1px gray solid"
                        style={{ padding: "20px", marginBottom: "20px" }}
                    >
                        <StreamerList />
                    </Card>
                </div>

                <div style={{ position: "relative" }}>
                    <Card border="1px gray solid" style={{ padding: "20px" }}>
                        <Text fontSize="xl" mb="4" color="white">
                            External Streams
                        </Text>
                        <Text color="gray.400" mb="6">
                            Active streams from Twitch, Discord, Kick, and other
                            platforms
                        </Text>

                        <Flex flexDirection="column" gap="4">
                            <Card p="4" bg="gray.800" border="1px solid gray">
                                <Text fontSize="lg" mb="2" color="white">
                                    🟢 Twitch Streams
                                </Text>
                                <PlatformStream
                                    platform={"twitch"}
                                    externalStreams={externalStreams}
                                />
                            </Card>

                            <Card p="4" bg="gray.800" border="1px solid gray">
                                <Text fontSize="lg" mb="2" color="white">
                                    🟢 Discord Streams
                                </Text>
                                <PlatformStream
                                    platform={"discord"}
                                    externalStreams={externalStreams}
                                />
                            </Card>

                            <Card p="4" bg="gray.800" border="1px solid gray">
                                <Text fontSize="lg" mb="2" color="white">
                                    🟢 Kick Streams
                                </Text>
                                <PlatformStream
                                    platform={"kick"}
                                    externalStreams={externalStreams}
                                />
                            </Card>

                            <Card p="4" bg="gray.800" border="1px solid gray">
                                <Text fontSize="lg" mb="2" color="white">
                                    🟢 Other Platforms
                                </Text>
                                <Text color="gray.400" fontSize="sm">
                                    No active streams from other platforms found
                                </Text>
                            </Card>
                        </Flex>
                    </Card>
                </div>

                <Divider />
                <GiftEvents />
            </Flex>
        </EventLayout>
    );
}

export default ExternalStreams;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

    if (!userAuthorizedForPageResult.success) {
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;

    const serverCode = authorizedUserData.serverDoc?.serverCode;

    return {
        props: {
            serverCode,
        },
    };
};
