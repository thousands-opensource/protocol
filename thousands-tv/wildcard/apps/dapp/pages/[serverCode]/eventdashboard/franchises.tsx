import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";
import {
    Box,
    Button,
    Card,
    Flex,
    Grid,
    GridItem,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import EventLayout from "@/layouts/EventLayout";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { franchiseAssetsMap } from "@/constants/franchiseAssetsConfiguration";
import { FiCopy } from "react-icons/fi";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";

interface DashboardProps {
    serverCode: string;
}

function FranchisesDashboard({ serverCode }: DashboardProps) {
    const { onMessage } = useInfoNotifications();
    const [walletAddress, setWalletAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any | null>(null);
    const [kycSessionInfo, setKycSessionInfo] = useState<any | null>(null);
    const [kycSessionLoading, setKycSessionLoading] = useState(false);
    const [kycSessionError, setKycSessionError] = useState<string | null>(null);

    const handleLookup = async () => {
        if (!walletAddress.trim()) {
            setError("Please enter a wallet address.");
            setResult(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(
                "/api/franchises/lookupFranchiseByWallet",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        walletAddress: walletAddress.trim(),
                    }),
                }
            );
            const payload = await response.json();
            if (!payload?.success) {
                throw new Error(
                    payload?.err || "Failed to lookup franchise data."
                );
            }
            setResult(payload?.data ?? null);
        } catch (err: any) {
            console.error("Failed to lookup franchise data", err);
            setError(err?.message || "Failed to lookup franchise data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyWallet = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            onMessage({
                title: "Copied to Clipboard",
                description: address,
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Failed to copy wallet address", error);
            onMessage({
                title: "Copy Failed",
                description: "Unable to copy wallet address.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        const sessionId = result?.user?.kyc?.sessionId;
        if (!sessionId) {
            setKycSessionInfo(null);
            setKycSessionError(null);
            setKycSessionLoading(false);
            return;
        }

        let isMounted = true;
        const fetchSessionInfo = async () => {
            try {
                setKycSessionLoading(true);
                setKycSessionError(null);
                const response = await fetch(
                    "/api/stripe/getVerificationSession",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId }),
                    }
                );
                const payload = await response.json();
                if (!payload?.success) {
                    throw new Error(
                        payload?.err ||
                            "Failed to load Stripe verification session."
                    );
                }
                if (isMounted) {
                    setKycSessionInfo(payload?.data?.session ?? null);
                }
            } catch (err: any) {
                console.error("Failed to load Stripe session", err);
                if (isMounted) {
                    setKycSessionError(
                        err?.message ||
                            "Failed to load Stripe verification session."
                    );
                    setKycSessionInfo(null);
                }
            } finally {
                if (isMounted) {
                    setKycSessionLoading(false);
                }
            }
        };

        fetchSessionInfo();

        return () => {
            isMounted = false;
        };
    }, [result?.user?.kyc?.sessionId]);

    return (
        <EventLayout>
            <Flex flexDirection="column" gap="10px" width="70%" pt="1rem">
                <Flex flexDirection="row" justify="space-between">
                    <OrganizerDashboardMenu serverCode={serverCode} />
                    <Box justifyContent="flex-end" />
                </Flex>

                <div style={{ position: "relative" }}>
                    <Card border="1px gray solid" style={{ padding: "20px" }}>
                        <Stack spacing={4}>
                            <Text color="white" fontSize="lg" fontWeight="semibold">
                                Franchise Lookup
                            </Text>
                            <Flex gap={3} flexWrap="wrap">
                                <Input
                                    value={walletAddress}
                                    onChange={(event) =>
                                        setWalletAddress(event.target.value)
                                    }
                                    placeholder="Enter wallet address"
                                    bg="whiteAlpha.200"
                                    color="white"
                                    borderColor="whiteAlpha.300"
                                    _placeholder={{
                                        color: "whiteAlpha.600",
                                    }}
                                />
                                <Button
                                    onClick={handleLookup}
                                    isLoading={isLoading}
                                    variant="outline"
                                    border="solid 1px gray"
                                    bg="glassDark.bg"
                                >
                                    <Text color="white">Lookup</Text>
                                </Button>
                            </Flex>
                            {error && (
                                <Text color="red.300" fontSize="sm">
                                    {error}
                                </Text>
                            )}
                            {result && (
                                <Stack spacing={4}>
                                    <Box
                                        bg="blackAlpha.400"
                                        borderRadius="lg"
                                        p={4}
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                            mb={2}
                                        >
                                            KYC Status
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                        >
                                            Status:
                                        </Text>
                                        <Text
                                            fontSize="md"
                                            color="white"
                                            fontWeight="semibold"
                                            mb={3}
                                        >
                                            {result?.user?.kyc?.status ??
                                                "None"}
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                        >
                                            Session ID:
                                        </Text>
                                        <Flex
                                            align="center"
                                            justify="space-between"
                                            gap={2}
                                        >
                                            <Text
                                                fontSize="md"
                                                color="white"
                                                fontWeight="semibold"
                                            >
                                                {result?.user?.kyc?.sessionId ??
                                                    "None"}
                                            </Text>
                                            {result?.user?.kyc?.sessionId && (
                                                <Button
                                                    onClick={() =>
                                                        handleCopyWallet(
                                                            result?.user?.kyc
                                                                ?.sessionId
                                                        )
                                                    }
                                                    size="xs"
                                                    variant="ghost"
                                                    color="whiteAlpha.700"
                                                    _hover={{
                                                        color: "white",
                                                        bg: "whiteAlpha.200",
                                                    }}
                                                    aria-label="Copy session id"
                                                >
                                                    <FiCopy />
                                                </Button>
                                            )}
                                        </Flex>
                                        <Box
                                            mt={3}
                                            bg="whiteAlpha.100"
                                            borderRadius="md"
                                            p={3}
                                        >
                                            <Text
                                                fontSize="xs"
                                                color="whiteAlpha.700"
                                                mb={2}
                                            >
                                                Stripe Session
                                            </Text>
                                            {kycSessionLoading ? (
                                                <Text
                                                    fontSize="sm"
                                                    color="whiteAlpha.800"
                                                >
                                                    Loading Stripe session...
                                                </Text>
                                            ) : kycSessionError ? (
                                                <Text
                                                    fontSize="sm"
                                                    color="red.300"
                                                >
                                                    {kycSessionError}
                                                </Text>
                                            ) : kycSessionInfo ? (
                                                <pre
                                                    style={{
                                                        color: "white",
                                                        fontSize: "11px",
                                                        whiteSpace:
                                                            "pre-wrap",
                                                    }}
                                                >
                                                    {JSON.stringify(
                                                        kycSessionInfo,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            ) : (
                                                <Text
                                                    fontSize="sm"
                                                    color="whiteAlpha.700"
                                                >
                                                    No Stripe session data.
                                                </Text>
                                            )}
                                        </Box>
                                    </Box>
                                    <Grid
                                        templateColumns={{
                                            base: "1fr",
                                            md: "repeat(4, minmax(0, 1fr))",
                                        }}
                                        gap={3}
                                    >
                                        <Box
                                            bg="blackAlpha.400"
                                            borderRadius="lg"
                                            p={4}
                                        >
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.700"
                                                mb={2}
                                            >
                                                WC Total
                                            </Text>
                                            <Text
                                                fontSize="xl"
                                                color="white"
                                                fontWeight="semibold"
                                            >
                                                {Number(
                                                    result?.wcTotal ?? 0
                                                ).toLocaleString("en-US")}
                                            </Text>
                                        </Box>
                                        <Box
                                            bg="blackAlpha.400"
                                            borderRadius="lg"
                                            p={4}
                                        >
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.700"
                                                mb={2}
                                            >
                                                Franchise Balance
                                            </Text>
                                            <Text
                                                fontSize="xl"
                                                color="white"
                                                fontWeight="semibold"
                                            >
                                                {Number(
                                                    result?.franchise
                                                        ?.franchiseBalance ?? 0
                                                ).toLocaleString("en-US")}
                                            </Text>
                                        </Box>
                                        <Box
                                            bg="blackAlpha.400"
                                            borderRadius="lg"
                                            p={4}
                                        >
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.700"
                                                mb={2}
                                            >
                                                Ladder Index
                                            </Text>
                                            <Text
                                                fontSize="xl"
                                                color="white"
                                                fontWeight="semibold"
                                            >
                                                {result?.franchise?.ladderIndex ??
                                                    "None"}
                                            </Text>
                                        </Box>
                                        <Box
                                            bg="blackAlpha.400"
                                            borderRadius="lg"
                                            p={4}
                                        >
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.700"
                                                mb={2}
                                            >
                                                Rank
                                            </Text>
                                            <Text
                                                fontSize="xl"
                                                color="white"
                                                fontWeight="semibold"
                                            >
                                                {result?.franchise?.rank ??
                                                    "None"}
                                            </Text>
                                        </Box>
                                    </Grid>
                                    <Box
                                        bg="blackAlpha.400"
                                        borderRadius="lg"
                                        p={4}
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                            mb={3}
                                        >
                                            Wallet Addresses
                                        </Text>
                                        <Grid
                                            templateColumns={{
                                                base: "1fr",
                                                md: "1fr 1fr",
                                            }}
                                            gap={2}
                                        >
                                            {(result?.walletAddresses ??
                                                []).map(
                                                (
                                                    address: string,
                                                    index: number
                                                ) => (
                                                    <GridItem
                                                        key={`${address}-${index}`}
                                                        bg="whiteAlpha.100"
                                                        borderRadius="md"
                                                        p={2}
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        gap={2}
                                                    >
                                                        <Text
                                                            fontSize="sm"
                                                            color="white"
                                                        >
                                                            {address}
                                                        </Text>
                                                        <Button
                                                            onClick={() =>
                                                                handleCopyWallet(
                                                                    address
                                                                )
                                                            }
                                                            size="xs"
                                                            variant="ghost"
                                                            color="whiteAlpha.700"
                                                            _hover={{
                                                                color: "white",
                                                                bg: "whiteAlpha.200",
                                                            }}
                                                            aria-label="Copy wallet address"
                                                        >
                                                            <FiCopy />
                                                        </Button>
                                                    </GridItem>
                                                )
                                            )}
                                        </Grid>
                                    </Box>
                                    <Box
                                        bg="blackAlpha.400"
                                        borderRadius="lg"
                                        p={4}
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                            mb={3}
                                        >
                                            NFTs
                                        </Text>
                                        {Array.isArray(result?.nfts) &&
                                        result.nfts.length ? (
                                            <Grid
                                                templateColumns={{
                                                    base: "1fr",
                                                    md: "1fr 1fr",
                                                }}
                                                gap={2}
                                                maxH="260px"
                                                overflow="auto"
                                            >
                                                {result.nfts.map(
                                                    (
                                                        nft: {
                                                            nftAddress?: string;
                                                            tokenId?: string;
                                                            startDate?: string | null;
                                                            endDate?: string | null;
                                                        },
                                                        index: number
                                                    ) => (
                                                        (() => {
                                                            const contractAddress =
                                                                nft?.nftAddress?.toLowerCase() ??
                                                                "";
                                                            const tokenIdValue =
                                                                nft?.tokenId?.toString() ??
                                                                "";
                                                            const assetKey = `${contractAddress}-${tokenIdValue}`;
                                                            const asset =
                                                                franchiseAssetsMap[
                                                                    assetKey
                                                                ];
                                                            return (
                                                                <GridItem
                                                                    key={`${nft?.nftAddress}-${nft?.tokenId}-${index}`}
                                                                    bg="whiteAlpha.100"
                                                                    borderRadius="md"
                                                                    p={2}
                                                                >
                                                                    <Flex
                                                                        align="stretch"
                                                                        gap={3}
                                                                    >
                                                                        {asset?.image && (
                                                                            <Box
                                                                                w="56px"
                                                                                borderRadius="md"
                                                                                overflow="hidden"
                                                                                bg="whiteAlpha.200"
                                                                                flexShrink={0}
                                                                            >
                                                                                <Box
                                                                                    as="img"
                                                                                    src={asset.image}
                                                                                    alt={asset.label}
                                                                                    w="100%"
                                                                                    h="100%"
                                                                                    objectFit="cover"
                                                                                />
                                                                            </Box>
                                                                        )}
                                                                        <Box>
                                                                            <Text
                                                                                fontSize="sm"
                                                                                color="white"
                                                                                fontWeight="semibold"
                                                                            >
                                                                                {nft?.nftAddress ?? ""} #{nft?.tokenId ?? ""}
                                                                            </Text>
                                                                            {asset && (
                                                                                <Text
                                                                                    fontSize="xs"
                                                                                    color="whiteAlpha.800"
                                                                                >
                                                                                    {asset.label} · Rate {asset.rate}
                                                                                </Text>
                                                                            )}
                                                                            {asset?.expires && (
                                                                                <Text
                                                                                    fontSize="xs"
                                                                                    color="whiteAlpha.700"
                                                                                >
                                                                                    Expires:{" "}
                                                                                    {asset.expires.toLocaleDateString()}
                                                                                </Text>
                                                                            )}
                                                                            <Text
                                                                                fontSize="xs"
                                                                                color="whiteAlpha.700"
                                                                            >
                                                                                Start: {nft?.startDate ?? "null"}
                                                                            </Text>
                                                                            <Text
                                                                                fontSize="xs"
                                                                                color="whiteAlpha.700"
                                                                            >
                                                                                End: {nft?.endDate ?? "null"}
                                                                            </Text>
                                                                        </Box>
                                                                    </Flex>
                                                                </GridItem>
                                                            );
                                                        })()
                                                    )
                                                )}
                                            </Grid>
                                        ) : (
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.700"
                                            >
                                                No NFTs found.
                                            </Text>
                                        )}
                                    </Box>
                                    <Box
                                        bg="blackAlpha.400"
                                        borderRadius="lg"
                                        p={4}
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                            mb={3}
                                        >
                                            Sponsorships
                                        </Text>
                                        {Array.isArray(result?.sponsorships) &&
                                        result.sponsorships.length ? (
                                            <Grid
                                                templateColumns={{
                                                    base: "1fr",
                                                    md: "1fr 1fr",
                                                }}
                                                gap={2}
                                                maxH="260px"
                                                overflow="auto"
                                            >
                                                {result.sponsorships.map(
                                                    (item: any, index: number) => (
                                                        <GridItem
                                                            key={`${item?._id ?? "sponsorship"}-${index}`}
                                                            bg="whiteAlpha.100"
                                                            borderRadius="md"
                                                            p={2}
                                                        >
                                                            <pre
                                                                style={{
                                                                    color: "white",
                                                                    fontSize:
                                                                        "12px",
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                }}
                                                            >
                                                                {JSON.stringify(
                                                                    item,
                                                                    null,
                                                                    2
                                                                )}
                                                            </pre>
                                                        </GridItem>
                                                    )
                                                )}
                                            </Grid>
                                        ) : (
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.700"
                                            >
                                                No sponsorships found.
                                            </Text>
                                        )}
                                    </Box>
                                    <Box
                                        bg="blackAlpha.400"
                                        borderRadius="lg"
                                        p={4}
                                        maxH="420px"
                                        overflow="auto"
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                            mb={2}
                                        >
                                            User (Raw)
                                        </Text>
                                        <pre
                                            style={{
                                                color: "white",
                                                fontSize: "12px",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {JSON.stringify(
                                                result?.user ?? {},
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </Box>
                                    <Box
                                        bg="blackAlpha.400"
                                        borderRadius="lg"
                                        p={4}
                                        maxH="420px"
                                        overflow="auto"
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.700"
                                            mb={2}
                                        >
                                            Franchise (Raw)
                                        </Text>
                                        <pre
                                            style={{
                                                color: "white",
                                                fontSize: "12px",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {JSON.stringify(
                                                result?.franchise ?? {},
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    </Card>
                </div>
            </Flex>
        </EventLayout>
    );
}

export default FranchisesDashboard;

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
