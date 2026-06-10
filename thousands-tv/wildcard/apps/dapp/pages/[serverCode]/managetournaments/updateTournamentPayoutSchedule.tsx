import {
    Box,
    Button,
    Card,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    NumberInput,
    NumberInputField,
    Text,
    VStack,
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

interface UpdatePayoutScheduleProps {
    serverCode: string;
    payoutScheduleId: string;
    name: string;
    initialEntries: { min: number; max: number; amount: number }[];
}

const UpdateTournamentPayoutSchedulePage = ({
    serverCode,
    payoutScheduleId,
    name: initialName,
    initialEntries,
}: UpdatePayoutScheduleProps) => {
    const [name, setName] = useState(initialName);
    const [entries, setEntries] = useState(
        initialEntries.length
            ? initialEntries
            : [{ min: 1, max: 1, amount: 0 }]
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const handleEntryChange = (
        index: number,
        field: "min" | "max" | "amount",
        value: number
    ) => {
        setEntries((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const handleAddRow = () => {
        setEntries((prev) => {
            const last = prev[prev.length - 1];
            const newMin = last ? last.max + 1 : 1;
            const newMax = newMin + 1;
            return [...prev, { min: newMin, max: newMax, amount: 0 }];
        });
    };

    const handleRemoveRow = (index: number) => {
        setEntries((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({
                status: "error",
                title: "Schedule name is required.",
            });
            return;
        }

        if (!entries.length) {
            toast({
                status: "error",
                title: "At least one entry is required.",
            });
            return;
        }

        const schedule = entries.map((entry) => ({
            range: [entry.min, entry.max],
            amountInCents: Math.round(entry.amount * 100),
        }));

        setIsSubmitting(true);
        try {
            await axios.put("/api/tournaments/payoutSchedules", {
                payoutScheduleId,
                payoutScheduleName: name.trim(),
                schedule,
            });
            toast({
                status: "success",
                title: "Payout schedule updated.",
            });
            const baseRoute = formatRouteConfigUrl(
                `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/tournamentPayoutSchedules`,
                { serverCode }
            );
            router.push(baseRoute);
        } catch (error: any) {
            console.error("Failed to update payout schedule", error);
            toast({
                status: "error",
                title: "Failed to update payout schedule.",
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
                            const payoutRoute = formatRouteConfigUrl(
                                `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/tournamentPayoutSchedules`,
                                { serverCode }
                            );
                            router.push(payoutRoute);
                        }}
                        mb={4}
                    >
                        <Text color="white">Back to Tournament Payouts</Text>
                    </Button>
                </Flex>
                <Card border="1px solid gray" p="20px" bg="glassDark.bg">
                    <Text fontSize="xl" fontWeight="bold" mb={4}>
                        Update Tournament Payout Schedule
                    </Text>
                    <Flex direction="column" gap={4}>
                        <FormControl>
                            <FormLabel color="whiteAlpha.800">
                                Schedule Name
                            </FormLabel>
                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                bg="rgba(255,255,255,0.05)"
                                color="white"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel color="whiteAlpha.800">
                                Schedule Entries
                            </FormLabel>
                            <VStack spacing={3} align="stretch">
                                {entries.map((entry, index) => (
                                    <HStack key={index} spacing={3}>
                                        <FormControl>
                                            <FormLabel
                                                color="whiteAlpha.600"
                                                fontSize="sm"
                                            >
                                                Min Rank
                                            </FormLabel>
                                            <NumberInput
                                                min={1}
                                                value={entry.min}
                                                onChange={(valueString) =>
                                                    handleEntryChange(
                                                        index,
                                                        "min",
                                                        parseInt(
                                                            valueString,
                                                            10
                                                        ) || 0
                                                    )
                                                }
                                            >
                                                <NumberInputField
                                                    bg="rgba(255,255,255,0.05)"
                                                    color="white"
                                                />
                                            </NumberInput>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel
                                                color="whiteAlpha.600"
                                                fontSize="sm"
                                            >
                                                Max Rank
                                            </FormLabel>
                                            <NumberInput
                                                min={entry.min}
                                                value={entry.max}
                                                onChange={(valueString) =>
                                                    handleEntryChange(
                                                        index,
                                                        "max",
                                                        parseInt(
                                                            valueString,
                                                            10
                                                        ) || 0
                                                    )
                                                }
                                            >
                                                <NumberInputField
                                                    bg="rgba(255,255,255,0.05)"
                                                    color="white"
                                                />
                                            </NumberInput>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel
                                                color="whiteAlpha.600"
                                                fontSize="sm"
                                            >
                                                Amount
                                            </FormLabel>
                                            <NumberInput
                                                min={0}
                                                step={0.01}
                                                precision={2}
                                                value={entry.amount}
                                                onChange={(valueString) =>
                                                    handleEntryChange(
                                                        index,
                                                        "amount",
                                                        parseFloat(
                                                            valueString
                                                        ) || 0
                                                    )
                                                }
                                            >
                                                <NumberInputField
                                                    bg="rgba(255,255,255,0.05)"
                                                    color="white"
                                                />
                                            </NumberInput>
                                        </FormControl>
                                        <IconButton
                                            aria-label="Remove entry"
                                            onClick={() =>
                                                handleRemoveRow(index)
                                            }
                                            icon={<Text>-</Text>}
                                            colorScheme="red"
                                            variant="outline"
                                            isDisabled={entries.length === 1}
                                        />
                                    </HStack>
                                ))}
                                <Button
                                    variant="outline"
                                    border="solid 1px gray"
                                    onClick={handleAddRow}
                                >
                                    <Text color="white">Add Entry</Text>
                                </Button>
                            </VStack>
                        </FormControl>

                        <Box>
                            <Button
                                colorScheme="purple"
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Flex>
                </Card>
            </Flex>
        </EventLayout>
    );
};

export default UpdateTournamentPayoutSchedulePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const authResult = await checkUserAuthorizedForPage(context);

    if (!authResult.success) {
        return authResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData = authResult.data as AuthorizedUserData;
    const serverCode = authorizedUserData.serverDoc?.serverCode || "";

    const { payoutScheduleId } = context.query;
    if (!payoutScheduleId || typeof payoutScheduleId !== "string") {
        const destination = formatRouteConfigUrl(
            `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/tournamentPayoutSchedules`,
            { serverCode }
        );
        return {
            redirect: { destination, permanent: false },
        };
    }

    const tournamentsRepository =
        diContainer.get<ITournamentsRepository>("ITournamentsRepository");

    const payoutSchedules = await tournamentsRepository.getTournamentPayoutSchedules();
    const schedule = payoutSchedules.find(
        (entry) => entry._id?.toString() === payoutScheduleId
    );

    if (!schedule) {
        const destination = formatRouteConfigUrl(
            `${WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url}/tournamentPayoutSchedules`,
            { serverCode }
        );
        return {
            redirect: { destination, permanent: false },
        };
    }

    return {
        props: {
            serverCode,
            payoutScheduleId,
            name: schedule.payoutScheduleName,
            initialEntries: (schedule.schedule || []).map((entry) => ({
                min: entry.range?.[0] ?? 1,
                max: entry.range?.[1] ?? 1,
                amount: (entry.amountInCents ?? 0) / 100,
            })),
        },
    };
};
