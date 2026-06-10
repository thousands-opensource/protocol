import React, { useEffect, useState } from "react";
import {
    Button,
    Box,
    Flex,
    Heading,
    Text,
    VStack,
    Spinner,
    Link,
} from "@chakra-ui/react";
// import { useAppContext } from "@/context/globalContext";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
// import { ROUTES } from "@/constants/routes";
// import { secondsToDate } from "@/utils";
import { GetServerSideProps } from "next";
import { WILDFILE_ROUTES } from "@/constants/routes";
// import { useAppContext } from "@/contexts/globalContextAccounts";

function BookingCard({ booking }: any) {
    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            my={4}
            minW="600px"
        >
            <Box p="6">
                <Flex alignItems="baseline">
                    <Heading
                        size="xl"
                        fontWeight="semibold"
                        lineHeight="tight"
                        isTruncated
                    >
                        {booking.name}
                    </Heading>
                </Flex>

                <Box>
                    Event ID: {booking.id}
                    <br />
                    Leaderboard ID: {booking.leaderboardId}
                    <br />
                    Running: {booking.running ? "Yes" : "No"}
                    <br />
                    {/* Seconds Remaining: {secondsToDate(booking.secondsRemaining)} */}
                </Box>

                <Flex mt="2" alignItems="center">
                    Current Phase: {booking.currentPhase.name}
                </Flex>

                {/* <Link href={`${ROUTES.DASHBOARD.EVENT.BASE}/${booking.id}`}>
                    <Flex mt="2" alignItems="center">
                        <Button colorScheme="teal" size="md">
                            View Details
                        </Button>
                    </Flex>
                </Link> */}
            </Box>
        </Box>
    );
}

function Bookings() {
    // const { userDetails, setUserDetails } = useAppContext();

    // const [isLoadingUserEvents, setIsLoadingUserEvents] =
    //     useState<boolean>(true);
    // const [allEventsData, setAllEventsData] = useState<Event[]>([]);
    // const [eventPlayersEvents, setEventPlayersEvents] =
    //     useState<EventPlayersEvents | null>(null);
    // const [isLoading, setIsLoading] = useState(true);
    // const [
    //     eventsWithScoreDuringSignUpState,
    //     setEventsWithScoreDuringSignUpState,
    // ] = useState<EventPlayer[]>([]);

    // const router = useRouter();
    // const params = useParams();

    // const eventPlayerObjectId = params && params.id ? params.id.toString() : "";

    // useEffect(() => {
    //     // Get the access token from localStorage
    //     const token = localStorage.getItem("accessToken");
    //     if (token) {
    //         fetchAccountDetails(token);
    //     }
    // }, []); // Empty dependency array means this effect will only run once, when the component mounts

    // /**
    //  * Asynchronous function to fetch account details.
    //  * GET request to the Beam API.
    //  * @param {string} token - The token used for authentication.
    //  */
    // const fetchAccountDetails = async (token: string) => {
    //     try {
    //         const response = await axios.get(`/api/beamable/fetch-account`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //         });
    //         setUserDetails(response.data);
    //     } catch (e) {
    //         console.log("failed to get beamable account", e);
    //     }
    // };

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const response = await axios.get("/api/beamable/calendar", {
    //                 params: {
    //                     from: "2024-04-03T18:00:30.45+01:00",
    //                     to: "2024-06-03T18:00:30.45+01:00",
    //                 },
    //             });
    //             setAllEventsData(response.data.eventInDateRange);
    //             console.log(
    //                 "response.data.eventInDateRange",
    //                 response.data.eventInDateRange
    //             );
    //         } catch (error) {
    //             console.error("Failed to fetch calendar data:", error);
    //         }
    //         setIsLoading(false);
    //     };

    //     fetchData();
    // }, [eventPlayerObjectId]);

    // useEffect(() => {
    //     const fetchEventPlayersEvents = async () => {
    //         try {
    //             setIsLoadingUserEvents(true);
    //             const response = await axios.get(
    //                 `/api/beamable/event-players/get?objectId=${eventPlayerObjectId}`
    //             );
    //             setEventPlayersEvents(response.data);
    //             setIsLoadingUserEvents(false);
    //         } catch (error) {
    //             console.error("Failed to fetch event players:", error);
    //         }
    //         setIsLoading(false);
    //         setIsLoadingUserEvents(false);
    //     };

    //     if (Array.isArray(eventPlayersEvents?.running)) {
    //         const eventsWithScoreDuringSignUp =
    //             eventPlayersEvents?.running.filter((event) => {
    //                 return (
    //                     event.score === 1 &&
    //                     event.currentPhase.name === "SignUp"
    //                 );
    //             });

    //         setEventsWithScoreDuringSignUpState(eventsWithScoreDuringSignUp);
    //         console.log(
    //             "eventsWithScoreDuringSignUps",
    //             eventsWithScoreDuringSignUp
    //         );
    //     }

    //     if (allEventsData.length > 0) {
    //         fetchEventPlayersEvents();
    //     }
    // }, [allEventsData]);

    // if (isLoadingUserEvents) {
    //     return (
    //         <Flex
    //             flexDirection={"column"}
    //             justifyContent={"center"}
    //             alignItems={"center"}
    //             gap="10px"
    //         >
    //             <Spinner />
    //             <Text>Loading Bookings..</Text>
    //         </Flex>
    //     );
    // }

    // if (!eventPlayersEvents?.running?.length) {
    //     return (
    //         <Flex
    //             flexDirection={"column"}
    //             justifyContent={"center"}
    //             alignItems={"center"}
    //             gap="10px"
    //         >
    //             <Text>No Signed Up Events Found</Text>
    //         </Flex>
    //     );
    // }

    return (
        <>
            <VStack spacing={4}>
                Bookings
                {/* {eventPlayersEvents?.running?.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                ))} */}
            </VStack>
        </>
    );
}

export default Bookings;

export const getServerSideProps: GetServerSideProps = async (context) => {
    return {
        redirect: {
            destination: WILDFILE_ROUTES.UNAUTHORIZED.url,
            permanent: false,
        },
    };
};
