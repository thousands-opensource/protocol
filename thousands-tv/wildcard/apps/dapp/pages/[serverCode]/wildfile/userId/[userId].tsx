import React, { FC, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { OwnedNft } from "alchemy-sdk";
import UserWildFileProfile, {
    WildfileTabsEnum,
} from "@/features/Wildfile/WildFileProfile";
import { useToast } from "@chakra-ui/react";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import {
    ActivityLog,
    IStage,
    ILeaderboard,
    ILeaderBoardCount,
    ISwagSet,
    Point,
    UserLeaderboardPosition,
} from "@repo/interfaces";
import { useRouter } from "next/router";
import { useGlobalContext } from "@/contexts/globalContext";
import { toastDefaultOptions } from "@/constants/constants";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { ClaimedSwagSet, IBadge, IUser, PfpMetadata } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import {
    findOneUserByQueryAuthorized,
    findOneUserByQueryPublic,
} from "@repo/schemas";
import {
    checkUserAuthorizedForPage,
    getWildfilePageProps,
    WildfileIdPageProps,
} from "@/utils/profileUtil";
import { IShowdown, ShowdownEvent } from "@/db/schemas/showdownSchema";
import { middleware } from "@/middleware";

const WildfileIdPage: FC<WildfileIdPageProps> = ({
    activityLogsStr,
    pageOwnerUserDB,
    wildpassesStr,
    swagPinsStr,
    activeShowdowns,
    userDiscordRoles,
    userDiscordEvents,
    userLeaderboardEvents,
    backendError,
    gasExpenditureActivityItems,
    totalUniqueSwagPins,
    favoritePfpsStr,
    pfpStr,
    swagSetsStr,
    claimedSwagSetsStr,
    leaderboardsStr,
    pageOwnerLeaderboardPositionsStr,
    leaderboardCountsStr,
    badgesStr,
    activeUserDB,
    connectedUserDBProviderId,
    connectedUserDBEmail,
    eventsStr,
    pointsStr,
}) => {
    const router = useRouter();
    const toast = useToast();
    const { loggedIn, loggedInStatusInitialized, setLoadingSpinner } =
        useGlobalContext();

    // Get the tab from the URL
    const { tab } = router.query;

    const pageOwnerUserFormatted: IUser = JSON.parse(pageOwnerUserDB);
    const [pageOwnerUser, setPageOwnerUser] = useState<IUser>(
        pageOwnerUserFormatted
    );

    const favoritePfpsFormatted: PfpMetadata[] = JSON.parse(favoritePfpsStr);
    const pfpFormatted: PfpMetadata = JSON.parse(pfpStr);
    const wildpassesFormatted: OwnedNft[] = JSON.parse(wildpassesStr);
    const swagPinsFormatted: OwnedNft[] = JSON.parse(swagPinsStr);
    const swagSetsFormmatted: ISwagSet[] = JSON.parse(swagSetsStr);
    const claimedSwagSetsFormatted: ClaimedSwagSet[] =
        JSON.parse(claimedSwagSetsStr);
    const leaderboardsFormatted: ILeaderboard[] = JSON.parse(leaderboardsStr);
    const pageOwnerLeaderboardPositionsFormatted: UserLeaderboardPosition[] =
        JSON.parse(pageOwnerLeaderboardPositionsStr);
    const leaderboardCounts: ILeaderBoardCount[] =
        JSON.parse(leaderboardCountsStr);
    const badges: IBadge[] = JSON.parse(badgesStr);
    const activeUserDBParsed = JSON.parse(activeUserDB);
    const events: IStage[] = JSON.parse(eventsStr);
    const points: Point[] = JSON.parse(pointsStr);

    const activeShowdownFormatted: IShowdown | null =
        JSON.parse(activeShowdowns);
    const activeShowdownEvents = activeShowdownFormatted?.events || [];
    const upcomingShowdownEvents: ShowdownEvent[] = [];
    let currentShowdownEvent: ShowdownEvent | null = null;
    const pastShowdownEvents: ShowdownEvent[] = [];
    let userActivityServerSide: ActivityLog[] = JSON.parse(activityLogsStr);

    for (const event of activeShowdownEvents) {
        if (event.status === "scheduled") {
            upcomingShowdownEvents.push(event);
        } else if (event.status === "active") {
            currentShowdownEvent = event;
        } else if (event.status === "completed") {
            pastShowdownEvents.push(event);
        }
    }

    const [userActivity, setUserActivity] = useState<ActivityLog[]>(
        userActivityServerSide
    );
    const [claimedSwagSets, setClaimedSwagSets] = useState<ClaimedSwagSet[]>(
        claimedSwagSetsFormatted
    );
    const [leaderboards, setLeaderboards] = useState<ILeaderboard[]>(
        leaderboardsFormatted
    );
    const [favoritePfps, setFavoritePfps] = useState<PfpMetadata[]>(
        favoritePfpsFormatted
    );
    const [pfp, setPfp] = useState<PfpMetadata>(pfpFormatted);
    const [wildpasses, setWildpasses] =
        useState<OwnedNft[]>(wildpassesFormatted);
    const [swagPins, setSwagPins] = useState<OwnedNft[]>(swagPinsFormatted);
    const [activeWildfileTab, setActiveWildfileTab] = useState<number>(0);
    const [selectedBadge, setSelectedBadge] = useState<IBadge>(badges[0]);

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
    }, [backendError]);

    const tabStr = tab as WildfileTabsEnum;

    useEffect(() => {
        const wildfileTabIndex =
            Object.values(WildfileTabsEnum).indexOf(tabStr);
        if (wildfileTabIndex > 0 && wildfileTabIndex !== activeWildfileTab) {
            setActiveWildfileTab(wildfileTabIndex);
        }
    }, [tabStr]);

    return (
        <ProfileContext.Provider
            value={{
                setPageOwnerUser,
                pageOwnerUser,
                swagPins,
                wildpasses,
                userActivity,
                setUserActivity,
                pastShowdownEvents,
                upcomingShowdownEvents,
                currentShowdownEvent,
                activeShowdown: activeShowdownFormatted,
                userDiscordRoles,
                totalUniqueSwagPins,
                favoritePfps,
                setFavoritePfps,
                pfp,
                setPfp,
                swagSets: swagSetsFormmatted,
                setClaimedSwagSets,
                claimedSwagSets,
                setWildpasses,
                setSwagPins,
                setLeaderboards,
                leaderboards,
                pageOwnerLeaderboardPositions:
                    pageOwnerLeaderboardPositionsFormatted,
                leaderboardCounts,
                badges,
                setSelectedBadge,
                selectedBadge,
                setActiveWildfileTab,
                activeWildfileTab,
            }}
        >
            <UserWildFileProfile
                activeTab={activeWildfileTab}
                userDB={activeUserDBParsed}
                connectedUserDBProviderId={connectedUserDBProviderId}
                connectedUserDBEmail={connectedUserDBEmail || null}
                events={events}
                points={points}
            />
        </ProfileContext.Provider>
    );
};

// Gather all necessary data to populate the page for the viewing user
export const getServerSideProps: GetServerSideProps = async (context) => {
    const { userId } = context.query;

    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

    if (!userAuthorizedForPageResult.success) {
        // redirect the user if they are not authorized
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;

    await connectToDb();
    const query = { _id: userId };

    // get both authorized and public facing user from mongo
    const authorizePageOwnerUser = await findOneUserByQueryAuthorized(
        query
    ).catch((e: any) => {
        console.error(
            `Unable to fetch authorized user [${userId}] from backend database: `,
            e
        );

        return null;
    });

    const publicPageOwnerUser = await findOneUserByQueryPublic(query).catch(
        (e: any) => {
            console.error(
                `Unable to fetch public user [${userId}] from backend database: `,
                e
            );

            return null;
        }
    );

    const props = await getWildfilePageProps(
        String(userId),
        authorizePageOwnerUser,
        publicPageOwnerUser,
        authorizedUserData
    );

    return { props };
};

export { middleware };
export default WildfileIdPage;
