import React, { useState, useEffect } from "react";
import { Box, Button, Text, useToast, Select, FormControl, FormLabel, Link, IconButton } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { WildcardApiResponse } from "@repo/interfaces";
import { getTransactionLink } from "@/utils/environmentUtil";
import { useUserBalances } from "@/hooks/useUserBalances";
import { useTotalPaidOut } from "@/hooks/useTotalPaidOut";

const StreamerPayoutComponent = () => {
    const [hoursWatched, setHoursWatched] = useState<number>(0);
    const [payoutAmount, setPayoutAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
    const [selectedWallet, setSelectedWallet] = useState<string>("");
    const { userDB } = useWildfileUserContext();
    const toast = useToast();

    const { userBalances, isLoadingBalances, fetchUserBalances, refreshBalances, clearBalances } = useUserBalances();
    const { totalPaidOut, isLoadingTotal, fetchTotalPaidOut, refreshTotal } = useTotalPaidOut();

    useEffect(() => {
        if (userDB?.twitchProvider?.name) {
            fetchStreamerStats();
            fetchTotalPaidOut();
        }

        if (userDB?.walletProvider?.address && !selectedWallet) {
            setSelectedWallet(userDB.walletProvider.address);
        }

        if (selectedWallet) {
            fetchUserBalances(selectedWallet);
        }
    }, [userDB, selectedWallet]);

    const fetchStreamerStats = async () => {
        try {
            setIsLoadingStats(true);
            const response = await axiosAuthClientInstance.get("/api/streamer-stats");

            if (response.data.success) {
                const unpaidHours = response.data.data.streamerStats
                    .filter((stat: any) => stat.isPaidOut !== true)
                    .reduce((sum: number, stat: any) => sum + stat.hoursWatched, 0);

                setHoursWatched(unpaidHours);
                setPayoutAmount(unpaidHours * 0.00617);
            }
        } catch (error) {
            console.error("Error fetching streamer stats:", error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handlePayout = async () => {
        try {
            setIsLoading(true);

            const response = await axiosAuthClientInstance.post("/api/create-payout", {
                recipientAddress: selectedWallet
            }); if (response.data.success) {
                const { payoutAmount, transactionHash } = response.data.data;

                if (transactionHash) {
                    const txLink = getTransactionLink(transactionHash);

                    toast({
                        title: "Payout Created Successfully",
                        description: (
                            <Box>
                                <Text mb={2}>Successfully created payout for ${payoutAmount.toFixed(3)} USDC</Text>
                                <Text fontSize="sm" color="gray.300" mb={1}>Transaction Hash:</Text>
                                <Text fontSize="xs" fontFamily="monospace" mb={2} wordBreak="break-all">
                                    {transactionHash}
                                </Text>
                                <Link href={txLink} isExternal color="blue.400" textDecoration="underline" fontSize="sm">
                                    View on Block Explorer →
                                </Link>
                                <Text fontSize="xs" color="gray.400" mt={1}>
                                    (Local testing: transaction may not be visible on public explorer)
                                </Text>
                            </Box>
                        ),
                        status: "success",
                        duration: 15000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: "Payout Created",
                        description: `Successfully created payout for $${payoutAmount.toFixed(3)} USDC`,
                        status: "success",
                        duration: 8000,
                        isClosable: true,
                    });
                }

                fetchStreamerStats();
                refreshTotal();
                refreshBalances();
            } else {
                throw new Error(response.data.err || "Failed to create payout");
            }
        } catch (error: any) {
            let errorMessage = "Failed to create payout";

            if (error.response?.data?.err) {
                errorMessage = error.response.data.err;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "Payout Failed",
                description: errorMessage,
                status: "error",
                duration: 8000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!userDB?.twitchProvider?.name) {
        return (
            <Box p={4} border="1px solid" borderRadius="md" borderColor="gray.600">
                <Text>Connect your Twitch account to view payout options</Text>
            </Box>
        );
    }

    if (!userDB?.walletProvider?.address) {
        return (
            <Box p={4} border="1px solid" borderRadius="md" borderColor="orange.600" bg="orange.900">
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                    Wallet Required for Payouts
                </Text>
                <Text mb={2}>
                    Channel: {userDB.twitchProvider.name}
                </Text>
                <Text color="orange.200">
                    You must connect a wallet to receive blockchain payouts through the Thousands Protocol.
                    Please link your wallet in the dashboard first.
                </Text>
            </Box>
        );
    }

    const availableWallets = [
        userDB.walletProvider.address,
        ...(userDB.walletProvider.additionalWallets || [])
    ];

    const formatWalletAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const formatBalance = (balance: string, symbol: string) => {
        const num = parseFloat(balance);
        if (num === 0) return "0";
        if (num < 0.0001) return "< 0.0001";
        if (num < 1) return num.toFixed(4);
        if (num < 1000) return num.toFixed(2);
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    return (
        <Box p={4} border="1px solid" borderRadius="md" borderColor="purple.600" bg="purple.900">
            <Text fontSize="lg" fontWeight="bold" mb={2}>
                Streamer Payout
            </Text>
            <Text mb={2}>
                Channel: {userDB.twitchProvider.name}
            </Text>

            <FormControl mb={4}>
                <FormLabel fontSize="sm" color="purple.200">
                    Payout Wallet Address
                </FormLabel>
                <Select
                    value={selectedWallet}
                    onChange={(e) => {
                        const newWallet = e.target.value;
                        setSelectedWallet(newWallet);
                        clearBalances();
                        if (newWallet) {
                            fetchUserBalances(newWallet);
                        }
                    }}
                    bg="purple.800"
                    borderColor="purple.600"
                    color="white"
                    fontSize="sm"
                >
                    {availableWallets.map((wallet, index) => (
                        <option key={wallet} value={wallet} style={{ backgroundColor: '#553C9A', color: 'white' }}>
                            {index === 0 ? 'Main Wallet: ' : 'Additional Wallet: '}{formatWalletAddress(wallet)}
                        </option>
                    ))}
                </Select>
            </FormControl>

            {isLoadingStats ? (
                <Text>Loading stats...</Text>
            ) : (
                <>
                    <Text mb={2}>
                        Unpaid Hours Watched: {hoursWatched.toFixed(2)}
                    </Text>
                    <Text mb={2}>
                        Total Paid Out: ${totalPaidOut.toFixed(3)} USDC
                    </Text>
                    <Text mb={4}>
                        Available Payout: ${payoutAmount.toFixed(3)} USDC
                    </Text>

                    {/* Wallet Balances Section */}
                    <Box mb={4} p={3} bg="purple.800" borderRadius="md" border="1px solid" borderColor="purple.600">
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Text fontSize="sm" fontWeight="bold" color="purple.200">
                                Selected Wallet Balances:
                            </Text>
                            <IconButton
                                aria-label="Refresh balances"
                                icon={<RepeatIcon />}
                                size="xs"
                                colorScheme="purple"
                                variant="ghost"
                                isLoading={isLoadingBalances}
                                onClick={() => refreshBalances()}
                            />
                        </Box>
                        {isLoadingBalances ? (
                            <Text fontSize="sm" color="gray.400">Loading balances...</Text>
                        ) : userBalances ? (
                            <Box>
                                {Object.entries(userBalances.balances).map(([contractAddress, balanceInfo]: [string, any]) => (
                                    <Text key={contractAddress} fontSize="sm" mb={1}>
                                        <Text as="span" fontWeight="semibold">
                                            {balanceInfo.symbol || 'Unknown'}:
                                        </Text>{" "}
                                        {formatBalance(balanceInfo.balance, balanceInfo.symbol)}
                                        {balanceInfo.symbol === 'USDC' && parseFloat(balanceInfo.balance) > 0 && (
                                            <Text as="span" color="green.400" ml={1}>✓</Text>
                                        )}
                                    </Text>
                                ))}
                            </Box>
                        ) : (
                            <Text fontSize="sm" color="gray.400">Unable to load balances</Text>
                        )}
                    </Box>

                    {hoursWatched > 0 ? (
                        <>
                            <Button
                                onClick={handlePayout}
                                isLoading={isLoading}
                                colorScheme="green"
                                isDisabled={payoutAmount === 0 || !selectedWallet}
                                mb={2}
                            >
                                Pay ${payoutAmount.toFixed(3)} USDC
                            </Button>
                        </>
                    ) : (
                        <Text color="gray.400">No hours available for payout</Text>
                    )}
                </>
            )}
        </Box>
    );
};

export default StreamerPayoutComponent;
