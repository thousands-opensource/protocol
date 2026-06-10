import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import connectToDb from "@/db/connectToDb";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import {
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    Heading,
    HStack,
    Stack,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { FiArrowLeft } from "react-icons/fi";
import { IUser, KycStatus } from "@repo/interfaces";
import { diContainer } from "@/inversify.config";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import IFranchiseOffersRepository from "@/repositories/interfaces/IFranchiseOffersRepository";
import useLoadingWithRouter from "@/hooks/loadingStateManagement/useLoadingWithRouter";
import {
    getFranchiseAssetMarketplaceUrl,
    getFranchiseOfferAcceptOrRejectUrl,
} from "@/utils/environmentUtilWCA";
import { LADDER_INDEX_LABELS } from "@/constants/ladderIndexes";
import { franchiseAssetsMap } from "@/constants/franchiseAssetsConfiguration";

interface FranchiseDetailProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    franchiseUser?: IUser;
    offerRank: number;
    serverCode: string;
    userNftsStr: string;
    ladderIndex: number;
    franchiseOffersStr: string;
    franchiseBalance: number | null;
}

declare global {
    interface Window {
        Stripe?: any;
    }
}

const STRIPE_JS_URL = "https://js.stripe.com/v3/";
const STRIPE_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const KYC_BUTTON_GRADIENT = "linear-gradient(135deg, #C084FC, #7C3AED)";
const OFFER_EPOCH_NFT_CONTRACT =
    "0x523edfb68d10c046dcc41a43e210f52a29e8c0d4";

const maskAddress = (address?: string) => {
    if (!address) return "Not linked";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const normalizeKycStatus = (status?: string | null) =>
    status?.toString().toLowerCase() ?? "";

const FranchiseDetailPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    franchiseUser,
    offerRank,
    serverCode,
    userNftsStr,
    ladderIndex,
    franchiseOffersStr,
    franchiseBalance,
}: FranchiseDetailProps) => {
    const router = useRouter();
    const { startLoading } = useLoadingWithRouter();
    const routeUserIdParam = router.query?.userId;
    const routeUserId = Array.isArray(routeUserIdParam)
        ? routeUserIdParam[0]
        : routeUserIdParam;

    const userDB = userDBStr
        ? (JSON.parse(userDBStr) as IUser & {
              kyc?: { status?: string | null };
          })
        : null;
    const [userDBState, setUserDBState] = useState(userDB);
    const isCurrentUserFranchise =
        !!userDB?._id &&
        !!routeUserId &&
        userDB._id.toString().toLowerCase() === routeUserId.toLowerCase();
    const [kycCompleted, setKycCompleted] = useState(false);
    const [kycLoading, setKycLoading] = useState(false);
    const [kycError, setKycError] = useState<string | null>(null);
    const kycRefreshAttemptsRef = useRef(0);
    const kycPollTimeoutRef = useRef<number | null>(null);
    const kycPollIntervalRef = useRef<number | null>(null);
    const stripeInstanceRef = useRef<any | null>(null);
    const stripeScriptPromiseRef = useRef<Promise<void> | null>(null);
    const [autoAcceptLoading, setAutoAcceptLoading] = useState<
        "accept" | "decline" | null
    >(null);

    const panelBg = useColorModeValue(
        "rgba(255,255,255,0.75)",
        "rgba(255,255,255,0.14)"
    );
    const panelBorder = useColorModeValue(
        "rgba(255,255,255,0.55)",
        "rgba(255,255,255,0.25)"
    );
    const franchiseAssetMarketplaceUrl = getFranchiseAssetMarketplaceUrl();
    const franchiseOfferAcceptOrRejectUrl =
        getFranchiseOfferAcceptOrRejectUrl();

    const glassProps = {
        bg: panelBg,
        border: "1px solid",
        borderColor: panelBorder,
        borderRadius: "2xl",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        p: { base: 6, md: 8 },
    };

    const kycHeadingColor = useColorModeValue("gray.900", "whiteAlpha.900");
    const kycDescriptionColor = useColorModeValue("gray.600", "whiteAlpha.700");
    const kycStatus = normalizeKycStatus(userDBState?.kyc?.status);
    const isKycPending =
        !!kycStatus &&
        kycStatus !== "notstarted" &&
        kycStatus !== "completed" &&
        kycStatus !== "failed";
    const shouldShowKycPanel =
        isCurrentUserFranchise &&
        kycStatus !== "completed" &&
        kycStatus !== "failed";
    const autoAcceptSelection =
        userDBState?.autoAcceptOffers === false ? "decline" : "accept";

    useEffect(() => {
        if (normalizeKycStatus(userDBState?.kyc?.status) === "completed") {
            setKycCompleted(true);
        }
    }, [userDBState]);

    useEffect(() => {
        const status = normalizeKycStatus(userDBState?.kyc?.status);
        const sessionId = userDBState?.kyc?.sessionId;

        if (!sessionId || status === "completed" || status === "failed") {
            return;
        }

        let isMounted = true;
        const refreshKycStatus = async () => {
            try {
                const response = await fetch(
                    "/api/stripe/verification-session",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    }
                );
                const payload = await response.json();
                if (!payload?.success) {
                    return;
                }
                const refreshedStatus = normalizeKycStatus(
                    payload?.data?.status
                );
                if (!isMounted) {
                    return;
                }
                if (refreshedStatus === "completed") {
                    setKycCompleted(true);
                    setUserDBState((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  kyc: {
                                      ...(prev.kyc ?? {}),
                                      status: KycStatus.COMPLETED,
                                  },
                              }
                            : prev
                    );
                } else if (refreshedStatus === "failed") {
                    setKycCompleted(false);
                    setKycError(
                        "Verification failed - please contact support."
                    );
                }
            } catch (error) {
                console.error(
                    "[FranchiseDetail] Failed to refresh KYC status",
                    error
                );
            }
        };

        refreshKycStatus();

        return () => {
            isMounted = false;
        };
    }, [userDBState?.kyc?.sessionId, userDBState?.kyc?.status]);

    const refreshUserDb = useCallback(async () => {
        const walletAddress = userDBState?.walletProvider?.address;
        if (!walletAddress) {
            return;
        }

        try {
            const response = await fetch(
                `/api/fetchUser?walletAddress=${encodeURIComponent(
                    walletAddress
                )}`
            );
            const payload = await response.json();
            if (payload?.success && payload?.data) {
                setUserDBState((prev) => {
                    if (!prev) {
                        return payload.data;
                    }
                    const nextKyc =
                        payload?.data?.kyc ?? prev.kyc;
                    return {
                        ...payload.data,
                        kyc: nextKyc,
                    };
                });
            }
        } catch (error) {
            console.error(
                "[FranchiseDetail] Failed to refresh user",
                error
            );
        }
    }, [userDBState?.walletProvider?.address]);

    useEffect(() => {
        if (!kycCompleted || kycStatus === "completed") {
            return;
        }

        let isMounted = true;
        const attemptRefresh = async () => {
            if (!isMounted) {
                return;
            }
            if (kycRefreshAttemptsRef.current >= 5) {
                return;
            }
            kycRefreshAttemptsRef.current += 1;
            await refreshUserDb();
            if (
                isMounted &&
                normalizeKycStatus(userDBState?.kyc?.status) !== "completed"
            ) {
                window.setTimeout(attemptRefresh, 1500);
            }
        };

        attemptRefresh();

        return () => {
            isMounted = false;
        };
    }, [kycCompleted, kycStatus, refreshUserDb, userDBState?.kyc?.status]);

    const handleAutoAcceptToggle = useCallback(
        async (nextValue: "accept" | "decline") => {
            if (!isCurrentUserFranchise || autoAcceptLoading) {
                return;
            }
            setAutoAcceptLoading(nextValue);
            try {
                const response = await fetch(
                    "/api/franchises/setAutoAcceptOffers",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            autoAcceptOffers: nextValue === "accept",
                        }),
                    }
                );
                const payload = await response.json();
                if (!payload?.success) {
                    throw new Error(
                        payload?.err || "Failed to update auto-accept offers"
                    );
                }
                setUserDBState((prev) =>
                    prev
                        ? {
                              ...prev,
                              autoAcceptOffers: nextValue === "accept",
                          }
                        : prev
                );
            } catch (error) {
                console.error(
                    "[FranchiseDetail] Failed to update auto-accept offers",
                    error
                );
            } finally {
                setAutoAcceptLoading(null);
            }
        },
        [isCurrentUserFranchise]
    );

    useEffect(() => {
        return () => {
            if (kycPollTimeoutRef.current) {
                window.clearTimeout(kycPollTimeoutRef.current);
            }
            if (kycPollIntervalRef.current) {
                window.clearInterval(kycPollIntervalRef.current);
            }
        };
    }, []);

    const ensureStripeLoaded = useCallback(async () => {
        if (!STRIPE_PUBLISHABLE_KEY) {
            throw new Error("Stripe publishable key is not configured");
        }

        if (stripeInstanceRef.current) {
            return stripeInstanceRef.current;
        }

        if (typeof window === "undefined") {
            throw new Error("Stripe is only available in the browser");
        }

        if (!window.Stripe) {
            if (!stripeScriptPromiseRef.current) {
                stripeScriptPromiseRef.current = new Promise<void>(
                    (resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = STRIPE_JS_URL;
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () =>
                            reject(new Error("Failed to load Stripe.js"));
                        document.body.appendChild(script);
                    }
                );
            }

            await stripeScriptPromiseRef.current;
        }

        if (!window.Stripe) {
            throw new Error("Stripe.js failed to initialize");
        }

        stripeInstanceRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        return stripeInstanceRef.current;
    }, []);

    const handleCompleteKyc = useCallback(async () => {
        if (kycCompleted || kycLoading) {
            return;
        }

        setKycError(null);
        setKycLoading(true);

        try {
            const response = await fetch("/api/stripe/verification-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const payload = await response.json();

            if (!payload?.success) {
                throw new Error(
                    payload?.err || "Failed to create verification session"
                );
            }

            const { sessionId, clientSecret, status } = payload?.data || {};

            if (normalizeKycStatus(status) === "completed") {
                setKycCompleted(true);
                setUserDBState((prev) =>
                    prev
                        ? {
                              ...prev,
                              kyc: {
                                  ...(prev.kyc ?? {}),
                                  status: KycStatus.COMPLETED,
                              },
                          }
                        : prev
                );
                return;
            } else if (normalizeKycStatus(status) === "failed") {
                setKycCompleted(false);
                setKycError("Verification Failed - Please contact support.");
                return;
            }

            if (!clientSecret) {
                throw new Error("Missing verification authorization");
            }

            const stripe = await ensureStripeLoaded();

            if (!stripe) {
                throw new Error("Verification failed to initialize");
            }

            let verificationResult: any;

            if (stripe.identity?.verifySession) {
                verificationResult = await stripe.identity.verifySession(
                    sessionId,
                    {
                        clientSecret,
                    }
                );
            } else if (stripe.verifyIdentity) {
                verificationResult = await stripe.verifyIdentity(clientSecret);
            } else {
                throw new Error("Identity Verification is not available");
            }

            if (verificationResult?.error) {
                throw new Error(verificationResult.error.message);
            }

            if (kycPollTimeoutRef.current) {
                window.clearTimeout(kycPollTimeoutRef.current);
            }
            if (kycPollIntervalRef.current) {
                window.clearInterval(kycPollIntervalRef.current);
            }

            kycPollTimeoutRef.current = window.setTimeout(() => {
                let remainingAttempts = 2;

                const checkStatus = async () => {
                    try {
                        const response = await fetch(
                            "/api/stripe/verification-session",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                            }
                        );
                        const payload = await response.json();
                        if (payload?.success) {
                            const refreshedStatus = normalizeKycStatus(
                                payload?.data?.status
                            );
                            if (refreshedStatus === "completed") {
                                setKycCompleted(true);
                                setUserDBState((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              kyc: {
                                                  ...(prev.kyc ?? {}),
                                                  status: KycStatus.COMPLETED,
                                              },
                                          }
                                        : prev
                                );
                                if (kycPollIntervalRef.current) {
                                    window.clearInterval(
                                        kycPollIntervalRef.current
                                    );
                                }
                                return;
                            }
                            if (refreshedStatus === "failed") {
                                setKycCompleted(false);
                                setKycError(
                                    "Verification failed - please contact support."
                                );
                                if (kycPollIntervalRef.current) {
                                    window.clearInterval(
                                        kycPollIntervalRef.current
                                    );
                                }
                                return;
                            }
                        }
                    } catch (error) {
                        console.error(
                            "[FranchiseDetail] Failed to refresh KYC status",
                            error
                        );
                    }
                };

                void checkStatus();
                kycPollIntervalRef.current = window.setInterval(() => {
                    if (remainingAttempts <= 0) {
                        if (kycPollIntervalRef.current) {
                            window.clearInterval(kycPollIntervalRef.current);
                        }
                        return;
                    }
                    remainingAttempts -= 1;
                    void checkStatus();
                }, 5000);
            }, 2000);

        } catch (error: any) {
            console.error(
                "[FranchiseDetail] verification failed",
                error
            );
            setKycError(error?.message || "Verification failed to start");
        } finally {
            await refreshUserDb();
            setKycLoading(false);
        }
    }, [ensureStripeLoaded, kycCompleted, kycLoading, refreshUserDb]);

    const franchiseBalanceDisplay =
        franchiseBalance !== null && Number.isFinite(franchiseBalance)
            ? franchiseBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
              })
            : "0";
    const draftPicksEarned = Number(userDBState?.draftPicksEarned ?? 0);
    const draftPicksConsumed = Number(userDBState?.draftPicksConsumed ?? 0);
    const draftPicksBalance =
        (Number.isFinite(draftPicksEarned) ? draftPicksEarned : 0) -
        (Number.isFinite(draftPicksConsumed) ? draftPicksConsumed : 0);
    const parsedUserNfts = useMemo(() => {
        if (!userNftsStr) {
            return [];
        }

        try {
            const payload = JSON.parse(userNftsStr) as {
                nfts?: {
                    nftAddress?: string;
                    tokenId?: string;
                    startDate?: string | null;
                    endDate?: string | null;
                }[];
            };
            return payload?.nfts ?? [];
        } catch (error) {
            console.error("Failed to parse user NFTs payload", error);
            return [];
        }
    }, [userNftsStr]);

    const parsedFranchiseOffers = useMemo(() => {
        if (!franchiseOffersStr) {
            return [];
        }

        try {
            const payload = JSON.parse(franchiseOffersStr) as {
                offers?: {
                    id: string;
                    epoch?: number;
                    offerAmount?: number;
                    createdAt?: string | null;
                }[];
            };
            return payload?.offers ?? [];
        } catch (error) {
            console.error("Failed to parse franchise offers payload", error);
            return [];
        }
    }, [franchiseOffersStr]);

    const offerDecisionByEpoch = useMemo(() => {
        if (!parsedUserNfts.length || !parsedFranchiseOffers.length) {
            return new Map<number, "Promotion" | "Relegation">();
        }
        const decisionByEpoch = new Map<number, "Promotion" | "Relegation">();

        const filteredNfts = parsedUserNfts
            .filter((nft) => {
                const contractAddress = nft?.nftAddress?.toString().trim();
                return (
                    contractAddress?.toLowerCase() ===
                    OFFER_EPOCH_NFT_CONTRACT
                );
            })
            .sort((a, b) => {
                const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
                const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
                if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
                if (Number.isNaN(aTime)) return 1;
                if (Number.isNaN(bTime)) return -1;
                return aTime - bTime;
            });

        const sortedOffers = [...parsedFranchiseOffers].sort((a, b) => {
            const aEpoch = Number.isFinite(a.epoch) ? a.epoch ?? 0 : 0;
            const bEpoch = Number.isFinite(b.epoch) ? b.epoch ?? 0 : 0;
            return aEpoch - bEpoch;
        });

        const pairCount = Math.min(filteredNfts.length, sortedOffers.length);
        for (let i = 0; i < pairCount; i += 1) {
            const nft = filteredNfts[i];
            const offer = sortedOffers[i];
            const epoch = offer?.epoch;
            if (epoch === undefined || epoch === null) {
                continue;
            }
            const tokenIdRaw = nft?.tokenId?.toString().trim();
            if (!tokenIdRaw) {
                continue;
            }
            let tokenNumber: bigint;
            try {
                tokenNumber = tokenIdRaw.startsWith("0x")
                    ? BigInt(tokenIdRaw)
                    : BigInt(tokenIdRaw);
            } catch {
                continue;
            }
            const correctedDecision =
                tokenNumber === BigInt(6)
                    ? "Relegation"
                    : tokenNumber === BigInt(7)
                    ? "Promotion"
                    : null;
            decisionByEpoch.set(
                epoch,
                correctedDecision ??
                    (tokenNumber % BigInt(2) === BigInt(0)
                        ? "Promotion"
                        : "Relegation")
            );
        }

        return decisionByEpoch;
    }, [parsedUserNfts, parsedFranchiseOffers]);

    const wildpassMap: Record<number, { label: string; image: string }> = {
        1: { label: "Azure", image: "/images/wildpasses/wildpassazure.png" },
        2: { label: "Gold", image: "/images/wildpasses/wildpassgold.png" },
        3: { label: "Scarlet", image: "/images/wildpasses/wildpassscarlet.png" },
        4: { label: "Violet", image: "/images/wildpasses/wildpassviolet.png" },
        5: { label: "Amber", image: "/images/wildpasses/wildpassamber.png" },
        6: { label: "Emerald", image: "/images/wildpasses/wildpassemerald.png" },
        7: {
            label: "Alabaster",
            image: "/images/wildpasses/wildpassalabaster.png",
        },
        8: { label: "Blush", image: "/images/wildpasses/wildpassblush.png" },
    };

    const wildpasses = useMemo(() => {
        const nfts = parsedUserNfts;
        const counts = new Map<number, number>();

        for (const nft of nfts) {
            const contractAddress = nft?.nftAddress?.toString().trim();
            //Only process Wildpass NFTs
            if (!contractAddress || contractAddress.toLowerCase() !== "0xd8cb3f39875def5853b155c0adf2530644397428") {
                continue;
            }
            const tokenIdRaw = nft?.tokenId?.toString().trim();
            if (!tokenIdRaw) {
                continue;
            }
            let tokenNumber: bigint;
            try {
                tokenNumber = tokenIdRaw.startsWith("0x")
                    ? BigInt(tokenIdRaw)
                    : BigInt(tokenIdRaw);
            } catch {
                continue;
            }

            const modValue = Number(tokenNumber % BigInt(8)) || 8;
            if (!wildpassMap[modValue]) {
                continue;
            }
            counts.set(modValue, (counts.get(modValue) ?? 0) + 1);
        }

        const baseRows = Array.from(counts.entries()).map(
            ([key, quantity]) => ({
                id: `wildpass-${key}`,
                label: wildpassMap[key].label,
                image: wildpassMap[key].image,
                quantity,
            })
        );

        const fullSpectrumQuantity = Object.keys(wildpassMap).every((key) =>
            counts.has(Number(key))
        )
            ? Math.min(
                  ...Object.keys(wildpassMap).map(
                      (key) => counts.get(Number(key)) ?? 0
                  )
              )
            : 0;

        if (fullSpectrumQuantity > 0) {
            return [
                {
                    id: "wildpass-full-spectrum",
                    label: "Full Spectrum",
                    image: "/images/wildpasses/wildpassfullspectrum.png",
                    quantity: fullSpectrumQuantity,
                },
                ...baseRows,
            ];
        }

        return baseRows;
    }, [parsedUserNfts]);

    const totalWildpassCount = useMemo(
        () =>
            wildpasses.reduce(
                (total, pass) => total + (pass?.quantity ?? 0),
                0
            ),
        [wildpasses]
    );

    const franchiseAssets = useMemo(() => {
        const assetsMap = franchiseAssetsMap;

        const excludeAddress = "0xd8cb3f39875def5853b155c0adf2530644397428";

        const groupedAssets = parsedUserNfts
            .filter(
                (nft) =>
                    nft?.nftAddress &&
                    nft.nftAddress.toLowerCase() !== excludeAddress
            )
            .map((nft) => {
                const tokenIdRaw = nft?.tokenId?.toString().trim();
                if (!tokenIdRaw) {
                    return null;
                }
                let tokenNumber: bigint;
                try {
                    tokenNumber = tokenIdRaw.startsWith("0x")
                        ? BigInt(tokenIdRaw)
                        : BigInt(tokenIdRaw);
                } catch {
                    return null;
                }
                const tokenId = Number(tokenNumber);
                const contractAddress = nft?.nftAddress?.toLowerCase() ?? "";
                const asset = assetsMap[`${contractAddress}-${tokenId}`];
                if (!asset) {
                    return null;
                }

                return {
                    key: `${contractAddress}-${tokenId}`,
                    tokenId,
                    name: asset.label,
                    image: asset.image,
                    rate: asset.rate,
                    expires: asset.expires ?? null,
                };
            })
            .filter((entry): entry is NonNullable<typeof entry> => !!entry);

        const groupedMap = new Map<
            string,
            {
                id: string;
                tokenId: number;
                name: string;
                image: string;
                rate: number;
                expires: Date | null;
                count: number;
            }
        >();

        for (const asset of groupedAssets) {
            const existing = groupedMap.get(asset.key);
            if (existing) {
                existing.count += 1;
            } else {
                groupedMap.set(asset.key, {
                    id: asset.key,
                    tokenId: asset.tokenId,
                    name: asset.name,
                    image: asset.image,
                    rate: asset.rate,
                    expires: asset.expires,
                    count: 1,
                });
            }
        }

        return Array.from(groupedMap.values()).sort(
            (a, b) => a.tokenId - b.tokenId
        );
    }, [parsedUserNfts]);

    try {
        return (
            <ThousandsLayout
                userDB={userDBState}
                connectedUserDBProviderId={connectedUserDBProviderId}
                connectedUserDBEmail={connectedUserDBEmail}
            >
                <Box
                    minH="100vh"
                    px={{ base: 4, md: 10 }}
                    py={{ base: 10, md: 14 }}
                >
                    <Stack spacing={8}>
                        <Button
                            as={Link}
                            href={`/${serverCode}/franchises`}
                            onClick={() => startLoading()}
                            leftIcon={<FiArrowLeft />}
                            size="md"
                            color="white"
                            variant="outline"
                            border="1px solid rgba(255,255,255,0.4)"
                            borderRadius="full"
                            alignSelf="flex-start"
                            _hover={{
                                bg: "rgba(255,255,255,0.2)",
                                transform: "translateX(-4px)",
                            }}
                            transition="all 0.2s"
                        >
                            Back to Franchise Leaderboard
                        </Button>
                        
                        {shouldShowKycPanel ? (
                            <Box {...glassProps} color="white">
                                <Heading size="md" color={kycHeadingColor}>
                                    Complete KYC
                                </Heading>
                                <Text mt={3} color={kycDescriptionColor}>
                                    {isKycPending
                                        ? "Resume identity verification to finish your franchise onboarding."
                                        : "Complete identity verification (KYC) to start your franchise."}
                                </Text>
                                <Flex mt={6} direction="column" gap={2}>
                                    <Button
                                        bgGradient={KYC_BUTTON_GRADIENT}
                                        color="white"
                                        onClick={handleCompleteKyc}
                                        isLoading={kycLoading}
                                        isDisabled={
                                            kycCompleted ||
                                            kycLoading ||
                                            !STRIPE_PUBLISHABLE_KEY
                                        }
                                        _hover={{
                                            bgGradient: KYC_BUTTON_GRADIENT,
                                            boxShadow:
                                                "0 20px 40px rgba(124, 58, 237, 0.35)",
                                            transform: "translateY(-1px)",
                                        }}
                                        _active={{ transform: "translateY(0px)" }}
                                        alignSelf="flex-start"
                                    >
                                        {kycCompleted
                                            ? "KYC Completed"
                                            : isKycPending
                                            ? "Resume KYC"
                                            : "Complete KYC"}
                                    </Button>
                                    {!STRIPE_PUBLISHABLE_KEY && (
                                        <Text color="orange.300" fontSize="sm">
                                            Stripe publishable key is not configured.
                                        </Text>
                                    )}
                                    {kycError && (
                                        <Text color="red.300" fontSize="sm">
                                            {kycError}
                                        </Text>
                                    )}
                                </Flex>
                            </Box>
                        ) : (
                            <>
                                <Heading size="2xl" color="white">
                                    {franchiseUser?.preferences?.displayName ?? maskAddress(
                                                franchiseUser?.walletProvider?.address
                                            )}
                                </Heading>

                                <Flex flexWrap="wrap" gap={4}>
                            {/*
                            <Box
                                {...glassProps}
                                flex="1 1 220px"
                                color="white"
                                display="flex"
                                flexDir="column"
                                gap={2}
                            >
                                <Text fontSize="sm" opacity={0.8}>
                                    Wallet
                                </Text>
                                <Text
                                    fontWeight="bold"
                                    fontSize={{ base: "xl", md: "2xl" }}
                                >
                                    {maskAddress(
                                        franchiseUser?.walletProvider?.address
                                    )}
                                </Text>
                            </Box>                            
                            */}
                            {isCurrentUserFranchise && (
                                <Box
                                    {...glassProps}
                                    flex="1 1 220px"
                                    color="white"
                                    display="flex"
                                    flexDir="column"
                                    gap={2}
                                >
                                    <Text fontSize="sm" opacity={0.8}>
                                        Division
                                    </Text>
                                    <Text
                                        fontWeight="bold"
                                        fontSize={{ base: "xl", md: "2xl" }}
                                    >
                                        {LADDER_INDEX_LABELS[ladderIndex] ??
                                            "Pending"}
                                    </Text>
                                </Box>
                            )}
                            <Box
                                {...glassProps}
                                flex="1 1 220px"
                                color="white"
                                display="flex"
                                flexDir="column"
                                gap={2}
                            >
                                <Text fontSize="sm" opacity={0.8}>
                                    Offer Rank
                                </Text>
                                <Text
                                    fontWeight="bold"
                                    fontSize={{ base: "xl", md: "4xl" }}
                                >
                                    {offerRank > 0 ? `${offerRank}` : "Pending"}
                                </Text>
                            </Box>
                            {isCurrentUserFranchise &&
                                franchiseBalance !== null &&
                                franchiseBalance >= 1 && (
                                    <Box
                                        {...glassProps}
                                        flex="1 1 220px"
                                        color="white"
                                        display="flex"
                                        flexDir="column"
                                        gap={2}
                                    >
                                        <Text fontSize="sm" opacity={0.8}>
                                            Franchise Balance
                                        </Text>
                                        <Text
                                            fontWeight="bold"
                                            fontSize={{ base: "xl", md: "4xl" }}
                                        >
                                            {franchiseBalanceDisplay}
                                        </Text>
                                    </Box>
                                )}   
                            {isCurrentUserFranchise && (
                                <Box
                                    {...glassProps}
                                    flex="1 1 220px"
                                    color="white"
                                    display="flex"
                                    flexDir="column"
                                    gap={2}
                                >
                                    <Text fontSize="sm" opacity={0.8}>
                                        Draft Picks
                                    </Text>
                                    <Text
                                        fontWeight="bold"
                                        fontSize={{ base: "xl", md: "4xl" }}
                                    >
                                        {draftPicksBalance}
                                    </Text>
                                </Box>
                            )}
                        </Flex>
                        {isCurrentUserFranchise &&
                            parsedFranchiseOffers.length > 0 && (
                                <Box
                                    {...glassProps}
                                    color="white"
                                    display="flex"
                                    flexDir="column"
                                    gap={4}
                                >
                                    <Flex
                                        alignItems="center"
                                        justifyContent="space-between"
                                        gap={4}
                                        flexWrap="wrap"
                                    >
                                        <Heading size="md">
                                            Offers
                                        </Heading>
                                    </Flex>
                                    <Stack spacing={0}>
                                        <Flex
                                            alignItems="center"
                                            justifyContent="space-between"
                                            pb={3}
                                            borderBottom="1px solid"
                                            borderColor="rgba(255,255,255,0.15)"
                                            flexWrap="wrap"
                                            gap={4}
                                        >
                                            <Text
                                                fontSize="sm"
                                                letterSpacing="0.2em"
                                                textTransform="uppercase"
                                                opacity={0.7}
                                                flex="1"
                                                minW="160px"
                                            >
                                                Received On
                                            </Text>
                                            <Text
                                                fontSize="sm"
                                                letterSpacing="0.2em"
                                                textTransform="uppercase"
                                                opacity={0.7}
                                                minW="120px"
                                                textAlign="right"
                                            >
                                                Epoch #
                                            </Text>
                                            <Text
                                                fontSize="sm"
                                                letterSpacing="0.2em"
                                                textTransform="uppercase"
                                                opacity={0.7}
                                                minW="160px"
                                                textAlign="right"
                                            >
                                                Offer Amount
                                            </Text>
                                            <Text
                                                fontSize="sm"
                                                letterSpacing="0.2em"
                                                textTransform="uppercase"
                                                opacity={0.7}
                                                minW="200px"
                                                textAlign="right"
                                            >
                                                Action
                                            </Text>
                                        </Flex>
                                        {parsedFranchiseOffers.map(
                                            (offer, index) => {
                                                const createdAtLabel =
                                                    offer?.createdAt
                                                        ? new Date(
                                                              offer.createdAt
                                                          ).toLocaleDateString()
                                                        : "Unknown";
                                                const offerAmountCents = Number(
                                                    offer?.offerAmount ?? 0
                                                );
                                                const offerAmountDollars =
                                                    Number.isFinite(
                                                        offerAmountCents
                                                    )
                                                        ? offerAmountCents / 100
                                                        : 0;
                                                const offerAmountLabel =
                                                    Number.isFinite(
                                                        offerAmountDollars
                                                    )
                                                        ? offerAmountDollars.toLocaleString(
                                                              undefined,
                                                              {
                                                                  style: "currency",
                                                                  currency: "USD",
                                                              }
                                                          )
                                                        : "$0.00";

                                                const decision =
                                                    offerDecisionByEpoch.get(
                                                        offer?.epoch ?? -1
                                                    ) ?? null;

                                                return (
                                                    <Flex
                                                        key={offer.id}
                                                        py={4}
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        borderTop={
                                                            index === 0
                                                                ? "none"
                                                                : "1px solid"
                                                        }
                                                        borderColor="rgba(255,255,255,0.15)"
                                                        flexWrap="wrap"
                                                        gap={4}
                                                    >
                                                        <Text
                                                            fontSize="lg"
                                                            fontWeight="semibold"
                                                            flex="1"
                                                            minW="160px"
                                                        >
                                                            {createdAtLabel}
                                                        </Text>
                                                        <Text
                                                            fontSize="lg"
                                                            fontWeight="semibold"
                                                            minW="120px"
                                                            textAlign="right"
                                                        >
                                                            {offer?.epoch ?? "-"}
                                                        </Text>
                                                        <Text
                                                            fontSize="lg"
                                                            fontWeight="semibold"
                                                            minW="160px"
                                                            textAlign="right"
                                                        >
                                                            {offerAmountLabel}
                                                        </Text>
                                                        <Flex
                                                            minW="200px"
                                                            justifyContent="flex-end"
                                                        >
                                                            {decision ? (
                                                                <Text
                                                                    fontSize="lg"
                                                                    fontWeight="semibold"
                                                                >
                                                                    {decision}
                                                                </Text>
                                                            ) : (
                                                                <Button
                                                                    as="a"
                                                                    href={
                                                                        franchiseOfferAcceptOrRejectUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    size="sm"
                                                                    color="white"
                                                                    variant="outline"
                                                                    border="1px solid rgba(255,255,255,0.5)"
                                                                    borderRadius="full"
                                                                    _hover={{
                                                                        bg: "rgba(255,255,255,0.2)",
                                                                        transform:
                                                                            "translateY(-1px)",
                                                                    }}
                                                                    isDisabled={
                                                                        !franchiseOfferAcceptOrRejectUrl
                                                                    }
                                                                >
                                                                    Accept or
                                                                    Reject?
                                                                </Button>
                                                            )}
                                                        </Flex>
                                                    </Flex>
                                                );
                                            }
                                        )}
                                    </Stack>
                                    <Box
                                        mt={6}
                                        pt={4}
                                        borderTop="1px solid"
                                        borderColor="rgba(255,255,255,0.15)"
                                    >
                                        <Text
                                            fontSize="sm"
                                            opacity={0.8}
                                            lineHeight="1.6"
                                        >
                                            You have a week to Accept or
                                            Decline Offers. If you haven&apos;t yet
                                            decided by the end of the week,
                                            then your Franchise will
                                            automatically:
                                        </Text>
                                        <Flex
                                            mt={4}
                                            alignItems="center"
                                        >
                                            <HStack
                                                spacing={2}
                                                bg="rgba(0,0,0,0.35)"
                                                border="1px solid rgba(255,255,255,0.2)"
                                                borderRadius="full"
                                                p="4px"
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="unstyled"
                                                    px={5}
                                                    py={2}
                                                    borderRadius="full"
                                                    fontWeight="semibold"
                                                    lineHeight="1"
                                                    color={
                                                        autoAcceptSelection ===
                                                        "accept"
                                                            ? "white"
                                                            : "whiteAlpha.700"
                                                    }
                                                    bg={
                                                        autoAcceptSelection ===
                                                        "accept"
                                                            ? "whiteAlpha.400"
                                                            : "transparent"
                                                    }
                                                    _hover={{
                                                        bg:
                                                            autoAcceptSelection ===
                                                            "accept"
                                                                ? "whiteAlpha.500"
                                                                : "whiteAlpha.200",
                                                    }}
                                                    isLoading={
                                                        autoAcceptLoading ===
                                                        "accept"
                                                    }
                                                    onClick={() =>
                                                        handleAutoAcceptToggle(
                                                            "accept"
                                                        )
                                                    }
                                                >
                                                    Accept (Divest)
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="unstyled"
                                                    px={5}
                                                    py={2}
                                                    borderRadius="full"
                                                    fontWeight="semibold"
                                                    lineHeight="1"
                                                    color={
                                                        autoAcceptSelection ===
                                                        "decline"
                                                            ? "white"
                                                            : "whiteAlpha.700"
                                                    }
                                                    bg={
                                                        autoAcceptSelection ===
                                                        "decline"
                                                            ? "whiteAlpha.400"
                                                            : "transparent"
                                                    }
                                                    _hover={{
                                                        bg:
                                                            autoAcceptSelection ===
                                                            "decline"
                                                                ? "whiteAlpha.500"
                                                                : "whiteAlpha.200",
                                                    }}
                                                    isLoading={
                                                        autoAcceptLoading ===
                                                        "decline"
                                                    }
                                                    onClick={() =>
                                                        handleAutoAcceptToggle(
                                                            "decline"
                                                        )
                                                    }
                                                >
                                                    Decline (Hold)
                                                </Button>
                                            </HStack>
                                        </Flex>
                                    </Box>
                                </Box>
                            )}
                        <Box
                            {...glassProps}
                            color="white"
                            display="flex"
                            flexDir="column"
                            gap={4}
                        >
                            <Flex
                                alignItems="center"
                                justifyContent="space-between"
                                gap={4}
                                flexWrap="wrap"
                            >
                                <Heading size="md">Roster</Heading>
                                {isCurrentUserFranchise && (
                                    <Button
                                        as="a"
                                        href={franchiseAssetMarketplaceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="sm"
                                        color="white"
                                        variant="outline"
                                        border="1px solid rgba(255,255,255,0.5)"
                                        borderRadius="full"
                                        _hover={{
                                            bg: "rgba(255,255,255,0.2)",
                                            transform: "translateY(-1px)",
                                        }}
                                    >
                                        Purchase Franchise Assets
                                    </Button>
                                )}
                            </Flex>
                            {franchiseAssets.length ? (
                                <Stack spacing={0}>
                                    <Flex
                                        alignItems="center"
                                        justifyContent="space-between"
                                        pb={3}
                                        borderBottom="1px solid"
                                        borderColor="rgba(255,255,255,0.15)"
                                        flexWrap="wrap"
                                        gap={4}
                                    >
                                        <Text
                                            fontSize="sm"
                                            letterSpacing="0.2em"
                                            textTransform="uppercase"
                                            opacity={0.7}
                                            flex="1"
                                            minW="200px"
                                        >
                                            Name
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            letterSpacing="0.2em"
                                            textTransform="uppercase"
                                            opacity={0.7}
                                            minW="120px"
                                            textAlign="right"
                                        >
                                            # of Assets
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            letterSpacing="0.2em"
                                            textTransform="uppercase"
                                            opacity={0.7}
                                            minW="120px"
                                            textAlign="right"
                                        >
                                            Rate
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            letterSpacing="0.2em"
                                            textTransform="uppercase"
                                            opacity={0.7}
                                            minW="120px"
                                            textAlign="right"
                                        >
                                            Expiration
                                        </Text>
                                    </Flex>
                                    {franchiseAssets.map(
                                        (
                                            { id, image, name, rate, expires, count },
                                            idx
                                        ) => {
                                            const expiresTime = expires
                                                ? new Date(expires).getTime()
                                                : null;
                                            const nowTime = Date.now();
                                            const remainingMs =
                                                expiresTime !== null
                                                    ? expiresTime - nowTime
                                                    : null;
                                            const remainingDays =
                                                remainingMs !== null
                                                    ? Math.ceil(
                                                          remainingMs /
                                                              (1000 *
                                                                  60 *
                                                                  60 *
                                                                  24)
                                                      )
                                                    : null;
                                            const expiresLabel =
                                                remainingDays === null
                                                    ? "Active"
                                                    : remainingDays > 0
                                                    ? `${remainingDays} days left`
                                                    : "Retired";

                                            return (
                                            <Flex
                                                key={id}
                                                py={4}
                                                alignItems="center"
                                                justifyContent="space-between"
                                                borderTop={
                                                    idx === 0
                                                        ? "none"
                                                        : "1px solid"
                                                }
                                                borderColor="rgba(255,255,255,0.15)"
                                                flexWrap="wrap"
                                                gap={4}
                                            >
                                                <Flex
                                                    alignItems="center"
                                                    gap={3}
                                                    flex="1"
                                                    minW="200px"
                                                >
                                                    <Image
                                                        src={image}
                                                        alt={`${name} avatar`}
                                                        width={48}
                                                        height={48}
                                                        style={{
                                                            borderRadius: "12px",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                    <Text fontSize="lg" fontWeight="semibold">
                                                        {name}
                                                    </Text>
                                                </Flex>
                                                <Text
                                                    fontSize="lg"
                                                    fontWeight="semibold"
                                                    minW="120px"
                                                    textAlign="right"
                                                >
                                                    {count}
                                                </Text>
                                                <Text
                                                    fontSize="lg"
                                                    fontWeight="semibold"
                                                    minW="120px"
                                                    textAlign="right"
                                                >
                                                    {rate}
                                                </Text>
                                                <Text
                                                    fontSize="lg"
                                                    fontWeight="semibold"
                                                    minW="120px"
                                                    textAlign="right"
                                                >
                                                    {expiresLabel}
                                                </Text>
                                            </Flex>
                                            );
                                        }
                                    )}
                                </Stack>
                            ) : (
                                <Text color="whiteAlpha.800">
                                    No franchise assets found.
                                </Text>
                            )}
                        </Box>
                        <Box
                            {...glassProps}
                            color="white"
                            display="flex"
                            flexDir="column"
                            gap={4}
                        >
                            <Flex
                                alignItems="center"
                                justifyContent="space-between"
                                gap={4}
                                flexWrap="wrap"
                            >
                                <Heading size="md">Wildpasses</Heading>
                                <Text
                                    fontSize="sm"
                                    opacity={0.8}
                                    textTransform="uppercase"
                                    letterSpacing="0.08em"
                                >
                                    Total Wildpasses: {totalWildpassCount}
                                </Text>
                            </Flex>
                            {wildpasses.length ? (
                                <Stack spacing={0}>
                                    {wildpasses.map((pass, index) => (
                                        <Flex
                                            key={pass.id}
                                            align="center"
                                            py={4}
                                            borderTop={
                                                index === 0
                                                    ? "none"
                                                    : "1px solid"
                                            }
                                            borderColor="rgba(255,255,255,0.15)"
                                        >
                                            <Grid
                                                templateColumns={{
                                                    base: "48px 64px 1fr",
                                                    sm: "64px 80px 1fr",
                                                }}
                                                columnGap={4}
                                                alignItems="center"
                                                w="100%"
                                            >
                                                <GridItem>
                                                    <Text
                                                        fontSize="lg"
                                                        fontWeight="semibold"
                                                    >
                                                        {pass.quantity}x
                                                    </Text>
                                                </GridItem>
                                                <GridItem>
                                                    <Image
                                                        src={pass.image}
                                                        alt="Wildpass icon"
                                                        width={56}
                                                        height={56}
                                                        style={{
                                                            borderRadius: "12px",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                </GridItem>
                                                <GridItem>
                                                    <Text
                                                        fontSize="lg"
                                                        fontWeight="semibold"
                                                    >
                                                        {pass.label}
                                                    </Text>
                                                </GridItem>
                                            </Grid>
                                        </Flex>
                                    ))}
                                </Stack>
                            ) : (
                                <Text color="whiteAlpha.800">
                                    No wildpasses found.
                                </Text>
                            )}
                        </Box>
                            </>
                        )}
                    </Stack>
                </Box>
            </ThousandsLayout>
        );
    } catch (error) {
        console.error("Failed to render franchise detail page", error);
        return (
            <ThousandsLayout
                userDB={userDBState}
                connectedUserDBProviderId={connectedUserDBProviderId}
                connectedUserDBEmail={connectedUserDBEmail}
            >
                <Box
                    minH="100vh"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={6}
                >
                    <Text color="white" fontSize="lg">
                        Unable to load franchise detail page.
                    </Text>
                </Box>
            </ThousandsLayout>
        );
    }
};

export default FranchiseDetailPage;

export const getServerSideProps: GetServerSideProps<
    FranchiseDetailProps | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const authCheck = await checkUserAuthorizedForPage(context);

    if (!authCheck.success) {
        return authCheck.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData = authCheck.data as AuthorizedUserData;
    const userDB: IUser | null = authorizedUserData?.userDB;
    const {
        wildcardAccessToken,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = authorizedUserData;

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    const { serverCode } = context.params as { serverCode: string };
    const userIdParam = context.params?.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

    if (!userId) {
        return {
            redirect: {
                destination: `/${serverCode}/franchises`,
                permanent: false,
            },
        };
    }

    let franchiseUser: IUser | null = null;
    let userNftsStr = "";
    const userNfts: {
        nftAddress?: string;
        tokenId?: string;
        startDate?: string | null;
        endDate?: string | null;
    }[] = [];
    let offerRank = 0;
    let ladderIndex = 0;
    let franchiseBalance: number | null = null;
    let franchiseOffersStr = "";
    const isOwner =
        !!userDB?._id &&
        !!userId &&
        userDB._id.toString().toLowerCase() === userId.toLowerCase();

    const userRepository =
        diContainer.get<IUserRepository>("IUserRepository");

    try {
        await connectToDb();
        franchiseUser = await userRepository.findUserById(userId);
    } catch (error) {
        console.error("Failed to fetch franchise user", error);
    }

    try {
        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );
        const franchiseUserId =
            franchiseUser?._id?.toString() || userId;
        let rank: number | null = null;
        for (const ladderIndexCandidate of [1, 2, 3, 4, 5]) {
            const entries =
                await franchiseCacheRepository.getFranchiseIndex(
                    ladderIndexCandidate
                );
            const match = entries.find(
                (entry) => entry.userId === franchiseUserId
            );
            if (match) {
                rank = match.rank;
                ladderIndex = ladderIndexCandidate;
                break;
            }
        }
        offerRank = rank ?? -1;
        const primaryAddress =
            franchiseUser?.walletProvider?.address?.toLowerCase() ?? "";
        const additionalAddresses =
            franchiseUser?.walletProvider?.additionalWallets?.map((address) =>
                address?.toLowerCase()
            ) ?? [];
        const allAddresses = Array.from(
            new Set(
                [primaryAddress, ...additionalAddresses].filter(Boolean)
            )
        ) as string[];

        if (allAddresses.length) {
            for (const address of allAddresses) {
                const payload = await franchiseCacheRepository.getUserNfts(
                    address
                );
                if (!payload) {
                    continue;
                }

                try {
                    const parsed = JSON.parse(payload) as {
                        nfts?: {
                            nftAddress?: string;
                            tokenId?: string;
                            startDate?: string | null;
                            endDate?: string | null;
                        }[];
                    };

                    for (const nft of parsed?.nfts ?? []) {
                        userNfts.push({
                            nftAddress: nft?.nftAddress ?? "",
                            tokenId: nft?.tokenId ?? "",
                            startDate: nft?.startDate ?? null,
                            endDate: nft?.endDate ?? null,
                        });
                    }
                } catch (error) {
                    console.error(
                        "Failed to parse user NFTs payload",
                        error
                    );
                }
            }

            if (userNfts.length) {
                userNftsStr = JSON.stringify({
                    nfts: userNfts,
                });
            }
        }
    } catch (error) {
        console.error("Failed to fetch franchise rank", error);
    }

    try {
        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );
        const franchiseUserId = franchiseUser?._id?.toString() || userId;
        const payload = await franchiseCacheRepository.getFranchise(
            franchiseUserId
        );
        if (payload) {
            const parsed = JSON.parse(payload) as {
                franchiseBalance?: number | null;
            };
            const parsedBalance = Number(parsed?.franchiseBalance);
            franchiseBalance = Number.isFinite(parsedBalance)
                ? parsedBalance
                : null;
        }
    } catch (error) {
        console.error("Failed to fetch franchise balance", error);
    }

    if (isOwner) {
        try {
            const franchiseOffersRepository =
                diContainer.get<IFranchiseOffersRepository>(
                    "IFranchiseOffersRepository"
                );
            const franchiseUserId =
                franchiseUser?._id?.toString() || userId;
            const offers =
                await franchiseOffersRepository.getFranchiseOffersForUserId(
                    franchiseUserId
                );
            if (offers?.length) {
                franchiseOffersStr = JSON.stringify({
                    offers: offers.map((offer) => ({
                        id: offer?._id?.toString() ?? "",
                        epoch: offer?.epoch ?? 0,
                        offerAmount: offer?.offerAmount ?? 0,
                        createdAt: offer?.createdAt
                            ? offer.createdAt.toISOString()
                            : null,
                    })),
                });
            }
        } catch (error) {
            console.error("Failed to fetch franchise offers", error);
        }
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            connectedUserDBEmail: connectedUserDBEmail ?? "",
            connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            franchiseUser: franchiseUser ? JSON.parse(JSON.stringify(franchiseUser)) : null,
            offerRank,
            serverCode,
            userNftsStr,
            ladderIndex,
            franchiseOffersStr,
            franchiseBalance,
        },
    };
};

