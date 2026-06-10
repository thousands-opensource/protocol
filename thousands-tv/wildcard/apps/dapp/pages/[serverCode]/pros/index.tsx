import { useCallback, useEffect, useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import axios from "axios";
import { IPro, IUser } from "@repo/interfaces";
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Text,
    Flex,
    IconButton,
    HStack,
    Icon,
    Button,
    useToast,
    Divider,
} from "@chakra-ui/react";
import { FiRefreshCw } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";

interface ProsPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
}

interface ProWithDefinition extends IPro {
    name?: string;
    status?: string;
    earnings?: number;
    level?: number;
    trainingEndDateTime?: string | null;
    payoutAmount?: number | null;
    offerAccepted?: boolean | null;
}

const ProsPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
}: ProsPageProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    const [pros, setPros] = useState<ProWithDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentSimTime, setCurrentSimTime] = useState<number | null>(null);

    const userId = useMemo(() => userDB?._id || "", [userDB?._id]);
    const toast = useToast();

    const DAILY_RATE_PER_RARITY = 10;

    const fetchPros = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        setIsRefreshing(true);
        try {
            const response = await axios.get("/api/pros/getMyPros");
            const { pros: prosData, currentDateTime } = response.data || {};
            setPros(prosData || []);
            if (currentDateTime) {
                setCurrentSimTime(new Date(currentDateTime).getTime());
            } else {
                setCurrentSimTime(Date.now());
            }
        } catch (error) {
            console.error("Failed to fetch pros", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPros();
    }, [fetchPros]);

    useEffect(() => {
        if (currentSimTime === null) {
            return;
        }
        const interval = setInterval(() => {
            setCurrentSimTime((prev) => (prev !== null ? prev + 1000 : prev));
        }, 1000);
        return () => clearInterval(interval);
    }, [currentSimTime]);

    const formatCountdown = (ms: number) => {
        if (ms <= 0) {
            return "Ready";
        }
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600)
            .toString()
            .padStart(2, "0");
        const minutes = Math.floor((totalSeconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const seconds = Math.floor(totalSeconds % 60)
            .toString()
            .padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            <Box px={{ base: 4, md: 8 }} py={8}>
                <Flex
                    align="center"
                    justify="space-between"
                    flexWrap="wrap"
                    gap={6}
                    mb={6}
                >
                    <Heading size="lg" color="white">
                        My Pros
                    </Heading>
                    <Flex align="center" gap={4}>
                        <Box textAlign="right">
                            <Text
                                color="teal.200"
                                fontSize={{ base: "md", md: "lg" }}
                                fontWeight="extrabold"
                                lineHeight="shorter"
                            >
                                Total Earnings
                            </Text>
                            <Text
                                color="white"
                                fontSize={{ base: "2xl", md: "3xl" }}
                                fontWeight="black"
                            >
                                {(pros || []).reduce(
                                    (sum, pro) => sum + (pro.earnings || 0),
                                    0
                                ).toLocaleString()}
                            </Text>
                        </Box>
                        <IconButton
                            aria-label="Refresh pros"
                            icon={<FiRefreshCw />}
                            colorScheme="teal"
                            variant="outline"
                            onClick={fetchPros}
                            isLoading={isRefreshing}
                        />
                    </Flex>
                </Flex>
                {isLoading ? (
                    <Spinner size="lg" color="white" />
                ) : pros.length === 0 ? (
                    <Text color="white">You have no pros yet.</Text>
                ) : (
                    <Table variant="simple" color="white">
                        <Thead>
                            <Tr>
                                <Th color="white">Name</Th>
                                <Th color="white">Level</Th>
                                <Th color="white">Status</Th>
                                <Th color="white">Earnings</Th>
                                <Th color="white">Action</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {pros.map((pro) => (
                                <Tr key={pro._id?.toString()}>
                                    <Td>
                                        <Text>{pro.name || "Unknown"}</Text>
                                        {pro.rarity ? (
                                            <HStack spacing={1} fontSize="0.75em">
                                                {Array.from({
                                                    length: pro.rarity,
                                                }).map((_, index) => (
                                                    <Icon
                                                        as={AiFillStar}
                                                        color="gold"
                                                        key={index}
                                                    />
                                                ))}
                                            </HStack>
                                        ) : (
                                            "-"
                                        )}
                                    </Td>
                                    <Td>{pro.status === "Training" ? (pro.level ?? 1) - 1 : pro.level ?? "-"}</Td>
                                    <Td>
                                        {pro.offerAccepted
                                            ? "Offer Accepted"
                                            : pro.status}
                                    </Td>
                                    <Td>
                                        {pro.offerAccepted ? null : pro.status === "Training" &&
                                        pro.trainingEndDateTime &&
                                        currentSimTime !== null ? (
                                            <Box>
                                                <Text fontSize="20px" fontWeight="bold">
                                                    {formatCountdown(
                                                        new Date(
                                                            pro.trainingEndDateTime
                                                        ).getTime() -
                                                            currentSimTime
                                                    )}
                                                </Text>
                                                <Text fontSize="12px" color="gray.300">
                                                    until training is complete
                                                </Text>
                                            </Box>
                                        ) : pro.rarity ? (
                                            `${(pro.rarity || 0) * DAILY_RATE_PER_RARITY * (pro.level ?? 1)} / Day`
                                        ) : (
                                            "-"
                                        )}
                                    </Td>
                                    <Td>
                                        {pro.offerAccepted ? null : (
                                        <HStack spacing={3}>
                                            {pro.status === "Training" ? (
                                                <Box minH="32px" />
                                            ) : (
                                                <Button
                                                    colorScheme="teal"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (!pro._id) {
                                                            return;
                                                        }
                                                        try {
                                                            await axios.post(
                                                                "/api/pros/upgradePro",
                                                                {
                                                                    proId: pro._id,
                                                                    startingLevel:
                                                                        pro.level ?? 1,
                                                                }
                                                            );
                                                            toast({
                                                                title: "Training started...",
                                                                status: "success",
                                                                duration: 3000,
                                                                isClosable: true,
                                                            });
                                                            fetchPros();
                                                        } catch (error: any) {
                                                            toast({
                                                                title:
                                                                    error?.response
                                                                        ?.data
                                                                        ?.message ||
                                                                    "Failed to start training",
                                                                status: "error",
                                                                duration: 3000,
                                                                isClosable: true,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {`Train (${(pro.level || 1) * 100})`}
                                                </Button>
                                            )}
                                            {pro.status !== "Training" &&
                                            pro.payoutAmount ? (
                                                <Button
                                                    colorScheme="pink"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={async () => {
                                                        if (!pro._id) {
                                                            return;
                                                        }
                                                        try {
                                                            await axios.post(
                                                                "/api/pros/acceptOffer",
                                                                { proId: pro._id }
                                                            );
                                                            toast({
                                                                title: "Offer accepted",
                                                                status: "success",
                                                                duration: 3000,
                                                                isClosable: true,
                                                            });
                                                            fetchPros();
                                                        } catch (error: any) {
                                                            toast({
                                                                title:
                                                                    error?.response
                                                                        ?.data
                                                                        ?.message ||
                                                                    "Failed to accept offer",
                                                                status: "error",
                                                                duration: 3000,
                                                                isClosable: true,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {`Accept Offer for ${pro.payoutAmount}`}
                                                </Button>
                                            ) : null}
                                        </HStack>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Box>
            <Box px={{ base: 4, md: 8 }} pb={8}>
                <Divider borderColor="whiteAlpha.300" mb={4} />
                <Heading size="md" color="white" mb={3}>
                    Testing
                </Heading>
                <HStack spacing={4} flexWrap="wrap">
                    <Button
                        colorScheme="purple"
                        onClick={async () => {
                            try {
                                await axios.post(
                                    "/api/pros/testing/getSomePros"
                                );
                                toast({
                                    title: "Pros created",
                                    description:
                                        "Added a batch of random pros for testing.",
                                    status: "success",
                                    duration: 3000,
                                    isClosable: true,
                                });
                                fetchPros();
                            } catch (error: any) {
                                toast({
                                    title: "Failed to create pros",
                                    description:
                                        error?.response?.data?.message ||
                                        "Unexpected error",
                                    status: "error",
                                    duration: 3000,
                                    isClosable: true,
                                });
                            }
                        }}
                    >
                        Get some Pros
                    </Button>
                    <Button
                        colorScheme="orange"
                        onClick={async () => {
                            try {
                                await axios.post(
                                    "/api/pros/testing/advanceDay"
                                );
                                toast({
                                    title: "Day advanced",
                                    description:
                                        "Current test date moved forward by 24 hours.",
                                    status: "success",
                                    duration: 3000,
                                    isClosable: true,
                                });
                                fetchPros();
                            } catch (error: any) {
                                toast({
                                    title: "Failed to advance day",
                                    description:
                                        error?.response?.data?.message ||
                                        "Unexpected error",
                                    status: "error",
                                    duration: 3000,
                                    isClosable: true,
                                });
                            }
                        }}
                    >
                        Advance Day
                    </Button>
                </HStack>
            </Box>
        </ThousandsLayout>
    );
};

export default ProsPage;

export const getServerSideProps: GetServerSideProps<
    ProsPageProps | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const authorizedUserData: AuthorizedUserData | null =
        await authorizeUser(context);

    if (
        !authorizedUserData ||
        !authorizedUserData.wildcardAccessToken ||
        !authorizedUserData.userDB
    ) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const redirect = redirectUserIfUnauthorized(
        authorizedUserData.wildcardAccessToken,
        authorizedUserData.userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    return {
        props: {
            userDBStr: JSON.stringify(authorizedUserData.userDB),
            connectedUserDBEmail: authorizedUserData.connectedUserDBEmail || "",
            connectedUserDBProviderId:
                authorizedUserData.connectedUserDBProviderId || "",
        },
    };
};
