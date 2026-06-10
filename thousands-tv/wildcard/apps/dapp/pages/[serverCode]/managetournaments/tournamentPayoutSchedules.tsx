import {
    Box,
    Button,
    Card,
    Flex,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Text,
} from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import EventLayout from "@/layouts/EventLayout";
import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { diContainer } from "@/inversify.config";
import ITournamentsRepository from "@/repositories/interfaces/ITournamentsRepository";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";

interface TournamentPayoutSchedulesProps {
    serverCode: string;
    schedules: Array<{
        id: string;
        name: string;
        entriesCount: number;
    }>;
}

const TournamentPayoutSchedulesPage = ({
    serverCode,
    schedules,
}: TournamentPayoutSchedulesProps) => {
    const router = useRouter();

    const handleCreateClick = () => {
        const createRoute = formatRouteConfigUrl(
            `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/createTournamentPayoutSchedule`,
            { serverCode }
        );
        router.push(createRoute);
    };

    const handleRowClick = (scheduleId: string) => {
        const updateRoute = formatRouteConfigUrl(
            `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/updateTournamentPayoutSchedule`,
            { serverCode }
        );
        router.push(`${updateRoute}?payoutScheduleId=${scheduleId}`);
    };

    return (
        <EventLayout>
            <Flex direction="column" gap="10px" width="70%" pt="1rem">
                <Flex flexDirection="row" justify="space-between" mb={4}>
                    <OrganizerDashboardMenu serverCode={serverCode} />
                    <Button
                        variant="outline"
                        border="solid 1px gray"
                        bg="glassDark.bg"
                        onClick={handleCreateClick}
                    >
                        <Text color="white">Create Tournament Payout</Text>
                    </Button>
                </Flex>

                <Card border="1px solid gray" p="20px">
                    <Box overflowX="auto">
                        <Table variant="simple" size="md">
                            <Thead>
                                <Tr>
                                    <Th color="whiteAlpha.800">Name</Th>
                                    <Th color="whiteAlpha.800">
                                        Entries
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {schedules.map((schedule) => (
                                    <Tr
                                        key={schedule.id}
                                        _hover={{ bg: "whiteAlpha.100" }}
                                        cursor="pointer"
                                        onClick={() =>
                                            handleRowClick(schedule.id)
                                        }
                                    >
                                        <Td color="whiteAlpha.900">
                                            {schedule.name}
                                        </Td>
                                        <Td color="whiteAlpha.900">
                                            {schedule.entriesCount}
                                        </Td>
                                    </Tr>
                                ))}
                                {!schedules.length && (
                                    <Tr>
                                        <Td colSpan={2} textAlign="center">
                                            <Text color="whiteAlpha.700">
                                                No payout schedules found.
                                            </Text>
                                        </Td>
                                    </Tr>
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Card>
            </Flex>
        </EventLayout>
    );
};

export default TournamentPayoutSchedulesPage;

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

    const schedules = payoutSchedules.map((schedule) => ({
        id: schedule._id?.toString() || "",
        name: schedule.payoutScheduleName,
        entriesCount: schedule.schedule?.length || 0,
    }));

    return {
        props: {
            serverCode,
            schedules,
        },
    };
};
