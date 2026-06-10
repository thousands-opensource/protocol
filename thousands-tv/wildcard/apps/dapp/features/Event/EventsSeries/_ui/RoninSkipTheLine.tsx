import React, { useEffect, useState } from "react";
import { Flex, Button, Box, Text, useToast } from "@chakra-ui/react";
import { SiweMessage } from "siwe";
import axios from "axios";
import { WildcardApiResponse } from "@repo/interfaces";
import { checksumAddress } from "viem";

const RoninSkipTheLine: React.FC = () => {
    const [isRoninInstalled, setIsRoninInstalled] = useState<boolean>(false);
    const [isRoninConnected, setIsRoninConnected] = useState<boolean>(false);
    const [roninAddress, setRoninAddress] = useState<string>("");
    const [canSkipTheLine, setCanSkipTheLine] = useState<boolean | null>(null);

    useEffect(() => {
        const win = window as any;
        if (win.ronin) {
            setIsRoninInstalled(true);
        }
    }, [window]);

    async function connectRoninWallet() {
        const win = window as any;
        console.log("ronin", win.ronin);
        const provider = win.ronin.provider;
        const accounts = await provider.request({
            method: "eth_requestAccounts",
        });
        if (!accounts) {
            console.error("No Ronin accounts found");
            return;
        }

        const currentAccount = accounts[0];
        setIsRoninConnected(true);
        setRoninAddress(currentAccount);
    }

    async function verifySkipTheLine() {
        const win = window as any;
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        const nonce = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
        const checksumRoninAddress = checksumAddress(
            roninAddress as `0x${string}`
        );
        const siweMessage = new SiweMessage({
            domain: window.location.hostname,
            address: checksumRoninAddress,
            uri: window.location.origin,
            version: "1",
            chainId: 2020,
            nonce,
            statement: "Verify your ownership of Ronin wallet in Thousands!",
            expirationTime: currentDate.toISOString(),
        });

        const sig = await win.ronin.provider.request({
            method: "personal_sign",
            params: [siweMessage.toMessage(), roninAddress],
        });
        if (!sig) {
            console.log("No Ronin signature found");
            return;
        }

        const body = {
            message: JSON.stringify(siweMessage),
            signature: sig,
        };
        try {
            const resp = await axios.post("/api/verifyRoninSkipTheLine/", body);
            const data: WildcardApiResponse = resp.data;
            console.log("verifyRoninSkipTheLine data", data);
            if (!data.success) {
                console.error("Error verifying Ronin Skip The Line", data);
                return;
            }
            const { canSkip } = data.data;
            setCanSkipTheLine(canSkip);
        } catch (e) {
            const errMsg = `Unable to verify ronin skip the line: ${e}`;
            console.error(errMsg);
        }
    }

    function getRoninJsx() {
        if (!isRoninInstalled) {
            return (
                <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => {
                        window.open("https://wallet.roninchain.com/", "_blank");
                    }}
                >
                    Install Ronin Wallet
                </Button>
            );
        }
        if (!isRoninConnected) {
            return (
                <Button h="1.75rem" size="sm" onClick={connectRoninWallet}>
                    Connect
                </Button>
            );
        }

        return (
            <>
                <Box alignItems="center" mb={2}>
                    <Text fontSize="sm" mb={4} width={["auto", "auto", "45ch"]}>
                        Connected to {roninAddress}
                    </Text>
                    {canSkipTheLine !== null && (
                        <Text
                            fontSize="sm"
                            mb={4}
                            width={["auto", "auto", "45ch"]}
                        >
                            Can skip the line: {canSkipTheLine.toString()}
                        </Text>
                    )}
                    <Button h="1.75rem" size="sm" onClick={verifySkipTheLine}>
                        Skip the line
                    </Button>
                </Box>
                <Box mb={2}></Box>
                <Box mb={2}></Box>
            </>
        );
    }

    return (
        <Box p={4}>
            <Flex alignItems="center" mb={2}>
                <Text fontSize="sm" color="gray.400">
                    Connect a Ronin Wallet for FastPass entry into the event
                </Text>
            </Flex>
            <Flex alignItems="center" mb={2}>
                {getRoninJsx()}
            </Flex>
        </Box>
    );
};

export default RoninSkipTheLine;
