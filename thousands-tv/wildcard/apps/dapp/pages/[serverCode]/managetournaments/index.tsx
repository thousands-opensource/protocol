import {
    Box,
    Button,
    Card,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Checkbox,
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
import { useState } from "react";
import EventLayout from "@/layouts/EventLayout";
import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { diContainer } from "@/inversify.config";
import ITournamentsRepository from "@/repositories/interfaces/ITournamentsRepository";

interface ManageTournamentsProps {
    serverCode: string;
    tournaments: SerializableTournamentOption[];
}

interface SerializableTournamentOption {
    id: string;
    tid: string;
    payoutScheduleName?: string | null;
}

const ManageTournaments = ({
    serverCode,
    tournaments,
}: ManageTournamentsProps) => {
    const router = useRouter();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isUsdPreviewOpen, setIsUsdPreviewOpen] = useState(false);
    const [cutoffDate, setCutoffDate] = useState("");
    const [usdCutoffDate, setUsdCutoffDate] = useState("");
    const [isPreviewMode, setIsPreviewMode] = useState(true);
    const [isUsdPreviewMode, setIsUsdPreviewMode] = useState(true);
    const [previewError, setPreviewError] = useState("");
    const [usdPreviewError, setUsdPreviewError] = useState("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isUsdPreviewLoading, setIsUsdPreviewLoading] = useState(false);

    const handleCreateClick = () => {
        const createRoute = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.CREATE.url,
            { serverCode }
        );
        router.push(createRoute);
    };

    const handleRowClick = (tournamentOptionId: string) => {
        if (!tournamentOptionId) {
            return;
        }
        const updateRoute = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.UPDATE.url,
            { serverCode }
        );
        router.push(`${updateRoute}?tournamentOptionId=${tournamentOptionId}`);
    };

    const handlePreviewPayout = async () => {
        setPreviewError("");
        const cutoff = cutoffDate ? new Date(cutoffDate) : null;
        if (!cutoff || Number.isNaN(cutoff.getTime())) {
            setPreviewError("Please select a valid cutoff date.");
            return;
        }

        try {
            setIsPreviewLoading(true);
            const response = await fetch(
                "/api/tournaments/previewUSDCPayout",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cutoffDate: cutoff.toISOString(),
                        preview: isPreviewMode,
                    }),
                }
            );

            if (!response.ok) {
                const contentType =
                    response.headers.get("content-type") || "";
                const message = contentType.includes("application/json")
                    ? (await response.json()).message
                    : await response.text();
                throw new Error(message || "Failed to download CSV.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeTimestamp = cutoff
                .toISOString()
                .replace(/[:.]/g, "-");
            link.href = url;
            link.download = `usdc-payout-preview-${safeTimestamp}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setIsPreviewOpen(false);
        } catch (error: any) {
            setPreviewError(
                error?.message || "Failed to download payout preview."
            );
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleUsdPreviewPayout = async () => {
        setUsdPreviewError("");
        const cutoff = usdCutoffDate ? new Date(usdCutoffDate) : null;
        if (!cutoff || Number.isNaN(cutoff.getTime())) {
            setUsdPreviewError("Please select a valid cutoff date.");
            return;
        }

        try {
            setIsUsdPreviewLoading(true);
            const response = await fetch(
                "/api/tournaments/previewUSDPayout",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cutoffDate: cutoff.toISOString(),
                        preview: isUsdPreviewMode,
                    }),
                }
            );

            if (!response.ok) {
                const contentType =
                    response.headers.get("content-type") || "";
                const message = contentType.includes("application/json")
                    ? (await response.json()).message
                    : await response.text();
                throw new Error(message || "Failed to download CSV.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeTimestamp = cutoff
                .toISOString()
                .replace(/[:.]/g, "-");
            link.href = url;
            link.download = `usd-payout-preview-${safeTimestamp}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setIsUsdPreviewOpen(false);
        } catch (error: any) {
            setUsdPreviewError(
                error?.message || "Failed to download payout preview."
            );
        } finally {
            setIsUsdPreviewLoading(false);
        }
    };

    return (
        <EventLayout>
            <Flex direction="column" gap="10px" width="70%" pt="1rem">
                <Flex flexDirection="row" justify="space-between" mb={4}>
                    <OrganizerDashboardMenu serverCode={serverCode} />
                    <Flex gap={3}>
                        <Button
                            variant="outline"
                            border="solid 1px gray"
                            bg="glassDark.bg"
                            onClick={() => {
                                const payoutRoute = formatRouteConfigUrl(
                                    `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/tournamentPayoutSchedules`,
                                    { serverCode }
                                );
                                router.push(payoutRoute);
                            }}
                        >
                            <Text color="white">Tournament Payouts</Text>
                        </Button>
                        <Button
                            variant="outline"
                            border="solid 1px gray"
                            bg="glassDark.bg"
                            onClick={() => {
                                setCutoffDate("");
                                setIsPreviewMode(true);
                                setPreviewError("");
                                setIsPreviewOpen(true);
                            }}
                        >
                            <Text color="white">USDC Payout</Text>
                        </Button>
                        <Button
                            variant="outline"
                            border="solid 1px gray"
                            bg="glassDark.bg"
                            onClick={() => {
                                setUsdCutoffDate("");
                                setIsUsdPreviewMode(true);
                                setUsdPreviewError("");
                                setIsUsdPreviewOpen(true);
                            }}
                        >
                            <Text color="white">USD Payout</Text>
                        </Button>
                        <Button
                            variant="outline"
                            border="solid 1px gray"
                            bg="glassDark.bg"
                            onClick={handleCreateClick}
                        >
                            <Text color="white">Create Tournament</Text>
                        </Button>
                    </Flex>
                </Flex>

                <Card border="1px solid gray" p="20px">
                    <Box overflowX="auto">
                        <Table variant="simple" size="md">
                            <Thead>
                                <Tr>
                                    <Th color="whiteAlpha.800">TID</Th>
                                    <Th color="whiteAlpha.800">
                                        Payout Schedule
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {tournaments.map((tournament) => (
                                    <Tr
                                        key={tournament.id}
                                        _hover={{ bg: "whiteAlpha.100" }}
                                        cursor="pointer"
                                        onClick={() =>
                                            handleRowClick(tournament.id)
                                        }
                                    >
                                        <Td color="whiteAlpha.900">
                                            {tournament.tid || "--"}
                                        </Td>
                                        <Td color="whiteAlpha.900">
                                            {tournament.payoutScheduleName ||
                                                "--"}
                                        </Td>
                                    </Tr>
                                ))}
                                {!tournaments.length && (
                                    <Tr>
                                        <Td colSpan={4} textAlign="center">
                                            <Text color="whiteAlpha.700">
                                                No tournaments found.
                                            </Text>
                                        </Td>
                                    </Tr>
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Card>
            </Flex>

            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                isCentered
            >
                <ModalOverlay />
                <ModalContent bg="gray.900" color="white">
                    <ModalHeader>Preview USDC Payout</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <FormLabel>Cutoff Date</FormLabel>
                            <Input
                                type="datetime-local"
                                value={cutoffDate}
                                onChange={(event) =>
                                    setCutoffDate(event.target.value)
                                }
                            />
                        </FormControl>
                        <Checkbox
                            mt={4}
                            isChecked={isPreviewMode}
                            onChange={(event) =>
                                setIsPreviewMode(event.target.checked)
                            }
                        >
                            Is Preview?
                        </Checkbox>
                        {previewError ? (
                            <Text mt={3} color="red.300">
                                {previewError}
                            </Text>
                        ) : null}
                    </ModalBody>
                    <ModalFooter gap={3}>
                        <Button
                            variant="ghost"
                            onClick={() => setIsPreviewOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handlePreviewPayout}
                            isLoading={isPreviewLoading}
                        >
                            Continue
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isUsdPreviewOpen}
                onClose={() => setIsUsdPreviewOpen(false)}
                isCentered
            >
                <ModalOverlay />
                <ModalContent bg="gray.900" color="white">
                    <ModalHeader>Preview USD Payout</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <FormLabel>Cutoff Date</FormLabel>
                            <Input
                                type="datetime-local"
                                value={usdCutoffDate}
                                onChange={(event) =>
                                    setUsdCutoffDate(event.target.value)
                                }
                            />
                        </FormControl>
                        <Checkbox
                            mt={4}
                            isChecked={isUsdPreviewMode}
                            onChange={(event) =>
                                setIsUsdPreviewMode(event.target.checked)
                            }
                        >
                            Is Preview?
                        </Checkbox>
                        {usdPreviewError ? (
                            <Text mt={3} color="red.300">
                                {usdPreviewError}
                            </Text>
                        ) : null}
                    </ModalBody>
                    <ModalFooter gap={3}>
                        <Button
                            variant="ghost"
                            onClick={() => setIsUsdPreviewOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleUsdPreviewPayout}
                            isLoading={isUsdPreviewLoading}
                        >
                            Continue
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </EventLayout>
    );
};

export default ManageTournaments;

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

    const tournamentOptions =
        await tournamentsRepository.getAllTournamentOptions();

    const tournamentsData: SerializableTournamentOption[] =
        tournamentOptions.map((option) => ({
            id: option._id?.toString() || "",
            tid: option.tid,
            payoutScheduleName:
                (option.payoutSchedule as any)?.payoutScheduleName || null,
        }));

    return {
        props: {
            serverCode,
            tournaments: tournamentsData,
        },
    };
};
