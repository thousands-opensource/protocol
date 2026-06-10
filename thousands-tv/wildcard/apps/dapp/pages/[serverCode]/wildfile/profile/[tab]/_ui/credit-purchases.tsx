import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    Box,
    Card,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Center,
    Text,
    useBreakpointValue,
    Flex,
    Stack,
    Divider,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    Heading,
    Spacer,
} from "@chakra-ui/react";
import PanelDescription from "./advanced-settings/_ui/panel-description";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import {
    CreditTransactionType,
    IUserEventBoostSummary,
} from "@repo/interfaces";

export interface CreditTransaction {
    _id: string;
    createdAt: string;
    transactionId: string;
    status: string;
    amount: number;
    creditType?: CreditTransactionType | null;
}

export const CreditPurchases = () => {
    return (
        <Flex flexDirection={"column"} gap={4} p={4}>
            <CreditPurchasesTable />
            <PanelDescription title="Credits Spent">
                <BoostSummaries />
            </PanelDescription>
        </Flex>
    );
};

const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

interface CreditPurchasesTableProps {
    hide?: boolean;
}
export const CreditPurchasesTable = ({
    hide = false,
}: CreditPurchasesTableProps) => {
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const isMobile = useBreakpointValue({ base: true, md: true, lg: false });

    const creditPurchases = useMemo(() => {
        // Filter all transactions by "credit" or "null" result in credit purchase from credit system
        return transactions.filter(
            (txn) =>
                !txn.creditType ||
                txn.creditType === CreditTransactionType.CREDIT
        );
    }, [transactions]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axiosAuthClientInstance.get(
                    "/api/credits/getCreditTransactions"
                );
                setTransactions(response.data.creditTransactions);
            } catch (err: any) {
                setError(err.message || "Failed to load transactions");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const renderMobileCard = (tx: CreditTransaction) => (
        <Card
            fontWeight={400}
            key={tx._id}
            borderRadius="lg"
            bg="unset"
            p={4}
            mb={4}
            border="1px solid gray"
        >
            <Stack fontSize={"xs"} spacing={3}>
                <Flex justify="space-between">
                    <Text color="gray.500">Date</Text>
                    <Text>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                    <Text color="gray.500">ID</Text>
                    <Text>{tx.transactionId}</Text>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                    <Text color="gray.500">Status</Text>
                    <Text>{formatStatus(tx.status)}</Text>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                    <Text color="gray.500">Amount</Text>
                    <Flex align="center" gap={1}>
                        <Text fontWeight="bold">{tx.amount}</Text>
                        <Image
                            src="/images/Credits/coin.webp"
                            alt="Credits"
                            width={14}
                            height={14}
                        />
                    </Flex>
                </Flex>
            </Stack>
        </Card>
    );

    const renderDesktopTable = () => (
        <Table
            variant="simple"
            sx={{
                "tr:last-of-type td": {
                    borderBottom: "none",
                },
            }}
            fontSize={"md"}
        >
            <Thead>
                <Tr>
                    <Th>Date</Th>
                    <Th>ID</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Amount</Th>
                </Tr>
            </Thead>
            <Tbody>
                {creditPurchases.map((tx) => (
                    <Tr key={tx._id}>
                        <Td>{new Date(tx.createdAt).toLocaleDateString()}</Td>
                        <Td>{tx.transactionId}</Td>
                        <Td>{formatStatus(tx.status)}</Td>
                        <Td isNumeric>
                            <Flex justify="flex-end" align="center" gap={1}>
                                {tx.amount}
                                <Image
                                    src="/images/Credits/coin.webp"
                                    alt="Credits"
                                    width={14}
                                    height={14}
                                />
                            </Flex>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );

    const renderCard = () => (
        <Card
            borderRadius="lg"
            p={2}
            mt={4}
            bg="unset"
            border={creditPurchases.length === 0 ? "none" : "1px solid gray"}
        >
            {loading ? (
                <Center py={6}>
                    <Spinner />
                </Center>
            ) : error ? (
                <Center py={6}>
                    <Text color="red.500">{error}</Text>
                </Center>
            ) : creditPurchases.length === 0 ? (
                <Center py={6}>
                    <Text color="gray.500">No transactions found</Text>
                </Center>
            ) : (
                renderDesktopTable()
            )}
        </Card>
    );

    return isMobile ? (
        <Accordion allowToggle>
            <AccordionItem border="none">
                <AccordionButton px={0} _hover={{ bg: "transparent" }}>
                    {hide ? null : (
                        <>
                            <Heading fontSize="xl">Credit Purchases</Heading>
                            <Spacer />
                            <AccordionIcon />
                        </>
                    )}
                </AccordionButton>
                <AccordionPanel px={0}>
                    {loading ? (
                        <Center py={6}>
                            <Spinner />
                        </Center>
                    ) : error ? (
                        <Center py={6}>
                            <Text color="red.500">{error}</Text>
                        </Center>
                    ) : creditPurchases.length === 0 ? (
                        <Center py={6}>
                            <Text color="gray.500">No transactions found</Text>
                        </Center>
                    ) : (
                        <Stack spacing={4}>
                            {creditPurchases.map(renderMobileCard)}
                        </Stack>
                    )}
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    ) : hide ? (
        <> {renderCard()}</>
    ) : (
        <PanelDescription title="Credit Purchases">
            {renderCard()}
        </PanelDescription>
    );
};

export const BoostSummaries = () => {
    const [eventBoostSummaries, setEventBoostSummaries] = useState<
        IUserEventBoostSummary[]
    >([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchEventBoostSummaries = async () => {
            try {
                const response = await axiosAuthClientInstance.get(
                    "/api/credits/getBoostSegments"
                );
                setEventBoostSummaries(response.data.eventBoostSummaries);
            } catch (err: any) {
                setError(err.message || "Failed to load boost segments");
            } finally {
                setLoading(false);
            }
        };

        fetchEventBoostSummaries();
    }, []);

    const renderEventCard = (summary: IUserEventBoostSummary) => (
        <Stack fontWeight={400} key={summary.eventName} spacing={2}>
            <Text fontSize={"md"} px={1}>
                {summary.eventName}
            </Text>
            <Card borderRadius="lg" bg="unset" p={4} border="1px solid gray">
                <Table
                    variant="simple"
                    size="sm"
                    sx={{
                        "tr:last-of-type td": {
                            borderBottom: "none",
                        },
                        td: {
                            px: { base: 0, lg: 4 },
                        },
                    }}
                >
                    <Tbody>
                        {summary.rounds.map((round, idx) => (
                            <Tr key={idx}>
                                <Td>Round {round.round}</Td>
                                <Td isNumeric>
                                    <Flex
                                        justify="flex-end"
                                        align="center"
                                        gap={1}
                                    >
                                        {round.creditsSpent}
                                        <Image
                                            src="/images/Credits/coin.webp"
                                            alt="Credits"
                                            width={14}
                                            height={14}
                                        />
                                    </Flex>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
        </Stack>
    );
    return (
        <>
            {loading ? (
                <Center py={6}>
                    <Spinner />
                </Center>
            ) : error ? (
                <Center py={6}>
                    <Text color="red.500">{error}</Text>
                </Center>
            ) : eventBoostSummaries.length === 0 ? (
                <Center py={6}>
                    <Text color="gray.500">No credits spent</Text>
                </Center>
            ) : (
                <Stack spacing={4} pt={4}>
                    {eventBoostSummaries.map(renderEventCard)}
                </Stack>
            )}
        </>
    );
};

export default CreditPurchases;
