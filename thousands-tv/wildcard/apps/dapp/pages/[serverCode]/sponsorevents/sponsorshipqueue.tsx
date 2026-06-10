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
    Heading,
    Stack,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { IUser } from "@repo/interfaces";
import useLoadingWithRouter from "@/hooks/loadingStateManagement/useLoadingWithRouter";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@chakra-ui/react";
import { shorten } from "@/utils/util";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";

type SponsorshipQueueEntry = {
    rank?: number | null;
    walletAddress?: string | null;
    displayName?: string | null;
    userId?: string | null;
};

interface SponsorshipQueuePageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    serverCode: string;
}

const SponsorshipQueuePage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    serverCode,
}: SponsorshipQueuePageProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    const { startLoading } = useLoadingWithRouter();
    const [queue, setQueue] = useState<SponsorshipQueueEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        let isMounted = true;
        const loadQueue = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/sponsorships/getSponsorshipQueue");
                const payload = await response.json();
                if (!response.ok || !payload?.success) {
                    throw new Error(payload?.err || "Failed to load queue");
                }
                if (isMounted) {
                    setQueue(payload?.data ?? []);
                }
            } catch (loadError: any) {
                console.error("Failed to load sponsorship queue", loadError);
                if (isMounted) {
                    setError(
                        loadError?.message || "Failed to load sponsorship queue"
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadQueue();

        return () => {
            isMounted = false;
        };
    }, []);
    const getDisplayName = (entry: SponsorshipQueueEntry) => {
        const displayName = entry.displayName?.trim();
        if (displayName) {
            return displayName;
        }
        if (entry.walletAddress) {
            return shorten(entry.walletAddress, { isAddress: true });
        }
        if (entry.userId) {
            return shorten(entry.userId, { length: 12 });
        }
        return "Unknown user";
    };

    const getWalletLabel = (entry: SponsorshipQueueEntry) => {
        if (entry.walletAddress) {
            return shorten(entry.walletAddress, { isAddress: true });
        }
        return "Missing wallet";
    };

    const queueWithFallbackRanks = useMemo(() => {
        return queue.map((entry, index) => ({
            ...entry,
            rank:
                entry.rank !== null && entry.rank !== undefined
                    ? entry.rank
                    : index + 1,
        }));
    }, [queue]);

    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            <Box minH="100vh" px={{ base: 4, md: 10 }} py={{ base: 10, md: 14 }}>
                <Stack spacing={8}>
                    <Button
                        as={Link}
                        href={`/${serverCode}/sponsorevents`}
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
                        Back to Sponsorships
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
                                Sponsorship Queue
                            </Heading>
                            <Text color="whiteAlpha.800" mt={3}>
                                The sponsorship queue displays the order that sponsorships will be processed.
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
                            Queue
                        </Heading>
                        {isLoading ? (
                            <Text color="whiteAlpha.800">Loading queue...</Text>
                        ) : error ? (
                            <Text color="red.300">{error}</Text>
                        ) : (
                            <Stack spacing={4}>
                                {queueWithFallbackRanks.map((entry, index) => (
                                    <Flex
                                        key={`${entry.userId || entry.walletAddress || "row"}-${index}`}
                                        align="center"
                                        justify="space-between"
                                        px={4}
                                        py={3}
                                        borderRadius="lg"
                                        bg="rgba(255,255,255,0.08)"
                                        border="1px solid"
                                        borderColor="rgba(255,255,255,0.1)"
                                    >
                                        <Flex align="center" gap={4}>
                                            <Box
                                                minW="54px"
                                                textAlign="center"
                                                fontWeight="bold"
                                                fontSize="lg"
                                                color="white"
                                            >
                                                #{entry.rank}
                                            </Box>
                                            <Avatar
                                                size="sm"
                                                src={Silhoutte.src}
                                                name={getDisplayName(entry)}
                                            />
                                            <Stack spacing={0}>
                                                <Text color="white" fontSize="md">
                                                    {getDisplayName(entry)}
                                                </Text>
                                                <Text
                                                    fontSize="sm"
                                                    color="whiteAlpha.700"
                                                >
                                                    Wallet: {getWalletLabel(entry)}
                                                </Text>
                                            </Stack>
                                        </Flex>
                                    </Flex>
                                ))}
                                {!queue.length && (
                                    <Text color="whiteAlpha.800">
                                        No sponsorships in the queue yet.
                                    </Text>
                                )}
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Box>
        </ThousandsLayout>
    );
};

export default SponsorshipQueuePage;

export const getServerSideProps: GetServerSideProps<
    | SponsorshipQueuePageProps
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

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    try {
        await connectToDb();
    } catch (error) {
        console.error("Failed to connect to db for sponsorship queue", error);
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            connectedUserDBEmail: connectedUserDBEmail ?? "",
            connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            serverCode,
        },
    };
};
