import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import connectToDb from "@/db/connectToDb";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
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
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { IUser } from "@repo/interfaces";
import router from "next/router";
import useLoadingWithRouter from "@/hooks/loadingStateManagement/useLoadingWithRouter";
import FranchiseIndexLeaderboard, {
    FranchiseEntry,
} from "@/components/franchiseIndexLeaderboard";
import { LADDER_INDEX_LABELS } from "@/constants/ladderIndexes";

interface FranchiseLeaderboardProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    leaderboard: FranchiseEntry[];
    serverCode: string;
    initialLadderIndex: number;
}

const FranchiseLeaderboardPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    leaderboard,
    serverCode,
    initialLadderIndex,
}: FranchiseLeaderboardProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    const { startLoading } = useLoadingWithRouter();
    const [activeLadderIndex, setActiveLadderIndex] =
        useState(initialLadderIndex);
    const [ladderLeaderboard, setLadderLeaderboard] = useState(leaderboard);
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

    const handleNavigate = (path: string) => {
        startLoading();
        router.push(path);
    };

    const myUserId = userDB?._id?.toString() ?? "";
    const myFranchisePath = `/${serverCode}/franchises/${myUserId}`;
    const ladderIndexLabel =
        LADDER_INDEX_LABELS[activeLadderIndex] ?? "Division";

    useEffect(() => {
        if (!myUserId) {
            return;
        }

        let isMounted = true;
        const fetchLadder = async () => {
            try {
                setIsLoadingLadder(true);
                const response = await fetch(
                    `/api/franchises/getFranchiseIndex/?myUserId=${myUserId}&limit=25&ladderIndex=${activeLadderIndex}`
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
    }, [activeLadderIndex, myUserId]);

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
                        href={`/${serverCode}`}
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
                        Back to Home
                    </Button>
                    <Flex
                        direction={{ base: "column", md: "row" }}
                        align={{ base: "flex-start", md: "center" }}
                        justify="space-between"
                        gap={4}
                    >
                        <Box textAlign={{ base: "left", md: "left" }} flex="1">
                            <Heading
                                size="2xl"
                                color="white"
                                textTransform="uppercase"
                                letterSpacing="0.1em"
                            >
                                Wildcard Franchises
                            </Heading>
                            <Text color="whiteAlpha.800" mt={3}>
                                Build a Franchise, manage your Roster, earn Thousands XP. Top franchises are eligible to receive USDC offers each week!
                            </Text>
                        </Box>
                        <Flex align="center" gap={3}>
                            <Button
                                as={Link}
                                href={myFranchisePath}
                                onClick={() => startLoading()}
                                aria-label="View My Franchise"
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
                                My Franchise
                            </Button>
                        </Flex>
                    </Flex>

                    <Box {...glassProps}>
                        <Heading
                            size="md"
                            mb={6}
                            color="white"
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                        >
                            Offer Ladder
                        </Heading>
                        <Tabs
                            index={activeTabIndex}
                            onChange={(nextIndex) =>
                                setActiveLadderIndex(ladderTabs[nextIndex])
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
                            onSelect={(userId) =>
                                handleNavigate(
                                    `/${serverCode}/franchises/${userId}`
                                )
                            }
                            isLoading={isLoadingLadder}
                        />
                    </Box>
                </Stack>
            </Box>
        </ThousandsLayout>
    );
};

export default FranchiseLeaderboardPage;

export const getServerSideProps: GetServerSideProps<
    | FranchiseLeaderboardProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const serverCodeParam = context.params?.serverCode;
    const serverCode = Array.isArray(serverCodeParam)
        ? serverCodeParam[0]
        : serverCodeParam || "thousands";
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
    const userId = userDB?._id ?? "";

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    let leaderboard: FranchiseEntry[] = [];
    const ladderIndexParam = context.query?.ladderIndex;
    const parsedLadderIndex = Array.isArray(ladderIndexParam)
        ? Number(ladderIndexParam[0])
        : Number(ladderIndexParam);
    const initialLadderIndex = Number.isFinite(parsedLadderIndex)
        ? parsedLadderIndex
        : 1;

    try {
        const protocol =
            (context.req.headers["x-forwarded-proto"] as string) || "http";
        const host = context.req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const franchiseRes = await fetch(
            `${baseUrl}/api/franchises/getFranchiseIndex/?myUserId=${userId}&limit=25&ladderIndex=${initialLadderIndex}`,
            {
                headers: {
                    cookie: context.req.headers.cookie || "",
                },
            }
        );

        if (franchiseRes.ok) {
            const json = await franchiseRes.json();
            leaderboard = json?.data ?? [];
        }
    } catch (error) {
        console.error("Failed to fetch franchise leaderboard", error);
    }

    try {
        await connectToDb();
    } catch (error) {
        console.error("Failed to connect to DB for franchise page", error);
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            connectedUserDBEmail: connectedUserDBEmail ?? "",
            connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            leaderboard,
            serverCode,
            initialLadderIndex,
        },
    };
};
