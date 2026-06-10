import React, { useState } from "react";
import { Button, Flex, Card, Heading, useToast } from "@chakra-ui/react";
import axios from "axios";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { API_BEAMABLE_ROUTES, WILDFILE_ROUTES } from "@/constants/routes";
import { EventCreateFormProps, EventForm } from "@/features/EventForm";
import { GetServerSideProps } from "next";
import { findUsersByQuery } from "@repo/schemas";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import EventLayout from "@/layouts/EventLayout";
import connectToDb from "@/db/connectToDb";
import { toastDefaultOptions } from "@/constants/constants";
import {
    IUser,
    EventCreationContent,
    EventCreationPayload,
    Rule,
    ISeries,
} from "@repo/interfaces";
import { BEAMABLE_RULE_NAMES } from "@/utils/eventUtil";
import { resolveServerCode } from "../../../../utils/backend/accountsBackendUtil";
import { formatRouteConfigUrl } from "../../../../utils/routeUtil";
import IServerRepository from "@/repositories/interfaces/iServerRepository";
import { diContainer } from "@/inversify.config";

interface EventsProps {
    serverCode: string;
    usersStr: string;
    seriesStr: string;
}

export const EventCreateForm: React.FC<EventCreateFormProps> = (props) => (
    <EventForm {...props} />
);

function Events({ serverCode, usersStr, seriesStr }: EventsProps) {
    const usersFormatted = JSON.parse(usersStr);
    const series: ISeries[] = JSON.parse(seriesStr);
    const [users, setUsers] = useState<IUser[]>(usersFormatted);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const toast = useToast();

    const handleCreateSubmit = async (formValues: EventCreationContent) => {
        console.log("handleCreateSubmit started...", formValues);
        const startDate = new Date(formValues.start_date);

        const phaseRules: Rule[] = [
            {
                rule: BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE,
                value: formValues.phases[0].rules[0].value,
            },
            {
                rule: BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_RULE,
                value: formValues.phases[0].rules[1].value,
            },
            {
                rule: BEAMABLE_RULE_NAMES.DESCRIPTION_RULE,
                value: formValues.phases[0].rules[2].value,
            },
        ];

        //    Transforming the form values to the required payload structure
        const eventPayload: EventCreationPayload = {
            content: {
                serverCode: formValues.serverCode,
                name: formValues.name,
                seriesId: formValues.seriesId,
                symbol: "events.WildcardPlaytest", // Generate or define the symbol value
                start_date: startDate.toISOString(),
                phases: [
                    {
                        name: formValues.name,
                        duration_minutes: formValues.durationMinutes.toString(), // 1 week
                        durationSeconds: 0,
                        durationMillis: 0,
                        rules: phaseRules,
                    },
                    // Add more phases as needed, based on your form structure or predefined logic
                ],
                partition_size: "5",
                permissions: {
                    write_self: true, // or derive from form values if dynamic
                },
                score_rewards: [],
                rank_rewards: [],
                group_rewards: {
                    scoreRewards: [],
                },
                type: "Immediately",
                recurring: null,
                cohortSettings: {
                    cohorts: [],
                },
                imageUrl: formValues.imageUrl,
                durationMinutes: formValues.durationMinutes,
                billboardImageUrl: formValues.billboardImageUrl,
                gameMode: formValues.gameMode,
                numberOfSkyboxes: formValues.numberOfSkyboxes,
            },
        };

        console.log("eventPayload -", eventPayload);

        try {
            const response = await axios.post(
                API_BEAMABLE_ROUTES.APPLY_CONTENT,
                eventPayload
            );

            if (!response.data.success) {
                toast({
                    ...toastDefaultOptions,
                    title: "Error",
                    description: `Failed to create event`,
                    status: "error",
                    duration: 7000,
                });

                return;
            }
            setIsSubmitted(true); // Update the submission status

            toast({
                ...toastDefaultOptions,
                title: "Success",
                description: "Event successfully created",
                status: "success",
                duration: 7000,
            });
        } catch (err: any) {
            toast({
                ...toastDefaultOptions,
                title: "Error",
                description: `${
                    err.response.data.message || "An error occurred"
                }`,
                status: "error",
                duration: 7000,
            });
        }
    };

    const formattedEventDashboardRouteUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.BASE.url,
        { serverCode }
    );

    return (
        <EventLayout>
            <Flex
                flexDirection={"column"}
                gap="10px"
                w="70%"
                flexGrow={1}
                pt={"2rem"}
                justifyContent={"center"}
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
                        <Link href={formattedEventDashboardRouteUrl}>
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
                            <Heading size="md">Create Event</Heading>
                        </Flex>

                        <EventForm
                            onSubmit={handleCreateSubmit}
                            isSubmitted={isSubmitted}
                            users={users}
                            serverCode={serverCode}
                            series={series}
                        />
                    </Flex>
                </Card>
            </Flex>
        </EventLayout>
    );
}

export default Events;

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        await connectToDb();

        const serverCode = resolveServerCode(context);

        // Authorize the user and check if they have the required role
        const authorizedUserData: AuthorizedUserData | null =
            await authorizeUser(context);

        if (!authorizedUserData) {
            return {
                redirect: {
                    destination: "/login",
                    permanent: false,
                },
            };
        }

        const {
            userDB,
            connectedUserDBProviderId,
            connectedUserDBEmail,
            wildcardAccessToken,
        } = authorizedUserData;
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

        // const query = { roles: { $in: ["organizer"] } };
        const users = await findUsersByQuery({
            beamableProvider: {
                $exists: true,
                $ne: null,
            },
        });

        return {
            props: {
                serverCode,
                usersStr: JSON.stringify(users),
                seriesStr: JSON.stringify(series),
            },
        };
    } catch (e: any) {
        console.error("Error fetching backend info for creating event");
        return {
            props: {
                serverCode: "",
                userStr: JSON.stringify([]),
                seriesStr: JSON.stringify([]),
            },
        };
    }
};
