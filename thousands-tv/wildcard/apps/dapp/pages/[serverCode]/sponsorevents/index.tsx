import { GetServerSideProps } from "next";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { IUser, ISponsoredEvent } from "@repo/interfaces";
import {
    Box,
    Button,
    Flex,
    Heading,
    Stack,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import { diContainer } from "@/inversify.config";
import ISponsoredEventRepository from "@/repositories/interfaces/ISponsoredEventRepository";
import { useRouter } from "next/router";
import useLoadingWithRouter from "@/hooks/loadingStateManagement/useLoadingWithRouter";
import Link from "next/link";
import { FiArrowLeft, FiExternalLink, FiList } from "react-icons/fi";
import SponsoredEvents from "@/components/sponsoredEvents";

interface SponsoredEventsPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    sponsoredEventsStr: string;
    serverCode: string;
}

type SponsoredEventRow = Pick<
    ISponsoredEvent,
    "name" | "startTime" | "sponsorLockTime"
> & { _id: string };

const SponsoredEventsPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    sponsoredEventsStr,
    serverCode,
}: SponsoredEventsPageProps) => {
    const userDB = userDBStr ? (JSON.parse(userDBStr) as IUser) : null;
    let sponsoredEvents: SponsoredEventRow[] = [];
    if (sponsoredEventsStr) {
        try {
            sponsoredEvents = JSON.parse(sponsoredEventsStr) as SponsoredEventRow[];
        } catch (error) {
            console.error("Failed to parse sponsored events", error);
        }
    }
    const router = useRouter();
    const { startLoading } = useLoadingWithRouter();

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

    const handleNavigate = (sponsoredEventId: string) => {
        startLoading();
        router.push(`/${serverCode}/sponsorevents/${sponsoredEventId}`);
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
                pt="40px"
                pb={{ base: 10, md: 14 }}
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
                                Upcoming Events
                            </Heading>
                            <Text color="whiteAlpha.800" mt={3}>
                                Upcoming sponsorship opportunities.
                            </Text>
                        </Box>
                        <Flex align="center" gap={3}>
                            {/*
                            <Button
                                as={Link}
                                href={`/${serverCode}/sponsorevents/sponsorshipqueue`}
                                onClick={() => startLoading()}
                                aria-label="View Sponsorship Queue"
                                rightIcon={<FiList />}
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
                                Sponsorship Queue
                            </Button>
                            */}
                            <Button
                                as={Link}
                                href={`/${serverCode}/sponsorevents/mysponsorships`}
                                onClick={() => startLoading()}
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
                    </Flex>

                    <Box {...glassProps}>
                        <Heading
                            size="md"
                            mb={6}
                            color="white"
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                        >
                            Schedule
                        </Heading>
                        <Stack spacing={4}>
                            <SponsoredEvents
                                sponsoredEvents={sponsoredEvents}
                                onSelect={handleNavigate}
                            />
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </ThousandsLayout>
    );
};

export default SponsoredEventsPage;

export const getServerSideProps: GetServerSideProps<
    | SponsoredEventsPageProps
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

    let sponsoredEvents: SponsoredEventRow[] = [];
    try {
        const sponsoredEventRepository =
            diContainer.get<ISponsoredEventRepository>(
                "ISponsoredEventRepository"
            );
        const events = await sponsoredEventRepository.getSponsoredEvents();
        sponsoredEvents = events.map((event) => ({
            _id: event._id?.toString() ?? "",
            name: event.name,
            startTime: event.startTime,
            sponsorLockTime: event.sponsorLockTime,
        }));
    } catch (error) {
        console.error("Failed to load sponsored events", error);
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            connectedUserDBEmail: connectedUserDBEmail ?? "",
            connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            sponsoredEventsStr: JSON.stringify(sponsoredEvents),
            serverCode,
        },
    };
};
