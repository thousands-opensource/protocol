import React, { FC, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { Portal, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useGlobalContext } from "@/contexts/globalContext";
import { toastDefaultOptions } from "@/constants/constants";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import connectToDb from "@/db/connectToDb";
import {
    findOneFreeTicketByQuery,
    findOneUserByQueryPublic,
    IdentityDoc,
} from "@repo/schemas";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import Event from "@/features/Event";
import {
    getAPIEndpointRootUrl,
    isFranchisesAndSponsorshipsEnabled,
} from "@/utils/environmentUtilWCA";
import axios from "axios";
import {
    IEvent,
    IRecognitionProgram,
    ISeries,
    IServer,
    IStage,
} from "@repo/interfaces";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import { diContainer } from "@/inversify.config";
import ISponsoredEventRepository from "@/repositories/interfaces/ISponsoredEventRepository";
import { SponsoredEventRow } from "@/components/sponsoredEvents";
import { FranchiseEntry } from "@/components/franchiseIndexLeaderboard";

import { EventsToStages, SeriesToEvents } from "@/types";
import { redirectIfNotLoggedIn } from "@/pages/[...params]";

import { claimTicketAndRedirectToStreamPage } from "@/utils/backend/accountsBackendUtil";
import { sortComparable } from "@/utils/util";
import IRecognitionProgramRepository from "@/repositories/interfaces/IRecognitionProgramRepository";
import { useBuyCreditsStore } from "@/store/useBuyCreditsStore";
import IIdentityRepository from "@/repositories/interfaces/IIdentityRepository";

interface EventIdPageProps {
    userDB: string;
    isUserLoggedIn: boolean;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    pageOwnerUserDB: string;
    activeUserDB?: any;
    backendError?: string;
    backendInfoMessage?: string;
    eventId: string;
    hasBeenRipped: boolean;
    hasBeenClaimed: boolean;
    userStr: string;
    error?: string;
    selectedEvent?: string;
    liveStageEventsStr: string;
    serverDocStr: string;
    recognitionProgramStr: string;
    recognitionProgramTabsStr: string;
    identitiesStr: string;
    sponsoredEventsStr: string;
    franchiseLeaderboardStr: string;
    showFranchisesAndSponsorships: boolean;
}

const EventIdPage: FC<EventIdPageProps> = ({
    userDB,
    isUserLoggedIn,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    pageOwnerUserDB,
    activeUserDB,
    backendError,
    backendInfoMessage,
    eventId,
    userStr,
    hasBeenRipped,
    hasBeenClaimed,
    error,
    selectedEvent,
    serverDocStr,
    recognitionProgramStr,
    recognitionProgramTabsStr,
    identitiesStr,
    sponsoredEventsStr,
    franchiseLeaderboardStr,
    showFranchisesAndSponsorships,
}) => {
    const router = useRouter();
    const toast = useToast();
    const { loggedIn, loggedInStatusInitialized, setLoadingSpinner } =
        useGlobalContext();
    const [hasRipped, setHasRipped] = useState<boolean>(hasBeenRipped);
    const { setBuyCreditsPopupOpen } = useBuyCreditsStore();

    const formattedRecognitionProgram = JSON.parse(recognitionProgramStr);
    const formattedRecognitionProgramTabs = JSON.parse(
        recognitionProgramTabsStr
    );

    /** Server, Series, Events, Stages */
    // @todo put it in server side
    const serverDoc: IServer = JSON.parse(serverDocStr);
    const seriesArr: ISeries[] = serverDoc.series
        ? serverDoc.series.sort(sortComparable)
        : [];
    const stagesArr: IStage[] = serverDoc?.stages
        ? serverDoc.stages.sort(sortComparable)
        : [];
    const eventsArr: IEvent[] = serverDoc?.events
        ? serverDoc.events.sort(sortComparable)
        : [];

    const identities: IdentityDoc[] = JSON.parse(identitiesStr);
    const sponsoredEvents: SponsoredEventRow[] = sponsoredEventsStr
        ? JSON.parse(sponsoredEventsStr)
        : [];
    const franchiseLeaderboard: FranchiseEntry[] = franchiseLeaderboardStr
        ? JSON.parse(franchiseLeaderboardStr)
        : [];

    // Create a mapping of series to stages for now
    const eventsToStages: EventsToStages[] = eventsArr.map((e: IEvent) => {
        return {
            ...e,
            stages: stagesArr.filter((stage) => stage?.eventId === e._id),
        };
    });
    const seriesToEvents: SeriesToEvents[] = seriesArr.map(
        (series: ISeries) => {
            return {
                ...series,
                id: series!._id!.toString(),
                events: eventsToStages.filter(
                    (ets) => ets.seriesId === series._id
                ),
            };
        }
    );

    let activeUserDBParsed = null;

    if (activeUserDB) {
        activeUserDBParsed = JSON.parse(activeUserDB);
    }

    useEffect(() => {
        if (router.query.action === "creditsPurchase") {
            setBuyCreditsPopupOpen(true);
        }
    }, []);

    // Reload the page when loggedIn status changes via explicit user action
    // must use loggedInStatusInitialized so that we know loggedIn's "change" wasn't just from it being initialized
    useEffect(() => {
        // redirects from index page will have a "reload=false" query param
        const { reload } = router.query;
        if (loggedInStatusInitialized && reload != "false") {
            setLoadingSpinner(true);
            router.reload();
        }
    }, [loggedIn]); // !IMPORTANT: This useEffect should only contain "loggedIn" var in dependency array

    useEffect(() => {
        if (backendError) {
            toast({
                ...toastDefaultOptions,
                description: backendError,
                status: "error",
                duration: null,
            });
        }

        // @dev - display UX friendly message to the frontend
        if (backendInfoMessage) {
            toast({
                title: "Info:",
                description: backendInfoMessage,
                status: "info",
                duration: 9000,
                isClosable: true,
                position: "bottom",
                id: "info-toast",
            });
        }
    }, [backendError, backendInfoMessage]);

    return (
        <Event
            userDB={activeUserDBParsed}
            identities={identities}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail || null}
            stages={stagesArr}
            selectedEvent={selectedEvent || null}
            seriesToEvents={seriesToEvents}
            formattedRecognitionProgram={formattedRecognitionProgram}
            formattedRecognitionProgramTabs={formattedRecognitionProgramTabs}
            serverCode={serverDoc.serverCode}
            serverId={serverDoc._id.toString()}
            serverName={serverDoc.serverName}
            sponsoredEvents={sponsoredEvents}
            franchiseLeaderboard={franchiseLeaderboard}
            showFranchisesAndSponsorships={showFranchisesAndSponsorships}
        />
    );
};

// Gather all necessary data to populate the page for the viewing user
export const getServerSideProps: GetServerSideProps = async (context) => {
    const totalStartTime = Date.now();
    const eventId = context.params?.id as string;
    const { accessCode } = context.query;
    console.log(`[PERF] Events getServerSideProps - START for eventId: ${eventId}`);

    try {
        const authCheckStart = Date.now();
        const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
            context
        );
        console.log(`[PERF] checkUserAuthorizedForPage took: ${Date.now() - authCheckStart}ms`);

        if (!userAuthorizedForPageResult.success) {
            // redirect the user if they are not authorized
            return userAuthorizedForPageResult.data as {
                redirect: { destination: string; permanent: boolean };
            };
        }

        // Redirect users to login page with encoded redirect URL if they are not logged in
        const redirectLoginResponse = redirectIfNotLoggedIn(context);
        if (redirectLoginResponse) {
            return redirectLoginResponse;
        }

        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;
        const { wildcardAccessToken, userDB } = authorizedUserData;
        const userId = userDB?._id;
        const query = { _id: userId };

        const dbConnectStart = Date.now();
        await connectToDb();
        console.log(`[PERF] connectToDb took: ${Date.now() - dbConnectStart}ms`);

        let sponsoredEventsStr = "[]";
        try {
            const sponsoredEventRepository =
                diContainer.get<ISponsoredEventRepository>(
                    "ISponsoredEventRepository"
                );
            const events = await sponsoredEventRepository.getSponsoredEvents();
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

        let franchiseLeaderboardStr = "[]";
        try {
            const protocol =
                (context.req.headers["x-forwarded-proto"] as string) || "http";
            const host = context.req.headers.host;
            const baseUrl = `${protocol}://${host}`;

            const franchiseRes = await fetch(
                `${baseUrl}/api/franchises/getFranchiseIndex/?myUserId=${userId}&limit=5`,
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

        const userQueryStart = Date.now();
        const publicPageOwnerUser = await findOneUserByQueryPublic(query).catch(
            (e: any) => {
                console.error(
                    `Unable to fetch public user [${userId}] from backend database: `,
                    e
                );

                return null;
            }
        );
        console.log(`[PERF] findOneUserByQueryPublic took: ${Date.now() - userQueryStart}ms`);

        const polyWildpassRecognitionProgramId = "67223e04a6574fd99d12ffc2";
        const ethWildpassRecognitionProgramId = "67ae766de400b5645bded5b1";
        const recognitionProgramRepository: IRecognitionProgramRepository =
            diContainer.get("IRecognitionProgramRepository");

        const recognitionTabsStart = Date.now();
        const recognitionProgramTabs = await recognitionProgramRepository
            .getRecognitionProgramsInfo()
            .then((tabs) => {
                return tabs
                    ?.filter(
                        (tab) =>
                            tab?._id?.toString() !==
                            polyWildpassRecognitionProgramId
                    )
                    .reverse();
            });
        console.log(`[PERF] getRecognitionProgramsInfo took: ${Date.now() - recognitionTabsStart}ms`);
        console.log(recognitionProgramTabs, "tabs");

        const axiosCallStart = Date.now();
        const wildpassRecognitionProgramResult = await axios
            .get(
                `${getAPIEndpointRootUrl()}/api/accounts/profile/getrecognitionprogramprofile/${ethWildpassRecognitionProgramId}`,
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                    },
                }
            )
            .catch((e: any) => {
                console.error(
                    `Unable to fetch profile recognition program[${ethWildpassRecognitionProgramId}] from backend database`
                );
                return { data: { recognitionItems: [] } };
            });
        console.log(`[PERF] Recognition program axios call took: ${Date.now() - axiosCallStart}ms`);

        const wildpassRecognitionProgram =
            wildpassRecognitionProgramResult.data;

        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        const identityRepository = diContainer.get<IIdentityRepository>(
            "IIdentityRepository"
        );

        const identitiesQueryStart = Date.now();
        const identities = (await identityRepository.getIdentities()).filter(
            (x) => x.showAsTalent
        );
        console.log(`[PERF] getIdentities query took: ${Date.now() - identitiesQueryStart}ms`);

        // const currentseriesId = getCurrentSeriesId();
        //Get all events for a season
        // const events = await stageRepository.getEventsForSeason(
        //     currentseriesId
        // );

        // const liveStageEvents = events.filter(
        //     (e) => e.status === EventStatus.LIVE
        // );

        // show all events if no event id is found
        if (!eventId) {
            const errMsg = "No event id found";
            console.error(errMsg);
            console.log(`[PERF] Events getServerSideProps - TOTAL (no eventId): ${Date.now() - totalStartTime}ms`);
            return {
                props: {
                    userDB: JSON.stringify(authorizedUserData.userDB),
                    isUserLoggedIn: !!authorizedUserData?.userDB?._id,
                    connectedUserDBEmail:
                        authorizedUserData.connectedUserDBEmail,
                    connectedUserDBProviderId:
                        authorizedUserData.connectedUserDBProviderId,
                    pageOwnerUserDB: JSON.stringify(publicPageOwnerUser),
                    activeUserDB: JSON.stringify(authorizedUserData.userDB),
                    eventId: "",
                    userStr: JSON.stringify(userDB),
                    hasBeenRipped: false,
                    hasBeenClaimed: false,
                    error: errMsg,
                    serverDocStr: JSON.stringify(authorizedUserData.serverDoc),
                    recognitionProgramStr: JSON.stringify(
                        wildpassRecognitionProgram
                    ),
                    recognitionProgramTabsStr: JSON.stringify(
                        recognitionProgramTabs
                    ),
                    identitiesStr: JSON.stringify(identities),
                    sponsoredEventsStr,
                    franchiseLeaderboardStr,
                    showFranchisesAndSponsorships:
                        isFranchisesAndSponsorshipsEnabled(),
                },
            };
        }

        // fetch event for the event id
        const stageQueryStart = Date.now();
        const stage = await stageRepository.getStage(eventId);
        console.log(`[PERF] getStage query took: ${Date.now() - stageQueryStart}ms`);
        const beamableEventId = stage?.beamableEventId;

        if (!stage) {
            const errMsg = "No stage found in the db";
            console.error(errMsg);
            console.log(`[PERF] Events getServerSideProps - TOTAL (no stage): ${Date.now() - totalStartTime}ms`);
            return {
                props: {
                    userDB: JSON.stringify(authorizedUserData.userDB),
                    isUserLoggedIn: !!authorizedUserData?.userDB?._id,
                    connectedUserDBEmail:
                        authorizedUserData.connectedUserDBEmail,
                    connectedUserDBProviderId:
                        authorizedUserData.connectedUserDBProviderId,
                    pageOwnerUserDB: JSON.stringify(publicPageOwnerUser),
                    activeUserDB: JSON.stringify(authorizedUserData.userDB),
                    eventId,
                    userStr: JSON.stringify(userDB),
                    hasBeenRipped: false,
                    hasBeenClaimed: false,
                    error: errMsg,
                    serverDocStr: JSON.stringify(authorizedUserData.serverDoc),
                    recognitionProgramStr: JSON.stringify(
                        wildpassRecognitionProgram
                    ),
                    recognitionProgramTabsStr: JSON.stringify(
                        recognitionProgramTabs
                    ),
                    identitiesStr: JSON.stringify(identities),
                    sponsoredEventsStr,
                    franchiseLeaderboardStr,
                    showFranchisesAndSponsorships:
                        isFranchisesAndSponsorshipsEnabled(),
                },
            };
        }

        const ticketQueryStart = Date.now();
        const existingTicket = await findOneFreeTicketByQuery({
            owner: userDB!._id,
        });
        console.log(`[PERF] findOneFreeTicketByQuery took: ${Date.now() - ticketQueryStart}ms`);

        let backendInfoMessage: string = "";
        const accessCodeViaQueryParams = context.query.accessCode as string;
        const serverCodeViaQueryParams = context.query.serverCode as string;

        // Claim ticker direct if user provide a direct link url
        if (userId && stage.seriesId && accessCode) {
            const claimTicketStart = Date.now();
            const result = await claimTicketAndRedirectToStreamPage(
                userId?.toString(),
                eventId,
                accessCodeViaQueryParams,
                stage?._id.toString(),
                serverCodeViaQueryParams
            );
            console.log(`[PERF] claimTicketAndRedirectToStreamPage took: ${Date.now() - claimTicketStart}ms`);
            if (result.redirect) {
                return result; // Redirect to stream page
            }
            // If there's an error message, handle it accordingly
            if (result.backendInfoMessage) {
                backendInfoMessage = result.backendInfoMessage;
            }
        }

        // given we load all the events when clicked we'll match the event id to the event
        if (eventId) {
            console.log("event found");

            const stringifyStart = Date.now();
            const props = {
                props: {
                    userDB: JSON.stringify(authorizedUserData.userDB),
                    isUserLoggedIn: !!authorizedUserData?.userDB?._id,
                    connectedUserDBEmail:
                        authorizedUserData.connectedUserDBEmail,
                    connectedUserDBProviderId:
                        authorizedUserData.connectedUserDBProviderId,
                    pageOwnerUserDB: JSON.stringify(publicPageOwnerUser),
                    activeUserDB: JSON.stringify(authorizedUserData.userDB),
                    eventId,
                    userStr: JSON.stringify(userDB),
                    hasBeenClaimed: !!existingTicket,
                    selectedEvent: stage ? JSON.stringify(stage) : null,
                    serverDocStr: JSON.stringify(authorizedUserData.serverDoc),
                    backendInfoMessage: backendInfoMessage,
                    recognitionProgramStr: JSON.stringify(
                        wildpassRecognitionProgram
                    ),
                    recognitionProgramTabsStr: JSON.stringify(
                        recognitionProgramTabs
                    ),
                    identitiesStr: JSON.stringify(identities),
                    sponsoredEventsStr,
                    franchiseLeaderboardStr,
                    showFranchisesAndSponsorships:
                        isFranchisesAndSponsorshipsEnabled(),
                },
            };
            console.log(`[PERF] JSON.stringify operations took: ${Date.now() - stringifyStart}ms`);

            // Log sizes of serialized data
            console.log(`[PERF] Data sizes:`);
            console.log(`  - serverDoc: ${(props.props.serverDocStr.length / 1024).toFixed(2)}KB`);
            console.log(`  - recognitionProgram: ${(props.props.recognitionProgramStr.length / 1024).toFixed(2)}KB`);
            console.log(`  - identities: ${(props.props.identitiesStr.length / 1024).toFixed(2)}KB`);

            console.log(`[PERF] Events getServerSideProps - TOTAL: ${Date.now() - totalStartTime}ms`);
            return props;
        }

        const stringifyStart = Date.now();
        const finalProps = {
            props: {
                userDB: JSON.stringify(authorizedUserData.userDB),
                isUserLoggedIn: !!authorizedUserData?.userDB?._id,
                connectedUserDBEmail: authorizedUserData.connectedUserDBEmail,
                connectedUserDBProviderId:
                    authorizedUserData.connectedUserDBProviderId,
                pageOwnerUserDB: JSON.stringify(publicPageOwnerUser),
                activeUserDB: JSON.stringify(authorizedUserData.userDB),
                eventId,
                userStr: JSON.stringify(userDB),
                hasBeenClaimed: !!existingTicket,
                serverDocStr: JSON.stringify(authorizedUserData.serverDoc),
                recognitionProgramStr: JSON.stringify(
                    wildpassRecognitionProgram
                ),
                recognitionProgramTabsStr: JSON.stringify(
                    recognitionProgramTabs
                ),
                identitiesStr: JSON.stringify(identities),
                sponsoredEventsStr,
                franchiseLeaderboardStr,
                showFranchisesAndSponsorships:
                    isFranchisesAndSponsorshipsEnabled(),
            },
        };
        console.log(`[PERF] Final JSON.stringify operations took: ${Date.now() - stringifyStart}ms`);

        // Log sizes of final serialized data
        console.log(`[PERF] Final data sizes:`);
        console.log(`  - serverDoc: ${(finalProps.props.serverDocStr.length / 1024).toFixed(2)}KB`);
        console.log(`  - recognitionProgram: ${(finalProps.props.recognitionProgramStr.length / 1024).toFixed(2)}KB`);
        console.log(`  - identities: ${(finalProps.props.identitiesStr.length / 1024).toFixed(2)}KB`);

        console.log(`[PERF] Events getServerSideProps - TOTAL (final return): ${Date.now() - totalStartTime}ms`);
        return finalProps;
    } catch (e) {
        const errMsg = "Failed to fetch live event";
        console.error("Failed to fetch live event", e);
        return {
            props: {
                userDB: "",
                isUserLoggedIn: false,
                connectedUserDBEmail: "",
                connectedUserDBProviderId: null,
                pageOwnerUserDB: "",
                activeUserDB: "",
                eventId: "",
                userStr: "",
                hasBeenRipped: false,
                hasBeenClaimed: false,
                error: errMsg,
                serverDocStr: "",
                recognitionProgramStr: "",
                recognitionProgramTabsStr: "",
                identitiesStr: "[]",
                sponsoredEventsStr: "[]",
                franchiseLeaderboardStr: "[]",
                showFranchisesAndSponsorships:
                    isFranchisesAndSponsorshipsEnabled(),
            },
        };
    }
};

export default EventIdPage;
