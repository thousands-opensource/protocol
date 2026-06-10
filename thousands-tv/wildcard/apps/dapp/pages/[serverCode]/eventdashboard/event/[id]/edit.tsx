import React, { useEffect, useState } from "react";
import { Button, Flex, Heading, Card, Link } from "@chakra-ui/react";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { GetServerSideProps } from "next";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import EventLayout from "@/layouts/EventLayout";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { findUsersByQuery } from "@repo/schemas";
import {
    EventCreationContent,
    EventCreationPayload,
    ISeries,
} from "@repo/interfaces";
import { EventForm } from "@/features/EventForm";
import { BEAMABLE_RULE_NAMES, updateRuleValue } from "@/utils/eventUtil";
import { toastDefaultOptions } from "@/constants/constants";
import { useRouter } from "next/router";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { checkUserAuthorizedForPage } from "../../../../../utils/profileUtil";
import { redirectIfNotLoggedIn } from "../../../../[...params]";
import { resolveServerCode } from "../../../../../utils/backend/accountsBackendUtil";
import IServerRepository from "@/repositories/interfaces/iServerRepository";
import { diContainer } from "@/inversify.config";

interface EventProps {
    eventId: string;
    usersStr: string;
    seriesStr: string;
}

function Edit({ eventId, usersStr, seriesStr }: EventProps) {
    const { onMessage } = useInfoNotifications();
    const usersFormatted = JSON.parse(usersStr);
    const [event, setEvent] = useState<EventCreationPayload | null>(null);
    const router = useRouter();
    const { serverCode } = router.query as { serverCode: string };
    const series: ISeries[] = JSON.parse(seriesStr);

    const formattedRouteUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.BASE.url,
        {
            serverCode,
        }
    );

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await axios.get(
                    `/api/beamable/event/get?objectId=${eventId}`
                );
                setEvent(response.data);
            } catch (error) {
                console.error("Error fetching event details:", error);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    const handleEventUpdate = async (formValues: EventCreationContent) => {
        console.log("handleEventUpdate started...");
        if (!event) return;

        const phases = event.content.phases;
        phases[0].duration_minutes = formValues.durationMinutes.toString();
        phases[0].name = formValues.name;
        updateRuleValue(
            BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE,
            formValues.phases[0].rules[0].value,
            phases[0].rules
        );
        updateRuleValue(
            BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_RULE,
            formValues.phases[0].rules[1].value,
            phases[0].rules
        );
        updateRuleValue(
            BEAMABLE_RULE_NAMES.DESCRIPTION_RULE,
            formValues.phases[0].rules[2].value,
            phases[0].rules
        );

        // Transforming the form values to the required payload structure
        console.log("formValues", formValues);

        // get the form values of what's changed and merge with the existing event
        const updatedEvent: EventCreationPayload = {
            content: {
                ...event.content,
                name: formValues.name,
                start_date: formValues.start_date,
                durationMinutes: formValues.durationMinutes,
                seriesId: formValues.seriesId,
                phases,
                imageUrl: formValues.imageUrl,
                billboardImageUrl: formValues.billboardImageUrl,
                serverCode,
                gameMode: formValues.gameMode,
                numberOfSkyboxes: formValues.numberOfSkyboxes,
            },
        };

        try {
            const response = await axios.post(
                "/api/beamable/update-content",
                updatedEvent
            );
            console.log("RESPONSE:::", response.data);

            if (!response.data) {
                onMessage({
                    title: "Error",
                    description: `Failed to update event`,
                    status: "error",
                });

                return;
            }

            onMessage({
                ...toastDefaultOptions,
                title: "Success",
                description: "Event successfully updated",
                status: "success",
            });
        } catch (err: any) {
            onMessage({
                ...toastDefaultOptions,
                title: "Error",
                description: `${
                    err.response.data.message || "An error occurred"
                }`,
                status: "error",
            });
        }
    };

    if (!event) {
        return <div>Loading...</div>;
    }

    return (
        <EventLayout>
            <Flex
                flexDirection={"row"}
                justifyContent={"center"}
                w={"70%"}
                pt={"2rem"}
            >
                <Card
                    w={"100%"}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    p={4}
                    mb={4}
                    shadow="md"
                    _hover={{ shadow: "xl" }}
                >
                    <Flex my="5px" flexDirection={"column"}>
                        <Link href={formattedRouteUrl}>
                            {/* Todo should go back to previous route */}
                            <Button
                                size="sm"
                                variant="link"
                                leftIcon={<FaChevronLeft />}
                                textTransform="uppercase"
                            >
                                Back to Events
                            </Button>
                        </Link>
                    </Flex>
                    <Flex m="5px" flexDirection={"column"}>
                        <Flex my="10px" mb="20px" pl={"20px"}>
                            <Heading size="md">Edit Event</Heading>
                        </Flex>
                        <EventForm
                            onSubmit={handleEventUpdate}
                            users={usersFormatted}
                            initialEvent={event}
                            eventId={eventId}
                            serverCode={serverCode}
                            series={series}
                        />
                    </Flex>
                </Card>
            </Flex>
        </EventLayout>
    );
}

export default Edit;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const eventId = context?.params?.id as string;
    const serverCode = resolveServerCode(context);

    // Authorize the user and check if they have the required role
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (!authorizedUserData) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const { userDB, wildcardAccessToken } = authorizedUserData;
    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    // get series for this server
    const serverRepository: IServerRepository =
        diContainer.get("IServerRepository");
    const server = await serverRepository.getServerFromCode(
        serverCode as string
    );
    if (!server) {
        return {
            props: {
                serverCode: "",
                userStr: JSON.stringify([]),
                seriesStr: JSON.stringify([]),
            },
        };
    }
    const series = server.series || [];

    const users = await findUsersByQuery({
        beamableProvider: {
            $exists: true,
            $ne: null,
        },
    });

    return {
        props: {
            eventId,
            usersStr: JSON.stringify(users),
            seriesStr: JSON.stringify(series),
        },
    };
};
