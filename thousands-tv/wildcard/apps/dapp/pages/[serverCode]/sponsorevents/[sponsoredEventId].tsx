import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { ISponsorshipSlot, IUser, ISponsoredEvent } from "@repo/interfaces";
import {
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { diContainer } from "@/inversify.config";
import ISponsoredEventRepository from "@/repositories/interfaces/ISponsoredEventRepository";
import { USDCIcon } from "@/components/USDCIcon";
import PaymentEmbedSection from "@/features/Stream/Body/Credits/CreditPurchaseModal/PaymentEmbedSection";
import { CreditOption } from "@/features/Stream/Body/Credits/contants";
import { useGenerateTransactionId } from "@/hooks/credits/useGenerateTransactionId";
import connectToDb from "@/db/connectToDb";
import { userSponsoredEventModel } from "@repo/schemas";
import { getThirdWebPayEmbedChain } from "@/utils/environmentUtil";

interface SponsoredEventDetailProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    wildcardAccessToken: string;
    sponsoredEventStr: string | null;
    serverCode: string;
    sponsorshipTierCounts: Record<number, number>;
}

const SponsoredEventDetailPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    wildcardAccessToken,
    sponsoredEventStr,
    serverCode,
    sponsorshipTierCounts,
}: SponsoredEventDetailProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    const sponsoredEvent = sponsoredEventStr
        ? (JSON.parse(sponsoredEventStr) as ISponsoredEvent)
        : null;
    const [tierCounts, setTierCounts] = useState<Record<number, number>>(
        sponsorshipTierCounts ?? {}
    );
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<CreditOption | null>(
        null
    );
    const [selectedPaymentSlotId, setSelectedPaymentSlotId] = useState<
        string | null
    >(null);
    const [isThirdwebPurchaseSuccess, setIsThirdwebPurchaseSuccess] =
        useState(false);
    const {
        transactionId,
        setTransactionId,
        loading: isTransactionIdLoading,
        error: transactionIdError,
        fetchTransactionId,
    } = useGenerateTransactionId();
    const bonusMap = useMemo(
        () => (selectedOption ? { [selectedOption.id]: 0 } : {}),
        [selectedOption]
    );

    const panelBg = useColorModeValue(
        "rgba(255,255,255,0.75)",
        "rgba(255,255,255,0.14)"
    );
    const panelBorder = useColorModeValue(
        "rgba(255,255,255,0.55)",
        "rgba(255,255,255,0.25)"
    );

    const glassProps = {
        bg: panelBg,
        border: "1px solid",
        borderColor: panelBorder,
        borderRadius: "2xl",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        p: { base: 6, md: 8 },
    };

    const formatDateTime = (value?: string | Date) => {
        if (!value) {
            return "--";
        }

        const parsed = typeof value === "string" ? new Date(value) : value;
        if (Number.isNaN(parsed.getTime())) {
            return "--";
        }

        return parsed.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getVisibilityLabel = (tier?: number) => {
        if (tier === 1) {
            return "High";
        }
        if (tier === 2) {
            return "Medium";
        }
        if (tier === 3) {
            return "Low";
        }
        return "--";
    };

    useEffect(() => {
        if (isPaymentOpen && selectedOption) {
            setTransactionId(null);
            fetchTransactionId();
        }
    }, [isPaymentOpen, selectedOption, fetchTransactionId, setTransactionId]);

    const handleOpenPayment = (
        slot: {
            creditsPrice: number;
            usdcPrice: number;
            sponsorshipSlotId?: string;
            packageDescription?: string;
        },
        index: number
    ) => {
        setIsThirdwebPurchaseSuccess(false);
        const isTestChain = getThirdWebPayEmbedChain() === "sepolia";
        const adjustedUsdcPrice = isTestChain
            ? slot.usdcPrice / 100
            : slot.usdcPrice;
        const optionId = `${sponsoredEvent?._id ?? "sponsored-event"}-${index}`;
        setSelectedOption({
            credits: slot.creditsPrice,
            price: adjustedUsdcPrice,
            color: "bg-[#1A1B1F]",
            name: `${sponsoredEvent?.name ?? "Sponsored Event"} - ${slot.packageDescription ?? ""}`.trim(),
            image: "/images/wildcardpremierleague.png",
            id: optionId,
            sku: `sponsored-slot-${optionId}`,
        });
        setSelectedPaymentSlotId(slot.sponsorshipSlotId ?? null);
        setIsPaymentOpen(true);
    };

    const handleClosePayment = () => {
        setIsPaymentOpen(false);
        setSelectedOption(null);
        setSelectedPaymentSlotId(null);
        setTransactionId(null);
        setIsThirdwebPurchaseSuccess(false);
    };

    const getAvailableInventoryForTier = (tier: number) => {
        if (!sponsoredEvent?.sponsorshipSlots?.length) {
            return null;
        }

        const slotsForTier = sponsoredEvent.sponsorshipSlots.filter(
            (slot) => slot.tier === tier
        );
        if (slotsForTier.length === 0) {
            return null;
        }

        const originalInventory = slotsForTier[0]?.maxSlots;
        if (typeof originalInventory !== "number") {
            return null;
        }

        const usedInventory = tierCounts[tier] ?? 0;

        return Math.max(originalInventory - usedInventory, 0);
    };

    const sponsorshipDeadline = sponsoredEvent?.sponsorLockTime
        ? new Date(sponsoredEvent.sponsorLockTime)
        : null;
    const isPastSponsorshipDeadline =
        sponsorshipDeadline &&
        !Number.isNaN(sponsorshipDeadline.getTime()) &&
        new Date().getTime() > sponsorshipDeadline.getTime();

    return (
        <ThousandsLayout
            userDB={userDB}
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
                        as="a"
                        href="/thousands/home"
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
                        Back to Home
                    </Button>

                    <Flex
                        direction={{ base: "column", md: "row" }}
                        align={{ base: "flex-start", md: "center" }}
                        justify="space-between"
                        gap={4}
                    >
                        <Heading size="2xl" color="white">
                            {sponsoredEvent?.name || "Sponsored Event"}
                        </Heading>
                        <Button
                            as="a"
                            href={`/${serverCode}/sponsorevents/mysponsorships`}
                            aria-label="View My Sponsorships"
                            rightIcon={<FiExternalLink />}
                            size="lg"
                            color="white"
                            variant="outline"
                            border="1px solid rgba(255,255,255,0.4)"
                            borderRadius="full"
                            _hover={{
                                bg: "rgba(255,255,255,0.2)",
                                transform: "translateY(-2px)",
                            }}
                        >
                            My Sponsorships
                        </Button>
                    </Flex>

                    {!sponsoredEvent ? (
                        <Box {...glassProps} color="white">
                            <Text>
                                Unable to load this sponsored event. Please
                                return to the list and try again.
                            </Text>
                        </Box>
                    ) : (
                        <Stack spacing={6}>
                            <Box {...glassProps} color="white">
                                <Heading size="md" mb={4}>
                                    Event Details
                                </Heading>
                                <Grid
                                    templateColumns={{
                                        base: "1fr",
                                        md: "repeat(2, minmax(0, 1fr))",
                                    }}
                                    gap={6}
                                >
                                    {/*
                                    <GridItem>
                                        <Text fontSize="sm" opacity={0.75}>
                                            Type
                                        </Text>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            {sponsoredEvent.type || "--"}
                                        </Text>
                                    </GridItem>
                                    */}
                                    <GridItem>
                                        <Text fontSize="sm" opacity={0.75}>
                                            Event Start Time
                                        </Text>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            {formatDateTime(
                                                sponsoredEvent.startTime
                                            )}
                                        </Text>
                                    </GridItem>
                                    <GridItem>
                                        <Text fontSize="sm" opacity={0.75}>
                                            Sponsorship Deadline
                                        </Text>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            {formatDateTime(
                                                sponsoredEvent.sponsorLockTime
                                            )}
                                        </Text>
                                    </GridItem>
                                </Grid>
                            </Box>
                            {/*
                            <Box {...glassProps} color="white">
                                <Heading size="md" mb={4}>
                                    Available Inventory
                                </Heading>
                                <Grid
                                    templateColumns={{
                                        base: "1fr",
                                        md: "repeat(3, minmax(0, 1fr))",
                                    }}
                                    gap={6}
                                >
                                    <GridItem>
                                        <Text fontSize="sm" opacity={0.75}>
                                            Title
                                        </Text>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            {getAvailableInventoryForTier(1) ?? "--"}
                                        </Text>
                                    </GridItem>
                                    <GridItem>
                                        <Text fontSize="sm" opacity={0.75}>
                                            Official
                                        </Text>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            {getAvailableInventoryForTier(2) ?? "--"}
                                        </Text>
                                    </GridItem>
                                    <GridItem>
                                        <Text fontSize="sm" opacity={0.75}>
                                            Contributing
                                        </Text>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            {getAvailableInventoryForTier(3) ?? "--"}
                                        </Text>
                                    </GridItem>
                                </Grid>
                            </Box>
                            */}
                            <Box {...glassProps} color="white">
                                <Flex
                                    align="center"
                                    justify="space-between"
                                    gap={4}
                                    mb={4}
                                >
                                    <Heading size="md">
                                        Sponsorship Oportunities
                                    </Heading>
                                </Flex>
                                {sponsoredEvent.sponsorshipSlots?.length ? (
                                    <Stack spacing={3}>
                                        <Grid
                                            templateColumns={{
                                                base: "1fr",
                                                md: "2fr 1fr 1fr",
                                            }}
                                            gap={4}
                                            px={4}
                                            py={3}
                                            color="whiteAlpha.700"
                                            textTransform="uppercase"
                                            letterSpacing="0.15em"
                                            fontSize="sm"
                                        >
                                            <GridItem>Package Description</GridItem>
                                            <GridItem>Support</GridItem>
                                            {/*<GridItem>USDC</GridItem>*/}
                                        </Grid>
                                        {sponsoredEvent.sponsorshipSlots.map(
                                            (slot, index) => (
                                                (() => {
                                                    const slotId =
                                                        slot.sponsorshipSlotId ??
                                                        "";
                                                    const isSoldOut =
                                                        typeof slot.tier ===
                                                            "number" &&
                                                        typeof sponsoredEvent
                                                            ?.sponsorshipSlots?.find(
                                                                (tierSlot) =>
                                                                    tierSlot.tier ===
                                                                    slot.tier
                                                            )?.maxSlots ===
                                                            "number" &&
                                                        (sponsoredEvent
                                                            ?.sponsorshipSlots?.find(
                                                                (tierSlot) =>
                                                                    tierSlot.tier ===
                                                                    slot.tier
                                                            )?.maxSlots ??
                                                            0) > 0 &&
                                                        (tierCounts[slot.tier] ??
                                                            0) >=
                                                            (sponsoredEvent
                                                                ?.sponsorshipSlots?.find(
                                                                    (tierSlot) =>
                                                                        tierSlot.tier ===
                                                                        slot.tier
                                                                )?.maxSlots ??
                                                                0);
                                                    const isSlotDisabled =
                                                        isPastSponsorshipDeadline ||
                                                        isSoldOut;
                                                    return (
                                                <Grid
                                                    key={`${sponsoredEvent._id ?? "slot"}-${index}`}
                                                    templateColumns={{
                                                        base: "1fr",
                                                        md: "2fr 1fr 1fr",
                                                    }}
                                                    gap={4}
                                                    px={4}
                                                    py={4}
                                                    alignItems="center"
                                                    borderRadius="lg"
                                                    bg="rgba(255,255,255,0.08)"
                                                    border="1px solid"
                                                    borderColor="rgba(255,255,255,0.1)"
                                                >
                                                    <GridItem>
                                                        <Text color="white">
                                                            {slot.packageDescription}
                                                        </Text>
                                                        {isSoldOut && (
                                                            <Text
                                                                mt={1}
                                                                fontSize="sm"
                                                                color="red.300"
                                                            >
                                                                Sold Out
                                                            </Text>
                                                        )}
                                                    </GridItem>
                                                    <GridItem>
                                                        <Text color="whiteAlpha.800">
                                                            {getVisibilityLabel(slot.tier)}
                                                        </Text>
                                                    </GridItem>
                                                    {/*
                                                    <GridItem>
                                                        <Button
                                                            variant="outline"
                                                            colorScheme="pink"
                                                            borderRadius="full"
                                                            px={4}
                                                            _hover={{
                                                                bg: "rgba(255,255,255,0.08)",
                                                            }}
                                                            isDisabled={isSlotDisabled}
                                                            onClick={() =>
                                                                handleOpenPayment(
                                                                    {
                                                                        creditsPrice:
                                                                            slot.creditsPrice,
                                                                        usdcPrice:
                                                                    slot.usdcPrice,
                                                                    sponsorshipSlotId:
                                                                        slot.sponsorshipSlotId,
                                                                    packageDescription:
                                                                        slot.packageDescription,
                                                                },
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <Flex align="center" gap={2}>
                                                                <Text color="whiteAlpha.800" fontSize="md">
                                                                    {slot.usdcPrice.toLocaleString(
                                                                        "en-US"
                                                                    )}
                                                                </Text>
                                                                <USDCIcon boxSize="20px" />
                                                            </Flex>
                                                        </Button>
                                                    </GridItem>       
                                                    */}                                             
                                                </Grid>
                                            );
                                            })()
                                            )
                                        )}
                                    </Stack>
                                ) : (
                                    <Text color="whiteAlpha.800">
                                        No sponsorship opportunities at this time.
                                    </Text>
                                )}
                            </Box>
                        </Stack>
                    )}
                </Stack>
                <Modal
                    isOpen={isPaymentOpen}
                    onClose={handleClosePayment}
                    isCentered
                    size="xl"
                >
                    <ModalOverlay bg="blackAlpha.700" />
                    <ModalContent
                        bg="blackAlpha.900"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                    >
                        <ModalHeader color="white">
                            Complete USDC Payment
                        </ModalHeader>
                        <ModalCloseButton color="whiteAlpha.700" />
                        <ModalBody pb={6}>
                            {selectedOption ? (
                                <PaymentEmbedSection
                                    selectedOption={selectedOption}
                                    userId={userDB?._id?.toString() || ""}
                                    setTransactionId={setTransactionId}
                                    transactionId={transactionId}
                                    isTransactionIdLoading={isTransactionIdLoading}
                                    transactionIdError={transactionIdError}
                                    onPurchaseSuccess={() => {
                                        if (!isThirdwebPurchaseSuccess) {
                                            setIsThirdwebPurchaseSuccess(true);
                                            window.location.href = `/${serverCode}/sponsorevents/mysponsorships`;
                                        }
                                    }}
                                    bonusMap={bonusMap}
                                    sponsoredEventId={
                                        sponsoredEvent?._id?.toString()
                                    }
                                    sponsorshipSlotId={
                                        selectedPaymentSlotId ?? undefined
                                    }
                                />
                            ) : (
                                <Text color="whiteAlpha.800">
                                    Select a sponsorship slot to continue.
                                </Text>
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        </ThousandsLayout>
    );
};

export default SponsoredEventDetailPage;

export const getServerSideProps: GetServerSideProps<
    | SponsoredEventDetailProps
    | { redirect: { destination: string; permanent: boolean } }
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

    const { serverCode, sponsoredEventId } = context.params as {
        serverCode: string;
        sponsoredEventId: string;
    };

    if (!sponsoredEventId) {
        return {
            redirect: {
                destination: `/${serverCode}/sponsorevents`,
                permanent: false,
            },
        };
    }

    let sponsoredEvent: ISponsoredEvent | null = null;
    let sponsorshipTierCounts: Record<number, number> = {};

    try {
        const sponsoredEventRepository =
            diContainer.get<ISponsoredEventRepository>(
                "ISponsoredEventRepository"
            );
        sponsoredEvent = await sponsoredEventRepository.getSponsoredEvent(
            sponsoredEventId
        );
        if (sponsoredEvent?.sponsorshipSlots?.length) {
            const tierBySlotId = sponsoredEvent.sponsorshipSlots.reduce<
                Record<string, number>
            >((acc, slot) => {
                if (slot?.sponsorshipSlotId && Number.isFinite(slot.tier)) {
                    acc[slot.sponsorshipSlotId] = slot.tier;
                }
                return acc;
            }, {});

            await connectToDb();
            const slotDocs = await userSponsoredEventModel
                .find(
                    { sponsoredEventId },
                    { sponsorshipSlotId: 1 }
                )
                .lean();
            sponsorshipTierCounts = slotDocs.reduce<Record<number, number>>(
                (acc, doc) => {
                    const slotId = doc?.sponsorshipSlotId;
                    if (!slotId) {
                        return acc;
                    }
                    const tier = tierBySlotId[slotId];
                    if (!Number.isFinite(tier)) {
                        return acc;
                    }
                    acc[tier] = (acc[tier] ?? 0) + 1;
                    return acc;
                },
                {}
            );
        }
    } catch (error) {
        console.error("Failed to fetch sponsored event", error);
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            wildcardAccessToken: wildcardAccessToken ?? "",
            connectedUserDBEmail: connectedUserDBEmail ?? "",
            connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            sponsoredEventStr: sponsoredEvent
                ? JSON.stringify(sponsoredEvent)
                : null,
            serverCode,
            sponsorshipTierCounts,
        },
    };
};
