import {
    Box,
    Button,
    Card,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Select,
    Text,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import EventLayout from "@/layouts/EventLayout";
import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { diContainer } from "@/inversify.config";
import ITournamentsRepository from "@/repositories/interfaces/ITournamentsRepository";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";

interface PayoutScheduleOption {
    id: string;
    name: string;
}

interface CreateTournamentProps {
    serverCode: string;
    payoutSchedules: PayoutScheduleOption[];
}

const CreateTournamentPage = ({
    serverCode,
    payoutSchedules,
}: CreateTournamentProps) => {
    const [tid, setTid] = useState("");
    const [payoutScheduleId, setPayoutScheduleId] = useState(
        payoutSchedules[0]?.id || ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!tid.trim()) {
            toast({
                status: "error",
                title: "Tournament ID is required.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post("/api/tournaments/manage", {
                tid: tid.trim(),
                payoutScheduleId: payoutScheduleId || undefined,
            });
            toast({
                status: "success",
                title: "Tournament created.",
            });
            const baseRoute = formatRouteConfigUrl(
                WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url,
                { serverCode }
            );
            router.push(baseRoute);
        } catch (error: any) {
            console.error("Failed to create tournament", error);
            toast({
                status: "error",
                title: "Failed to create tournament.",
                description:
                    error?.response?.data?.message ||
                    "Please try again later.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <EventLayout>
            <Flex direction="column" gap="10px" width="70%" pt="1rem">
                <OrganizerDashboardMenu serverCode={serverCode} />
                <Flex>
                    <Button
                        variant="outline"
                        border="solid 1px gray"
                        bg="glassDark.bg"
                        onClick={() => {
                            const baseRoute = formatRouteConfigUrl(
                                WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url,
                                { serverCode }
                            );
                            router.push(baseRoute);
                        }}
                        mb={4}
                    >
                        <Text color="white">Back to Tournaments</Text>
                    </Button>
                </Flex>
                <Card border="1px solid gray" p="20px" bg="glassDark.bg">
                    <Text fontSize="xl" fontWeight="bold" mb={4}>
                        Create Tournament
                    </Text>
                    <Flex direction="column" gap={4}>
                        <FormControl>
                            <FormLabel color="whiteAlpha.800">
                                Tournament ID
                            </FormLabel>
                            <Input
                                value={tid}
                                onChange={(event) =>
                                    setTid(event.target.value)
                                }
                                placeholder="Enter tournament identifier"
                                bg="rgba(255,255,255,0.05)"
                                color="white"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel color="whiteAlpha.800">
                                Payout Schedule
                            </FormLabel>
                            <Select
                                value={payoutScheduleId}
                                onChange={(event) =>
                                    setPayoutScheduleId(event.target.value)
                                }
                                bg="rgba(255,255,255,0.05)"
                                color="white"
                            >
                                {payoutSchedules.map((schedule) => (
                                    <option
                                        key={schedule.id}
                                        value={schedule.id}
                                        style={{ color: "black" }}
                                    >
                                        {schedule.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <Box>
                            <Button
                                colorScheme="purple"
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                            >
                                Save Tournament
                            </Button>
                        </Box>
                    </Flex>
                </Card>
            </Flex>
        </EventLayout>
    );
};

export default CreateTournamentPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const authResult = await checkUserAuthorizedForPage(context);

    if (!authResult.success) {
        return authResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData = authResult.data as AuthorizedUserData;
    const serverCode = authorizedUserData.serverDoc?.serverCode || "";

    const tournamentsRepository =
        diContainer.get<ITournamentsRepository>("ITournamentsRepository");

    const payoutSchedules = await tournamentsRepository.getTournamentPayoutSchedules();

    const payoutScheduleOptions: PayoutScheduleOption[] = payoutSchedules.map(
        (schedule) => ({
            id: schedule._id?.toString() || "",
            name: schedule.payoutScheduleName,
        })
    );

    return {
        props: {
            serverCode,
            payoutSchedules: payoutScheduleOptions,
        },
    };
};
