import React, { FC } from "react";
import { GetServerSideProps } from "next";
import { AccountProvider, IUser } from "@repo/interfaces";

import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { linkBeamableAccountOnRegistrationOrSignUp } from "@/utils/backend/accountsBackendUtil";
import { AccessRules, WILDFILE_ROUTES } from "@/constants/routes";
import { checkIfAtLeastOneSocialProviderIdExists } from "@/utils/accountsUtil";
import { findMatchingRoute } from "@/utils/backend/routeConfigUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";

interface ProfileRouterPageProps {}

const ProfileRouterPage: FC<ProfileRouterPageProps> = () => {
    return <></>;
};

/**
 * This asynchronous function retrieves the 'wildcardAccessToken' from the cookies,
 * verifies the token, and then routes the request to the correct profile page.
 * If the token is not valid or not found, it redirects the request to the login page.
 *
 * @param {NextRequest} req - The request object.
 * @param {IUser} user - user object
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object.
 * If the token is not valid or not found, it redirects to the login page.
 * Otherwise, it redirects to the correct profile page.
 */
async function profilePageRouter(user: IUser | null, queryParams: string = "") {
    if (!user) {
        console.log("User does not exist. Redirecting to login page.");
        return `/login${queryParams}`;
    }

    // Redirect to the events page
    return WILDFILE_ROUTES.SERVER.HOMEPAGE.url;
}

export const getServerSideProps: GetServerSideProps<
    | ProfileRouterPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const { resolvedUrl } = context;

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
    const userDB: IUser | null = authorizedUserData?.userDB;

    const { query } = context;
    // Convert query object to query string to preserve during redirects
    const queryString = new URLSearchParams(query as any).toString();
    const formattedQueryParams = queryString ? `?${queryString}` : "";

    if (!authorizedUserData) {
        const errMsg = `User not found. Redirecting to login page from /wildfile route`;
        console.log(errMsg);

        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const {
        connectedUserDBProviderId: connectedProviderId,
        connectedUserDBEmail: userEmail,
        wildcardAccessToken,
    } = authorizedUserData;

    // Find the matching route and get its access rules
    const matchingRoute = findMatchingRoute(resolvedUrl);
    const accessRules = matchingRoute?.accessRules || [];

    const isUserEmailVerified = userDB?.beamableProvider?.isVerified || false;
    const isDisplayNameSet = !!userDB?.preferences.displayName;
    const isTwitterLinked = !!userDB?.twitterProvider?.id;
    const isAtLeastOneSocialIsConnected =
        checkIfAtLeastOneSocialProviderIdExists(userDB);
    const isLinkedWalletSet = !!userDB?.walletProvider?.address;

    const unmetRules: AccessRules[] = accessRules.filter((rule) => {
        switch (rule) {
            case AccessRules.REQUIRE_EMAIL:
                return !isUserEmailVerified;
            case AccessRules.REQUIRE_DISPLAY_NAME:
                return !isDisplayNameSet;
            case AccessRules.REQUIRE_TWITTER_LINKED:
                return !isTwitterLinked;
            case AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL:
                return !isAtLeastOneSocialIsConnected;
            case AccessRules.REQUIRE_LINKED_WALLET:
                return !isLinkedWalletSet;
            default:
                return false;
        }
    });

    if (unmetRules.length > 0) {
        const queryParams = new URLSearchParams();
        unmetRules.forEach((rule) => queryParams.append("unmetRule", rule));
        queryParams.append("redirect", resolvedUrl);

        return {
            redirect: {
                destination: `/verify?${queryParams.toString()}`,
                permanent: false,
            },
        };
    }

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );
    if (redirect) {
        return redirect;
    }

    const destination = await profilePageRouter(userDB, formattedQueryParams);

    // this should be applied to a specific route - crete a beamable account on the user before redirecting (if one does not exist)
    const beamableProvider: AccountProvider | undefined =
        userDB?.beamableProvider;

    if (!beamableProvider?.id) {
        if (!connectedProviderId) {
            console.log(
                "User does not have a connected provider. Redirecting to login page."
            );
            return {
                redirect: {
                    destination: destination,
                    permanent: false,
                },
            };
        }
        // create a beamable account on the user's behalf
        await linkBeamableAccountOnRegistrationOrSignUp(
            userDB,
            connectedProviderId
        );
    }

    return {
        redirect: {
            destination: destination,
            permanent: false,
        },
    };
};

export default ProfileRouterPage;
