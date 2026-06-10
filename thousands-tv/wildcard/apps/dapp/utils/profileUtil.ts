import {
    authorizeUser,
    AuthorizedUserData,
    hasOnlySpectatorRoleAndClosedEnvironmentMode,
} from "@/utils/backend/sessionServerUtil";
import {
    ActivityItem,
    DiscordRole,
    IUser,
    PfpMetadata,
    Point,
    UserRole,
} from "@repo/interfaces";
import { GetServerSidePropsContext } from "next";
import connectToDb from "@/db/connectToDb";
import { OwnedNft } from "alchemy-sdk";
import { emptyPfp, emptyUser } from "@/constants/constants";
import {
    findBadgesByQuery,
    findGasExpendituresByQuery,
    findPointsByQuery,
    findSwagSetsByQuery,
    StageDoc,
    findStagesByQuery,
    countOfLeaderboardsByQuery,
    findUserLeaderboardPositions,
    findClaimedSwagSetsByWildfileId,
    ServerDoc,
} from "@repo/schemas";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtilWCA";
import axios from "axios";
import {
    fetchSwagPinsFromContract,
    fetchSwagWildpassesForUser,
} from "@/utils/backend/alchemyUtil";
import { getTotalPoints } from "@repo/utils";
import { handleRedirectFromCookies } from "@/utils/accountAPIUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { ShowdownDoc } from "@/db/schemas/showdownSchema";
import { getSortedUserActivityLogEntries } from "@/utils/backend/activityLogUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";
import {
    resolveServerCode,
    setUserServerPreferencesCookie,
    validateServerCode,
} from "./backend/accountsBackendUtil";
import Cookies from "cookies";

export interface WildfileIdPageProps {
    activityLogsStr: string;
    activeShowdowns: string;
    activeUserDB?: any;
    backendError?: string;
    badgesStr: string;
    claimedSwagSetsStr: string;
    connectedUserDBEmail?: string;
    connectedUserDBProviderId: string;
    eventsStr: string;
    favoritePfpsStr: string;
    gasExpenditureActivityItems: string;
    leaderboardsStr: string;
    leaderboardCountsStr: string;
    pageOwnerLeaderboardPositionsStr: string;
    pageOwnerUserDB: string;
    pfpStr: string;
    pointsStr: string;
    swagPinsStr: string;
    swagSetsStr: string;
    totalUniqueSwagPins: number;
    userDiscordEvents: string;
    userDiscordRoles: DiscordRole[];
    userLeaderboardEvents: string;
    wildpassesStr: string;
}

export const emptyUserResponse = (
    authorizedUserData: AuthorizedUserData,
    error?: string
): WildfileIdPageProps => {
    const { userDB, connectedUserDBProviderId, connectedUserDBEmail } =
        authorizedUserData;
    return {
        activityLogsStr: JSON.stringify([]),
        activeShowdowns: JSON.stringify([]),
        activeUserDB: JSON.stringify(userDB),
        backendError: error,
        badgesStr: JSON.stringify([]),
        claimedSwagSetsStr: JSON.stringify([]),
        connectedUserDBEmail: connectedUserDBEmail || "",
        connectedUserDBProviderId: connectedUserDBProviderId || "",
        eventsStr: JSON.stringify([]),
        favoritePfpsStr: JSON.stringify([]),
        gasExpenditureActivityItems: JSON.stringify([]),
        leaderboardCountsStr: JSON.stringify([]),
        leaderboardsStr: JSON.stringify([]),
        pageOwnerLeaderboardPositionsStr: JSON.stringify([]),
        pageOwnerUserDB: JSON.stringify(emptyUser),
        pfpStr: JSON.stringify(emptyPfp),
        pointsStr: JSON.stringify([]),
        swagPinsStr: JSON.stringify([]),
        swagSetsStr: JSON.stringify([]),
        totalUniqueSwagPins: -1,
        userDiscordEvents: JSON.stringify([]),
        userDiscordRoles: [],
        userLeaderboardEvents: JSON.stringify([]),
        wildpassesStr: JSON.stringify([]),
    };
};
interface UserAuthorizedPageResponse {
    success: boolean;
    data:
        | { redirect: { destination: string; permanent: boolean } }
        | AuthorizedUserData;
}

export async function checkUserAuthorizedForPage(
    context: GetServerSidePropsContext
): Promise<UserAuthorizedPageResponse> {
    const startTime = Date.now();
    console.log("[PERF] checkUserAuthorizedForPage - START");
    
    const authStartTime = Date.now();
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );
    console.log(`[PERF] authorizeUser took: ${Date.now() - authStartTime}ms`);

    const serverCode = resolveServerCode(context);
    const validateStartTime = Date.now();
    const serverDoc = await validateServerCode(serverCode as string);
    console.log(`[PERF] validateServerCode took: ${Date.now() - validateStartTime}ms`);
    if (!serverDoc) {
        return {
            success: false,
            data: {
                redirect: {
                    destination: WILDFILE_ROUTES.UNAUTHORIZED.url,
                    permanent: false,
                },
            },
        };
    }

    // Set user preferences cookie
    const cookies = new Cookies(context.req, context.res);
    setUserServerPreferencesCookie(serverDoc, cookies);

    if (!authorizedUserData) {
        const encodedRedirectUrl = encodeURIComponent(context.resolvedUrl);
        return {
            success: false,
            data: {
                redirect: {
                    destination: `${WILDFILE_ROUTES.LOGIN.url}?redirectUrl=${encodedRedirectUrl}`,
                    permanent: false,
                },
            },
        };
    }

    //Set the server information
    authorizedUserData.serverDoc = serverDoc;

    const { userDB, wildcardAccessToken, authUserRedirectUrl } =
        authorizedUserData;

    const isUserOnlySpectatorRoleAndClosedEnvironmentMode =
        hasOnlySpectatorRoleAndClosedEnvironmentMode(
            authorizedUserData.userDB?.roles,
            UserRole.SPECTATOR
        );

    // specifically for sign-up-confirmation page
    if (
        authUserRedirectUrl &&
        isUserOnlySpectatorRoleAndClosedEnvironmentMode
    ) {
        console.log(
            "Redirecting to sign-up-confirmation page from /wildfile route"
        );
        return {
            success: false,
            data: {
                redirect: {
                    destination: authUserRedirectUrl,
                    permanent: false,
                },
            },
        };
    }

    // Redirect the user if they are already in the cookies
    const redirectResult = handleRedirectFromCookies(context);
    if (redirectResult) {
        return {
            success: false,
            data: redirectResult,
        };
    }

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return {
            success: false,
            data: redirect,
        };
    }

    const result = {
        success: true,
        data: authorizedUserData,
    };
    
    console.log(`[PERF] checkUserAuthorizedForPage - TOTAL: ${Date.now() - startTime}ms`);
    return result;
}

/**
 * Checks if the user is not authorized for a closed environment.
 * Specifically, it checks if the user has only the spectator role and is in a closed environment mode,
 * and if the user's redirect URL is the sign-up confirmation URL.
 *
 * @param {AuthorizedUserData} authorizedUserData - The authorized user data.
 * @returns {boolean} - Returns true if the user is authorized for the closed environment, otherwise false.
 */
export function checkUserNotAuthorizedForClosedEnvironment(
    authorizedUserData: AuthorizedUserData
) {
    const isUserOnlySpectatorRoleAndClosedEnvironmentMode =
        hasOnlySpectatorRoleAndClosedEnvironmentMode(
            authorizedUserData.userDB?.roles,
            UserRole.SPECTATOR
        );

    return (
        authorizedUserData?.authUserRedirectUrl ===
            WILDFILE_ROUTES.SIGN_UP_CONFIRMATION.url &&
        isUserOnlySpectatorRoleAndClosedEnvironmentMode
    );
}

export async function getWildfilePageProps(
    userId: string,
    authorizedPageOwnerUser: IUser | null,
    publicPageOwnerUser: IUser | null,
    authorizedUserData: AuthorizedUserData
): Promise<WildfileIdPageProps> {
    const { userDB } = authorizedUserData;
    // =============== get Page Props ===============

    if (!publicPageOwnerUser || !authorizedPageOwnerUser) {
        return emptyUserResponse(
            authorizedUserData,
            `Unable to retrieve info for the provided page's User [${userId}]`
        );
    }

    try {
        await connectToDb();

        const userId = userDB?._id?.toString() || "";

        let activityLogs: any[] = [];
        let unsortedBadges: any[] = [];
        let claimedSwagSets: any[] = []; // TODOt check now
        let events: StageDoc[] = [];
        let leaderboardCounts: any[] = [];
        let leaderboards: any[] = [];
        let pageOwnerLeaderboardPositions: any[] = [];
        let pointsObj: any = {};
        let swagPinsFromContract: any[] = [];
        let swagSets: any[] = [];
        let userDiscordEvents: any[] = []; // Empty for non-wildfile owner
        let userLeaderboardEvents: any[] = []; // Empty for non-wildfile owner

        const activityLogsPromise = getSortedUserActivityLogEntries(userDB);
        const badgesPromise = findBadgesByQuery({});
        const claimedSwagSetsPromise = findClaimedSwagSetsByWildfileId(userId);
        const eventsPromise = findStagesByQuery({});
        const leaderboardCountsPromise = countOfLeaderboardsByQuery({
            isFrozen: { $ne: true },
        });
        const leaderboardsPromise = axios
            .get(`${getAPIEndpointRootUrl()}/api/fetchLeaderboards`)
            .then((res) => res.data.data);
        const pageOwnerLeaderboardPositionsPromise =
            findUserLeaderboardPositions(userId);
        const pointsObjPromise = findPointsByQuery({
            userId,
        });
        const swagPinsFromContractPromise = fetchSwagPinsFromContract();
        const swagSetsPromise = findSwagSetsByQuery({});
        // const userDiscordEventsPromise = getUserDiscordEvents(
        //     Number(pageWildfileId)
        // );
        // const userLeaderboardEventsPromise = getUserLeaderboardEvents(
        //     Number(pageWildfileId)
        // );

        [
            activityLogs,
            claimedSwagSets,
            events,
            leaderboardCounts,
            leaderboards,
            pageOwnerLeaderboardPositions,
            pointsObj,
            swagPinsFromContract,
            swagSets,
            unsortedBadges,
        ] = await Promise.all([
            activityLogsPromise,
            claimedSwagSetsPromise,
            eventsPromise,
            leaderboardCountsPromise,
            leaderboardsPromise,
            pageOwnerLeaderboardPositionsPromise,
            pointsObjPromise,
            swagPinsFromContractPromise,
            swagSetsPromise,
            badgesPromise,
        ]);

        const nftPointsArr = pointsObj?.nftPoints || [];
        const eventPointsArr = pointsObj?.eventPoints || [];
        const totalNftPoints = getTotalPoints(nftPointsArr);
        const totalEventPoints = getTotalPoints(eventPointsArr);
        const points: Point[] = [
            { label: "Nft", point: totalNftPoints },
            { label: "Event", point: totalEventPoints },
        ];

        // Sort in descending order so that owned badges come first
        let badges = unsortedBadges;

        // get the page owner's gas expenditures, to display user activity
        const gasExpenditures = await findGasExpendituresByQuery({
            userId,
        });

        const gasExpenditureActivityItems: ActivityItem[] = [];
        // const gasExpenditureActivityItems: ActivityItem[] = gasExpenditures
        //     .filter((ge) => ge?.wildevent) // Filter out entries without wildevent
        //     .map((ge) => {
        //         const wildevent = ge?.wildevent!;
        //         return {
        //             time: wildevent.time,
        //             txnHash: wildevent.txnHash,
        //             name: formatGasExpenditureName(ge.txnType),
        //         };
        //     });

        const userNftsPromise = fetchSwagWildpassesForUser(
            authorizedPageOwnerUser
        );

        // ----------------- Fetch User NFTs -----------------
        let favoritePfps: PfpMetadata[] = [];
        let pfp: PfpMetadata | undefined;
        let showdown: ShowdownDoc | null = null;
        let swagPins: OwnedNft[] = [];
        let userDiscordTopRoles: DiscordRole[] = [];
        let wildpasses: OwnedNft[] = [];

        const userDiscordRolesPromise = Promise.resolve({
            success: false,
            errMsg: "Unauthorized",
            roles: undefined,
        }); // resolve immediately to undefined roles if !showSocials

        const [userNfts, userDiscordRolesResp] = await Promise.all([
            userNftsPromise,
            userDiscordRolesPromise,
        ]);

        // get NFT's for all user's linked wallets
        swagPins = userNfts.swagPins;
        wildpasses = userNfts.wildpasses;

        if (userDiscordRolesResp.success && userDiscordRolesResp.roles) {
            userDiscordTopRoles = userDiscordRolesResp.roles;
        } else {
            console.log(
                "Did not fetch user discord roles ",
                userDiscordRolesResp.errMsg
            );
        }

        userDiscordTopRoles =
            userDiscordRolesResp.success && userDiscordRolesResp.roles
                ? userDiscordRolesResp.roles
                : [];

        favoritePfps =
            authorizedPageOwnerUser?.walletProvider?.favoritePfps || [];
        pfp = authorizedPageOwnerUser?.walletProvider?.pfp || emptyPfp;

        const isOwner = userDB?._id?.toString() === userId;
        // The page owner's visible user object
        let pageOwnerUser: IUser;

        // if the active user is the page owner, show them everything
        if (isOwner) {
            pageOwnerUser = authorizedPageOwnerUser;
        } else {
            pageOwnerUser = publicPageOwnerUser;
            // if the page owner has showLinkedSocials enabled, show the active user's linked socials

            if (authorizedPageOwnerUser?.preferences.showLinkedSocials) {
                // Initialize discordProvider if it doesn't exist
                if (!pageOwnerUser.discordProvider) {
                    pageOwnerUser.discordProvider = {
                        id: "",
                        name: "",
                        image: "",
                    };
                }

                // Now we are safe to assign properties since we know discordProvider exists
                if (authorizedPageOwnerUser.discordProvider) {
                    pageOwnerUser.discordProvider.id =
                        authorizedPageOwnerUser.discordProvider.id;
                    pageOwnerUser.discordProvider.name =
                        authorizedPageOwnerUser.discordProvider.name;
                    pageOwnerUser.discordProvider.image =
                        authorizedPageOwnerUser.discordProvider.image;

                    // Assuming more properties could be here, handled similarly
                }

                // Copy other social links in a similar guarded way
                if (pageOwnerUser.walletProvider?.wildfile) {
                    // Initialize sub-properties if necessary
                    if (!pageOwnerUser.twitchProvider) {
                        pageOwnerUser.twitchProvider = {
                            id: "",
                            name: "",
                            image: "",
                        };
                    }
                    if (!pageOwnerUser.twitchProvider) {
                        pageOwnerUser.twitchProvider = {
                            id: "",
                            name: "",
                            image: "",
                        };
                    }

                    // Safe to copy since we've ensured they are initialized
                    if (authorizedPageOwnerUser.twitchProvider) {
                        if (authorizedPageOwnerUser.twitchProvider) {
                            pageOwnerUser.twitchProvider = {
                                ...authorizedPageOwnerUser.twitchProvider,
                            };
                        }

                        pageOwnerUser.preferences.showLinkedSocials = true;
                    }
                }
            }
        }

        return {
            activityLogsStr: JSON.stringify(activityLogs),
            activeShowdowns: JSON.stringify(showdown),
            activeUserDB: JSON.stringify(authorizedUserData.userDB),
            badgesStr: JSON.stringify(badges),
            claimedSwagSetsStr: JSON.stringify(claimedSwagSets),
            connectedUserDBEmail: authorizedUserData.connectedUserDBEmail || "",
            connectedUserDBProviderId:
                authorizedUserData.connectedUserDBProviderId || "",
            eventsStr: JSON.stringify(events),
            favoritePfpsStr: JSON.stringify(favoritePfps),
            gasExpenditureActivityItems: JSON.stringify(
                gasExpenditureActivityItems
            ),
            leaderboardCountsStr: JSON.stringify(leaderboardCounts),
            leaderboardsStr: JSON.stringify(leaderboards),
            pageOwnerLeaderboardPositionsStr: JSON.stringify(
                pageOwnerLeaderboardPositions
            ),
            pageOwnerUserDB: JSON.stringify(pageOwnerUser),
            pfpStr: JSON.stringify(pfp),
            pointsStr: JSON.stringify(points),
            swagPinsStr: JSON.stringify(swagPins),
            swagSetsStr: JSON.stringify(swagSets),
            totalUniqueSwagPins: swagPinsFromContract.length,
            userDiscordEvents: JSON.stringify(userDiscordEvents),
            userDiscordRoles: userDiscordTopRoles,
            userLeaderboardEvents: JSON.stringify(userLeaderboardEvents),
            wildpassesStr: JSON.stringify(wildpasses),
        };
    } catch (e) {
        console.error("Error fetching wildfile page props:", e);
        return emptyUserResponse(
            authorizedUserData,
            "Error fetching wildfile page props"
        );
    }
}
