import { Box, Button, Card, Flex, Input, Text, Textarea, useToast } from "@chakra-ui/react";
import { useState } from "react";
import { GetServerSideProps } from "next";
import EventLayout from "@/layouts/EventLayout";
import { useSession } from "next-auth/react";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";

function CreditAdjustments() {
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);
    const [adjustments, setAdjustments] = useState<any[]>([]);
    const toast = useToast();

    const handleLookup = async () => {
        try {
            const balanceRes = await axiosAuthClientInstance.get(
                `/api/credits/getBalance/?userId=${userId}`
            );
            const balanceData = await balanceRes.data.data;

            if (balanceData.userId && (balanceData.balance === 0 || !!balanceData.balance)) {
                setCurrentBalance(balanceData.balance);
            }

            const adjustmentsRes = await axiosAuthClientInstance.get(
                `/api/credits/getAdjustments?userId=${userId}`
            );
            const adjustmentsData = await adjustmentsRes.data.data;
            setAdjustments(adjustmentsData || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch user data",
                status: "error"
            });
        }
    };

    const handleAdjustment = async () => {
        if (!reason) {
            toast({
                title: "Error",
                description: "Reason is required",
                status: "error"
            });
            return;
        }

        const res = await fetch("/api/credits/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                amount: parseFloat(amount),
                reason
            })
        });

        const data = await res.json();
        if (data.success) {
            toast({
                title: "Success",
                description: "Credit balance adjusted",
                status: "success"
            });
            handleLookup();
        }
    };

    return (
        <EventLayout>
            <Flex flexDirection="column" gap="4" width="70%" pt="4">
                <Card p="6">
                    <Text fontSize="xl" mb="4">Credit Balance Adjustment</Text>

                    <Flex gap="4" mb="4">
                        <Input
                            placeholder="User ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                        <Button onClick={handleLookup}>Look Up</Button>
                    </Flex>

                    {currentBalance !== null && (
                        <Box mb="4">
                            <Text>Current Balance: {currentBalance}</Text>

                            <Input
                                mt="4"
                                placeholder="Adjustment Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />

                            <Textarea
                                mt="4"
                                placeholder="Reason for adjustment (required)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />

                            <Button
                                mt="4"
                                colorScheme="blue"
                                onClick={handleAdjustment}
                                isDisabled={!amount || !reason}
                            >
                                Submit Adjustment
                            </Button>
                        </Box>
                    )}
                </Card>

                {adjustments.length > 0 && (
                    <Card p="6">
                        <Text fontSize="xl" mb="4">Adjustment History</Text>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Date</Th>
                                    <Th>Amount</Th>
                                    <Th>Reason</Th>
                                    <Th>Adjusted By</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {adjustments.map((adjustment) => (
                                    <Tr key={adjustment._id}>
                                        <Td>
                                            {formatDistanceToNow(
                                                new Date(adjustment.createdAt),
                                                { addSuffix: true }
                                            )}
                                        </Td>
                                        <Td color={adjustment.amount >= 0 ? "green.500" : "red.500"}>
                                            {adjustment.amount > 0 ? "+" : ""}{adjustment.amount}
                                        </Td>
                                        <Td>{adjustment.adjustmentReason}</Td>
                                        <Td>{adjustment.adjustedBy}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Card>
                )}
            </Flex>
        </EventLayout>
    );
}

export default CreditAdjustments;

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