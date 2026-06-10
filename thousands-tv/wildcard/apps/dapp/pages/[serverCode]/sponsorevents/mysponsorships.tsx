import { GetServerSideProps } from "next";
import { useState } from "react";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { IUser } from "@repo/interfaces";
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
    Tab,
    TabList,
    Tabs,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { diContainer } from "@/inversify.config";
import IUserSponsoredEventRepository from "@/repositories/interfaces/IUserSponsoredEventRepository";
import useLoadingWithRouter from "@/hooks/loadingStateManagement/useLoadingWithRouter";
import ISponsoredEventRepository from "@/repositories/interfaces/ISponsoredEventRepository";
import { getActiveSponsoredEventId } from "@/utils/sponsoredEventUtil";

interface UserSponsorshipsPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    sponsorshipsStr: string;
    serverCode: string;
    activeSponsoredEventId: string | null;
}

interface SponsorshipRow {
    userSponsoredEventId: string;
    eventName: string;
    startTime: string;
    startTimeValue: string | null;
    house: number | null;
    tier: number | null;
    support: number | null;
    wcEarned: number | null;
    thousandsXpEarned: number | null;
    claimedOn: string | null;
    paidOn: string | null;
}

const UserSponsorshipsPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    sponsorshipsStr,
    serverCode,
    activeSponsoredEventId,
}: UserSponsorshipsPageProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    const [sponsorships, setSponsorships] = useState<SponsorshipRow[]>(
        sponsorshipsStr
            ? (JSON.parse(sponsorshipsStr) as SponsorshipRow[])
            : []
    );
    const now = new Date();
    const { startLoading } = useLoadingWithRouter();
    const [isClaimOpen, setIsClaimOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<SponsorshipRow | null>(
        null
    );
    const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const activeSupportTotals = sponsorships.reduce(
        (totals, item) => {
            if (item.claimedOn !== null) {
                return totals;
            }
            const value =
                typeof item.support === "number" ? item.support : 0;
            if (item.house === 1) {
                totals.lubabub += value;
            } else if (item.house === 2) {
                totals.chronos += value;
            } else if (item.house === 3) {
                totals.malus += value;
            }
            return totals;
        },
        { lubabub: 0, chronos: 0, malus: 0 }
    );
    const draftPicksEarned = Number(userDB?.draftPicksEarned ?? 0);
    const draftPicksConsumed = Number(userDB?.draftPicksConsumed ?? 0);
    const draftPicksBalance =
        (Number.isFinite(draftPicksEarned) ? draftPicksEarned : 0) -
        (Number.isFinite(draftPicksConsumed) ? draftPicksConsumed : 0);

    const getStatusLabel = (item: SponsorshipRow) => {
        if (item.paidOn !== null) {
            return "Completed";
        }
        if (item.claimedOn === null) {
            return "Active";
        }
        return "Pending Rewards";
    };

    const filteredSponsorships = sponsorships.filter((item) => {
        const statusLabel = getStatusLabel(item);
        return activeTabIndex === 0
            ? statusLabel === "Active"
            : statusLabel !== "Active";
    });

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

    const getHouseLabel = (house?: number | null) => {
        if (house === 1) {
            return "Lubabub";
        }
        if (house === 2) {
            return "Chronos";
        }
        if (house === 3) {
            return "Malus";
        }
        return "--";
    };

    const getTierLabel = (tier?: number | null) => {
        if (tier === 1) {
            return "Title Sponsor";
        }
        if (tier === 2) {
            return "Official Sponsor";
        }
        if (tier === 3) {
            return "Contributing Sponsor";
        }
        return "--";
    };

    const handleOpenClaim = (sponsorship: SponsorshipRow) => {
        setSelectedClaim(sponsorship);
        setClaimError(null);
        setIsClaimOpen(true);
    };

    const handleCloseClaim = () => {
        setIsClaimOpen(false);
        setSelectedClaim(null);
        setClaimError(null);
    };

    const handleConfirmClaim = async () => {
        if (!selectedClaim?.userSponsoredEventId) {
            setClaimError("Missing sponsorship details. Please try again.");
            return;
        }

        setIsClaimSubmitting(true);
        setClaimError(null);

        try {
            const response = await fetch(
                "/api/sponsorships/claimUserSponsoredEvent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userSponsoredEventId:
                            selectedClaim.userSponsoredEventId,
                    }),
                }
            );

            let payload: any = null;
            try {
                payload = await response.json();
            } catch {
                payload = null;
            }

            if (!response.ok || payload?.success === false) {
                const errorMessage =
                    payload?.message ||
                    payload?.err ||
                    `Request failed (${response.status})`;
                throw new Error(errorMessage);
            }

            setSponsorships((prev) =>
                prev.map((item) =>
                    item.userSponsoredEventId ===
                    selectedClaim.userSponsoredEventId
                        ? {
                              ...item,
                              claimedOn: new Date().toISOString(),
                          }
                        : item
                )
            );

            handleCloseClaim();
        } catch (error: any) {
            console.error("Failed to claim sponsorship", error);
            setClaimError(
                error?.message || "Unable to claim sponsorship."
            );
        } finally {
            setIsClaimSubmitting(false);
        }
    };

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
                        as={Link}
                        href={
                            activeSponsoredEventId
                                ? `/${serverCode}/sponsorevents/${activeSponsoredEventId}`
                                : `/${serverCode}/sponsorevents`
                        }
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
                        Back to Sponsored Event
                    </Button>
                    <Box textAlign={{ base: "left", md: "left" }}>
                        <Heading
                            size="2xl"
                            color="white"
                            textTransform="uppercase"
                            letterSpacing="0.1em"
                        >
                            My Sponsorships
                        </Heading>
                        <Text color="whiteAlpha.800" mt={3}>
                            View the sponsored events you have backed so far.
                        </Text>
                    </Box>

                    <Flex flexWrap="wrap" gap={4}>
                        <Box
                            {...glassProps}
                            flex="1 1 220px"
                            color="white"
                            display="flex"
                            flexDir="column"
                            gap={2}
                        >
                            <Text fontSize="sm" opacity={0.8}>
                                Lubabub Support
                            </Text>
                            <Text
                                fontWeight="bold"
                                fontSize={{ base: "xl", md: "3xl" }}
                            >
                                {activeSupportTotals.lubabub.toLocaleString(
                                    "en-US"
                                )}
                            </Text>
                        </Box>
                        <Box
                            {...glassProps}
                            flex="1 1 220px"
                            color="white"
                            display="flex"
                            flexDir="column"
                            gap={2}
                        >
                            <Text fontSize="sm" opacity={0.8}>
                                Chronos Support
                            </Text>
                            <Text
                                fontWeight="bold"
                                fontSize={{ base: "xl", md: "3xl" }}
                            >
                                {activeSupportTotals.chronos.toLocaleString(
                                    "en-US"
                                )}
                            </Text>
                        </Box>
                        <Box
                            {...glassProps}
                            flex="1 1 220px"
                            color="white"
                            display="flex"
                            flexDir="column"
                            gap={2}
                        >
                            <Text fontSize="sm" opacity={0.8}>
                                Malus Support
                            </Text>
                            <Text
                                fontWeight="bold"
                                fontSize={{ base: "xl", md: "3xl" }}
                            >
                                {activeSupportTotals.malus.toLocaleString(
                                    "en-US"
                                )}
                            </Text>
                        </Box>
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
                                fontSize={{ base: "xl", md: "3xl" }}
                            >
                                {draftPicksBalance.toLocaleString("en-US")}
                            </Text>
                        </Box>
                    </Flex>

                    <Box {...glassProps}>
                        <Heading
                            size="md"
                            mb={6}
                            color="white"
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                        >
                            Sponsorships
                        </Heading>
                        <Tabs
                            index={activeTabIndex}
                            onChange={setActiveTabIndex}
                            variant="soft-rounded"
                            colorScheme="pink"
                            mb={6}
                        >
                            <TabList flexWrap="wrap" gap={2}>
                                <Tab
                                    color="whiteAlpha.800"
                                    _selected={{
                                        color: "white",
                                        bg: "pink.500",
                                    }}
                                    _hover={{
                                        color: "whiteAlpha.900",
                                    }}
                                >
                                    Active
                                </Tab>
                                <Tab
                                    color="whiteAlpha.800"
                                    _selected={{
                                        color: "white",
                                        bg: "pink.500",
                                    }}
                                    _hover={{
                                        color: "whiteAlpha.900",
                                    }}
                                >
                                    Completed
                                </Tab>
                            </TabList>
                        </Tabs>
                        <Stack spacing={4}>
                            {filteredSponsorships.length === 0 ? (
                                <Text color="whiteAlpha.800" textAlign="center">
                                    No sponsorships match this filter.
                                </Text>
                            ) : (
                                <Stack spacing={3}>
                                    <Grid
                                        templateColumns={{
                                            base: "1fr",
                                            md: "0.8fr 0.8fr 1fr 0.85fr 1fr 1fr 120px",
                                        }}
                                        gap={4}
                                        px={4}
                                        py={3}
                                        color="whiteAlpha.700"
                                        textTransform="uppercase"
                                        letterSpacing="0.15em"
                                        fontSize="sm"
                                    >
                                        <GridItem>Tier</GridItem>
                                        <GridItem>House</GridItem>
                                        <GridItem>Event Name</GridItem>
                                        <GridItem>Support</GridItem>
                                        <GridItem>$WC</GridItem>
                                        <GridItem>Status</GridItem>
                                        <GridItem>Actions</GridItem>
                                    </Grid>
                                    {filteredSponsorships.map((item, index) => {
                                        const statusLabel = getStatusLabel(item);
                                        const startTimeValue = item.startTimeValue
                                            ? new Date(item.startTimeValue)
                                            : null;
                                        const claimAvailable =
                                            !!startTimeValue &&
                                            !Number.isNaN(startTimeValue.getTime()) &&
                                            new Date().getTime() >=
                                                startTimeValue.getTime() +
                                                    14 * 24 * 60 * 60 * 1000;
                                        return (
                                        <Grid
                                            key={`${item.eventName}-${index}`}
                                            templateColumns={{
                                                base: "1fr",
                                                md: "0.8fr 0.8fr 1fr 0.85fr 1fr 1fr 120px",
                                            }}
                                            gap={4}
                                            px={4}
                                            py={3}
                                                borderRadius="lg"
                                                bg="rgba(255,255,255,0.08)"
                                                border="1px solid"
                                                borderColor="rgba(255,255,255,0.1)"
                                            >
                                                <GridItem>
                                                    <Text color="whiteAlpha.800">
                                                        {getTierLabel(
                                                            item.tier
                                                        )}
                                                    </Text>
                                                </GridItem>
                                                <GridItem>
                                                    <Text color="whiteAlpha.800">
                                                        {getHouseLabel(
                                                            item.house
                                                        )}
                                                    </Text>
                                                </GridItem>
                                                <GridItem>
                                                    <Text color="white">
                                                        {item.eventName}
                                                    </Text>
                                                </GridItem>
                                                <GridItem>
                                                    <Text color="white">
                                                        {item.support !==
                                                        null
                                                            ? item.support.toLocaleString(
                                                                  "en-US"
                                                              )
                                                            : "--"}
                                                    </Text>
                                                </GridItem>
                                                <GridItem>
                                                    <Text color="whiteAlpha.800">
                                                        {item.wcEarned === null
                                                            ? "--"
                                                            : item.wcEarned === 0
                                                              ? "Pending"
                                                              : item.wcEarned.toLocaleString(
                                                                    "en-US"
                                                                )}
                                                    </Text>
                                                </GridItem>
                                                <GridItem>
                                                    <Text color="whiteAlpha.800">
                                                        {statusLabel}
                                                    </Text>
                                                </GridItem>
                                                <GridItem minW="120px" textAlign="left">
                                                    {statusLabel === "Active" &&
                                                    item.wcEarned !== null &&
                                                    item.wcEarned > 0 &&
                                                    claimAvailable ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            colorScheme="pink"
                                                            borderRadius="full"
                                                            onClick={() =>
                                                                handleOpenClaim(
                                                                    item
                                                                )
                                                            }
                                                            _hover={{
                                                                bg: "rgba(255,255,255,0.08)",
                                                            }}
                                                            whiteSpace="nowrap"
                                                        >
                                                            Claim
                                                        </Button>
                                                    ) : (
                                                        <Text color="whiteAlpha.500">
                                                            Pending
                                                        </Text>
                                                    )}
                                                </GridItem>
                                            </Grid>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    </Box>
                </Stack>
                <Modal
                    isOpen={isClaimOpen}
                    onClose={handleCloseClaim}
                    isCentered
                    size="md"
                >
                    <ModalOverlay bg="blackAlpha.700" />
                    <ModalContent
                        bg={panelBg}
                        border="1px solid"
                        borderColor={panelBorder}
                        backdropFilter="blur(12px)"
                        boxShadow="0 20px 60px rgba(0,0,0,0.25)"
                    >
                        <ModalHeader color="white">
                            Claim Sponsorship Rewards
                        </ModalHeader>
                        <ModalCloseButton color="whiteAlpha.700" />
                                <ModalBody pb={6}>
                                    <Text color="whiteAlpha.800" mb={6}>
                                        Are you sure you want to claim the rewards from
                                        this sponsorship? (This action cannot be
                                        reversed)
                                    </Text>
                                    <Stack direction="row" justify="flex-end" spacing={3}>
                                        <Button
                                            variant="outline"
                                            color="whiteAlpha.900"
                                            borderColor="whiteAlpha.400"
                                            onClick={handleCloseClaim}
                                            isDisabled={isClaimSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme="pink"
                                            onClick={handleConfirmClaim}
                                            isLoading={isClaimSubmitting}
                                        >
                                            Claim
                                        </Button>
                                    </Stack>
                                    {claimError && (
                                        <Text color="red.300" fontSize="sm" mt={4}>
                                            {claimError}
                                        </Text>
                                    )}
                                </ModalBody>
                            </ModalContent>
                        </Modal>
            </Box>
        </ThousandsLayout>
    );
};

export default UserSponsorshipsPage;

export const getServerSideProps: GetServerSideProps<
    | UserSponsorshipsPageProps
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

    const serverCodeParam = context.params?.serverCode;
    const serverCode = Array.isArray(serverCodeParam)
        ? serverCodeParam[0]
        : serverCodeParam || "thousands";

    const userId = userDB?._id?.toString() ?? "";
    let sponsorships: SponsorshipRow[] = [];
    let activeSponsoredEventId: string | null = null;

    if (userId) {
        try {
            const userSponsoredEventRepository =
                diContainer.get<IUserSponsoredEventRepository>(
                    "IUserSponsoredEventRepository"
                );
            const records =
                await userSponsoredEventRepository.getSponsoredEventsByUserId(
                    userId
                );
            sponsorships = records.map((record) => {
                const sponsoredEvent = record.sponsoredEventId as unknown as {
                    name?: string;
                    startTime?: Date;
                    sponsorshipSlots?: { usdcPrice: number; baseWC: number }[];
                };
                const startTime = sponsoredEvent?.startTime
                    ? new Date(sponsoredEvent.startTime).toLocaleString(
                          "en-US",
                          {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                          }
                      )
                    : "--";
                const startTimeValue = sponsoredEvent?.startTime
                    ? new Date(sponsoredEvent.startTime).toISOString()
                    : null;
                return {
                    userSponsoredEventId: record._id?.toString() ?? "",
                    eventName: sponsoredEvent?.name || "Unknown Event",
                    startTime,
                    startTimeValue,
                    house:
                        typeof record.house === "number"
                            ? record.house
                            : null,
                    tier:
                        typeof record.tier === "number"
                            ? record.tier
                            : null,
                    support:
                        typeof record.support === "number"
                            ? record.support
                            : null,
                    wcEarned:
                        typeof record.wcEarned === "number"
                            ? record.wcEarned
                            : null,
                    thousandsXpEarned:
                        typeof record.thousandsXpEarned === "number"
                            ? record.thousandsXpEarned
                            : null,
                    claimedOn: record.claimedOn
                        ? new Date(record.claimedOn).toISOString()
                        : null,
                    paidOn: record.paidOn
                        ? new Date(record.paidOn).toISOString()
                        : null,
                };
            });
        } catch (error) {
            console.error("Failed to load user sponsorships", error);
        }
    }

    try {
        const sponsoredEventRepository =
            diContainer.get<ISponsoredEventRepository>(
                "ISponsoredEventRepository"
            );
        const events = await sponsoredEventRepository.getSponsoredEvents();
        activeSponsoredEventId = getActiveSponsoredEventId(events);
    } catch (error) {
        console.error("Failed to load sponsored events", error);
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            connectedUserDBEmail: connectedUserDBEmail ?? "",
            connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            sponsorshipsStr: JSON.stringify(sponsorships),
            serverCode,
            activeSponsoredEventId,
        },
    };
};
