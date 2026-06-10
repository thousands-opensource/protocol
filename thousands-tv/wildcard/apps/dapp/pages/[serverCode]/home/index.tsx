import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    Stack,
    Tab,
    TabList,
    Tabs,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectIfNotLoggedIn } from "@/pages/[...params]";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { IUser } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import { diContainer } from "@/inversify.config";
import ISponsoredEventRepository from "@/repositories/interfaces/ISponsoredEventRepository";
import SponsoredEvents, {
    SponsoredEventRow,
} from "@/components/sponsoredEvents";
import { FranchiseEntry } from "@/components/franchiseIndexLeaderboard";
import FranchiseIndexLeaderboard from "@/components/franchiseIndexLeaderboard";
import {
    getFranchiseStartDate,
    isFranchisesAndSponsorshipsEnabled,
} from "@/utils/environmentUtilWCA";
import { LADDER_INDEX_LABELS } from "@/constants/ladderIndexes";
import { getActiveSponsoredEventId } from "@/utils/sponsoredEventUtil";
import { getFranchiseAssetMarketplaceUrl } from "@/utils/environmentUtilWCA";

interface HomePageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    sponsoredEventsStr: string;
    franchiseLeaderboardStr: string;
    showFranchisesAndSponsorships: boolean;
    serverCode: string;
    weekIndex: number;
    initialLadderIndex: number;
    activeSponsoredEventId: string | null;
}

const HomePage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    sponsoredEventsStr,
    franchiseLeaderboardStr,
    showFranchisesAndSponsorships,
    serverCode,
    weekIndex,
    initialLadderIndex,
    activeSponsoredEventId,
}: HomePageProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    const sponsoredEvents: SponsoredEventRow[] =
        showFranchisesAndSponsorships && sponsoredEventsStr
            ? JSON.parse(sponsoredEventsStr)
            : [];
    const franchiseLeaderboard: FranchiseEntry[] =
        showFranchisesAndSponsorships && franchiseLeaderboardStr
            ? JSON.parse(franchiseLeaderboardStr)
            : [];
    const [activeLadderIndex, setActiveLadderIndex] =
        useState(initialLadderIndex);
    const [ladderLeaderboard, setLadderLeaderboard] = useState(
        franchiseLeaderboard
    );
    const [isLoadingLadder, setIsLoadingLadder] = useState(false);

    const ladderTabs = useMemo(
        () =>
            Object.keys(LADDER_INDEX_LABELS)
                .map((key) => Number(key))
                .filter((value) => Number.isFinite(value))
                .sort((a, b) => a - b),
        []
    );
    const activeTabIndex = Math.max(
        0,
        ladderTabs.indexOf(activeLadderIndex)
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

    const myUserId = userDB?._id?.toString() ?? "";
    const ladderIndexLabel =
        LADDER_INDEX_LABELS[activeLadderIndex] ?? "Division";
    const franchiseAssetMarketplaceUrl = getFranchiseAssetMarketplaceUrl();

    useEffect(() => {
        if (!showFranchisesAndSponsorships || !myUserId) {
            return;
        }

        let isMounted = true;
        const fetchLadder = async () => {
            try {
                setIsLoadingLadder(true);
                const response = await fetch(
                    `/api/franchises/getFranchiseIndex/?myUserId=${myUserId}&limit=5&ladderIndex=${activeLadderIndex}`
                );
                if (!response.ok) {
                    return;
                }
                const json = await response.json();
                if (isMounted) {
                    setLadderLeaderboard(json?.data ?? []);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch franchise leaderboard",
                    error
                );
            } finally {
                if (isMounted) {
                    setIsLoadingLadder(false);
                }
            }
        };

        fetchLadder();

        return () => {
            isMounted = false;
        };
    }, [activeLadderIndex, myUserId, showFranchisesAndSponsorships]);

    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            {showFranchisesAndSponsorships && (
                <Flex
                    justify="space-between"
                    align="center"
                    gap={4}
                    px={4}
                    pt={{ base: 6, md: 8 }}
                    pb={{ base: 2, md: 4 }}
                >
                    <Flex gap={4} flexWrap="wrap">
                        <Button
                            as="a"
                            href={
                                activeSponsoredEventId
                                    ? `/${serverCode}/sponsorevents/${activeSponsoredEventId}`
                                    : `/${serverCode}/sponsorevents`
                            }
                            size="lg"
                            color="white"
                            bg="rgba(255,255,255,0.18)"
                            border="1px solid rgba(255,255,255,0.35)"
                            borderRadius="full"
                            _hover={{
                                bg: "rgba(255,255,255,0.28)",
                                transform: "translateY(-2px)",
                            }}
                        >
                            Sponsorships
                        </Button>
                        <Button
                            as="a"
                            href={`/${serverCode}/franchises`}
                            size="lg"
                            color="white"
                            bg="rgba(255,255,255,0.18)"
                            border="1px solid rgba(255,255,255,0.35)"
                            borderRadius="full"
                            _hover={{
                                bg: "rgba(255,255,255,0.28)",
                                transform: "translateY(-2px)",
                            }}
                        >
                            Franchises
                        </Button>
                        <Button
                            as="a"
                            href={`/${serverCode}/sponsorevents/mysponsorships`}
                            size="lg"
                            color="white"
                            bg="rgba(255,255,255,0.18)"
                            border="1px solid rgba(255,255,255,0.35)"
                            borderRadius="full"
                            _hover={{
                                bg: "rgba(255,255,255,0.28)",
                                transform: "translateY(-2px)",
                            }}
                        >
                            My Sponsorships
                        </Button>
                        <Button
                            as="a"
                            href={`/${serverCode}/franchises/${myUserId}`}
                            size="lg"
                            color="white"
                            bg="rgba(255,255,255,0.18)"
                            border="1px solid rgba(255,255,255,0.35)"
                            borderRadius="full"
                            _hover={{
                                bg: "rgba(255,255,255,0.28)",
                                transform: "translateY(-2px)",
                            }}
                            isDisabled={!myUserId}
                        >
                            My Franchise
                        </Button>
                    </Flex>
                    <Text color="whiteAlpha.900" fontWeight="bold">
                        WEEK {weekIndex}
                    </Text>
                </Flex>
            )}
            <Box id="home" w={["100%", "100%", "100%"]} p={4} pt={10}>
                {showFranchisesAndSponsorships ? (
                    <Stack spacing={0}>
                        <Box {...glassProps} color="white" mb={12}>
                        <Flex
                            align="center"
                            justify="space-between"
                            gap={4}
                            mb={6}
                        >
                            <Heading
                                size="md"
                                color="white"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                            >
                                Offer Ladder
                            </Heading>
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
                        </Flex>
                            <Tabs
                                index={activeTabIndex}
                                onChange={(nextIndex) =>
                                    setActiveLadderIndex(
                                        ladderTabs[nextIndex]
                                    )
                                }
                                variant="soft-rounded"
                                colorScheme="pink"
                                mb={6}
                            >
                                <TabList flexWrap="wrap" gap={2}>
                                    {ladderTabs.map((ladderIndex) => (
                                        <Tab
                                            key={ladderIndex}
                                            color="whiteAlpha.800"
                                            _selected={{
                                                color: "white",
                                                bg: "pink.500",
                                            }}
                                            _hover={{
                                                color: "whiteAlpha.900",
                                            }}
                                        >
                                            {LADDER_INDEX_LABELS[ladderIndex]}
                                        </Tab>
                                    ))}
                                </TabList>
                            </Tabs>
                            {isLoadingLadder && (
                                <Text color="whiteAlpha.700" mb={4}>
                                    Loading {ladderIndexLabel}...
                                </Text>
                            )}
                            <FranchiseIndexLeaderboard
                                leaderboard={ladderLeaderboard}
                                currentUserId={myUserId}
                                onSelect={(userId) => {
                                    window.location.href = `/${serverCode}/franchises/${userId}`;
                                }}
                                limit={5}
                                isLoading={isLoadingLadder}
                            />
                        </Box>
                        <Box {...glassProps} color="white">
                            <Heading
                                size="md"
                                mb={6}
                                color="white"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                            >
                                Sponsorship Opportunities
                            </Heading>
                            <SponsoredEvents
                                sponsoredEvents={sponsoredEvents}
                                onSelect={(sponsoredEventId) => {
                                    window.location.href = `/${serverCode}/sponsorevents/${sponsoredEventId}`;
                                }}
                                limit={5}
                            />
                        </Box>
                    </Stack>
                ) : (
                    <Box {...glassProps} color="white" textAlign="center">
                        <Text fontSize={{ base: "lg", md: "xl" }}>
                            We’re currently performing scheduled maintenance
                            and will be back shortly.
                        </Text>
                    </Box>
                )}
            </Box>
        </ThousandsLayout>
    );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps<
    HomePageProps | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

    if (!userAuthorizedForPageResult.success) {
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const redirectLoginResponse = redirectIfNotLoggedIn(context);
    if (redirectLoginResponse) {
        return redirectLoginResponse;
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;
    const { userDB } = authorizedUserData;

    const serverCodeParam = context.params?.serverCode;
    const serverCode = Array.isArray(serverCodeParam)
        ? serverCodeParam[0]
        : serverCodeParam || "thousands";

    await connectToDb();

    let sponsoredEventsStr = "[]";
    let activeSponsoredEventId: string | null = null;
    let franchiseLeaderboardStr = "[]";
    const showFranchisesAndSponsorships =
        isFranchisesAndSponsorshipsEnabled();

    if (showFranchisesAndSponsorships) {
        try {
            const sponsoredEventRepository =
                diContainer.get<ISponsoredEventRepository>(
                    "ISponsoredEventRepository"
                );
            const events = await sponsoredEventRepository.getSponsoredEvents();
            const now = Date.now();
            activeSponsoredEventId = getActiveSponsoredEventId(events, now);
            const serializedEvents = events.map((event) => ({
                _id: event._id?.toString() ?? "",
                name: event.name,
                startTime: event.startTime,
                sponsorLockTime: event.sponsorLockTime,
            }));
            sponsoredEventsStr = JSON.stringify(serializedEvents);
        } catch (error) {
            console.error("Failed to load sponsored events", error);
        }

        try {
            const userId = userDB?._id;
            const protocol =
                (context.req.headers["x-forwarded-proto"] as string) || "http";
            const host = context.req.headers.host;
            const baseUrl = `${protocol}://${host}`;

            const franchiseRes = await fetch(
                `${baseUrl}/api/franchises/getFranchiseIndex/?myUserId=${userId}&limit=5&ladderIndex=1`,
                {
                    headers: {
                        cookie: context.req.headers.cookie || "",
                    },
                }
            );

            if (franchiseRes.ok) {
                const json = await franchiseRes.json();
                franchiseLeaderboardStr = JSON.stringify(json?.data ?? []);
            }
        } catch (error) {
            console.error("Failed to fetch franchise leaderboard", error);
        }
    }

    const franchiseStartDate = getFranchiseStartDate();
    let weekIndex = 0;
    if (franchiseStartDate) {
        const startDate = new Date(franchiseStartDate);
        if (!Number.isNaN(startDate.getTime())) {
            const diffMs = Date.now() - startDate.getTime();
            const weekMs = 7 * 24 * 60 * 60 * 1000;
            weekIndex = Math.max(0, Math.floor(diffMs / weekMs));
        }
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            connectedUserDBEmail:
                authorizedUserData.connectedUserDBEmail ?? "",
            connectedUserDBProviderId:
                authorizedUserData.connectedUserDBProviderId ?? "",
            sponsoredEventsStr,
            franchiseLeaderboardStr,
            showFranchisesAndSponsorships,
            serverCode,
            weekIndex,
            initialLadderIndex: 1,
            activeSponsoredEventId,
        },
    };
};
