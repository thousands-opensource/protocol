import { Flex, useToast, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import router from "next/router";
import {
    mapErrorToMessage,
    getTwitchLoginRedirectUrl,
    getDiscordLoginRedirectUrl,
    getTwitchLoginRedirectToStreamerDashboardUrl,
} from "@/utils/accountsUtil";
import {
    authorizeUser,
    AuthorizedUserData,
} from "@/utils/backend/sessionServerUtil";
import WildfileAccountsFlowPopups from "@/features/Wildfile/WildFileProfile/WildfileAccountsFlowPopups";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import {
    AccountProvider,
    IUser,
} from "@repo/interfaces";
import { THEME_COLOR_BG_PRIMARY } from "@/constants";
import { findMatchingRoute } from "@/utils/backend/routeConfigUtil";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtilWCA";
import { findPointsByQuery } from "@repo/schemas";
import {
    linkBeamableAccountOnRegistrationOrSignUp,
    getExistingServerCodeFromCookie,
} from "@/utils/backend/accountsBackendUtil";
import { OFAC_WALLET_ADDRESSES } from "@/constants/ofacWalletAddresses";
import { serialize } from "cookie";
import Cookies from "cookies";
import connectToDb from "@/db/connectToDb";
import {
    COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
    COOKIES_ACCESS_TOKEN_WILDCARD,
    COOKIES_EMAIL,
    COOKIES_IS_LINKING_OUTH_WALLET,
    COOKIES_IS_LOGIN,
    COOKIES_IS_SIGN_UP,
    COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
    COOKIES_IS_TWITCH_LOGIN,
    COOKIES_IS_DISCORD_LOGIN,
    COOKIES_IS_TWITCH_STREAMER_LOGIN,
} from "@/utils/accountAPIUtil";

interface VerifyProps {
    accountData: any;
    findUser: any;
    setFindUser: any;
    userDB: any;
    connectedUserDBProviderId: any;
    connectedUserDBEmail: any;
    decodedToken: any;
    beamableUser: any;
    accessRules: string[];
    redirectUrl: string;
    followWildcardBool: boolean;
    roleElevated: boolean;
    accessDocElevatedRole: string[];
}

function Verify({
    userDB: userDBStringified,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    accessRules,
    redirectUrl,
    followWildcardBool,
    roleElevated,
    accessDocElevatedRole,
}: VerifyProps) {
    const {
        userDB,
        setUserDB,
        setConnectedUserDBProviderId,
        setConnectedUserDBEmail,
    } = useWildfileUserContext();
    const userDBTemp: IUser = JSON.parse(userDBStringified);

    const [showElevatedRoles, setShowElevatedRoles] = useState(false);
    const toast = useToast();

    // Use useEffect to update userDB in the global state when it changes
    useEffect(() => {
        setUserDB(userDBTemp);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
        setConnectedUserDBEmail(connectedUserDBEmail);
    }, []);

    // Display a notification if the user's role has been elevated
    useEffect(() => {
        if (roleElevated && accessDocElevatedRole?.length > 0) {
            setShowElevatedRoles(true);

            const timer = setTimeout(() => {
                setShowElevatedRoles(false);
                router.push(redirectUrl);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [roleElevated, accessDocElevatedRole]);

    // Display toast message based on the error query parameter
    useEffect(() => {
        const error = router.query.error;
        if (error) {
            toast({
                title: "Error",
                description: mapErrorToMessage(error),
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top",
            });
        }
    }, [router]);

    return (
        <>
            <Flex
                flexDirection="column"
                justifyContent="center"
                p="20px"
                bg={THEME_COLOR_BG_PRIMARY}
                h="100vh"
            >
                {showElevatedRoles ? (
                    <Text fontSize="lg" color="white.500" textAlign="center">
                        New role{accessDocElevatedRole.length > 1 ? "s" : ""}{" "}
                        applied: {accessDocElevatedRole.join(", ")}
                    </Text>
                ) : (
                    <WildfileAccountsFlowPopups
                        accessRules={accessRules}
                        redirectUrl={redirectUrl}
                        followWildcardBool={followWildcardBool}
                    />
                )}
            </Flex>
        </>
    );
}

export default Verify;
// check if user is authenticated and has a valid token if not return back to login page
// signed in OAuth user requires to get an access token to fully login to WC apis
export const getServerSideProps: GetServerSideProps = async (context) => {
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (!authorizedUserData) {
        console.log(
            "User not found. Redirecting to login page from /wildfile route"
        );
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const {
        userDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
        wildcardAccessToken,
        roleElevated,
        accessDocElevatedRole,
        authUserRedirectUrl,
    } = authorizedUserData;

    // consolidate and use: checkUserAuthorizedForPage
    if (authUserRedirectUrl) {
        console.log(
            "Redirecting to sign-up-confirmation page from /wildfile route"
        );
        return {
            redirect: {
                destination: authUserRedirectUrl,
                permanent: false,
            },
        };
    }

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );
    console.log("verify unauth redirect", redirect);
    if (redirect) {
        return redirect;
    }

    //Check for banned OFAC wallet adddress
    const primaryWalletAddress = userDB?.walletProvider?.address ?? "";
    if (OFAC_WALLET_ADDRESSES.includes(primaryWalletAddress)) {
        console.log(`OFAC_WALLET_ADDRESSES found: ${primaryWalletAddress}`);

        // Define a helper function to serialize and clear cookies
        const clearCookie = (name: string) =>
            serialize(name, "", {
                expires: new Date(0), // Set to expire immediately
                path: "/",
            });

        // Clear all cookies
        const cookiesToClear = [
            COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
            COOKIES_ACCESS_TOKEN_WILDCARD,
            COOKIES_EMAIL,
            COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
            COOKIES_IS_LINKING_OUTH_WALLET,
            COOKIES_IS_LOGIN,
            COOKIES_IS_SIGN_UP,
        ].map(clearCookie);

        // Set the cookie in the response header
        context.res.setHeader("Set-Cookie", cookiesToClear);

        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    // Find the matching route and get its access rules
    const currentPath = context.resolvedUrl;
    const matchingRoute = findMatchingRoute(currentPath);
    // const accessRules = matchingRoute?.accessRules || [];

    // get the redirect url ans access token and store in cookies

    const accessRules = context.query.unmetRule
        ? Array.isArray(context.query.unmetRule)
            ? context.query.unmetRule
            : [context.query.unmetRule]
        : [];

    // Check if this is a Twitch login
    const isTwitchLogin =
        context.req.cookies[COOKIES_IS_TWITCH_LOGIN] === "true";
    const isTwitchStreamerLogin =
        context.req.cookies[COOKIES_IS_TWITCH_STREAMER_LOGIN] === "true";
    // Check if this is a Discord login
    const isDiscordLogin =
        context.req.cookies[COOKIES_IS_DISCORD_LOGIN] === "true";
    let redirectUrlRoute = context.query.redirect || "/";

    console.log("[Verify] Initial redirectUrlRoute:", redirectUrlRoute);
    console.log("[Verify] Is Twitch login:", isTwitchLogin);
    console.log("[Verify] Is Discord login:", isDiscordLogin);
    console.log("[Verify] Query params:", context.query);
    console.log("user:", userDB);

    // If this is a Twitch login, override the redirect to user dashboard
    if (isTwitchLogin || isTwitchStreamerLogin) {
        // Get server code from cookie
        const cookies = new Cookies(context.req, context.res);
        const serverCode =
            getExistingServerCodeFromCookie(cookies).replace("/", "") ||
            "thousands";
        redirectUrlRoute = isTwitchStreamerLogin
            ? getTwitchLoginRedirectToStreamerDashboardUrl(serverCode)
            : getTwitchLoginRedirectUrl(serverCode);

        console.log("[Verify] Server code from cookie:", serverCode);
        console.log("[Verify] Twitch redirect URL:", redirectUrlRoute);

        // Clear the Twitch login cookie
        context.res.setHeader(
            "Set-Cookie",
            serialize(COOKIES_IS_TWITCH_LOGIN, "", {
                expires: new Date(0),
                path: "/",
            })
        );

        context.res.setHeader(
            "Set-Cookie",
            serialize(COOKIES_IS_TWITCH_STREAMER_LOGIN, "", {
                expires: new Date(0),
                path: "/",
            })
        );
    }

    // If this is a Discord login, override the redirect to user dashboard
    if (isDiscordLogin) {
        // Get server code from cookie
        const cookies = new Cookies(context.req, context.res);
        const serverCode =
            getExistingServerCodeFromCookie(cookies).replace("/", "") ||
            "thousands";
        redirectUrlRoute = getDiscordLoginRedirectUrl(serverCode);

        console.log("[Verify] Server code from cookie:", serverCode);
        console.log("[Verify] Discord redirect URL:", redirectUrlRoute);

        // Clear the Discord login cookie
        context.res.setHeader(
            "Set-Cookie",
            serialize(COOKIES_IS_DISCORD_LOGIN, "", {
                expires: new Date(0),
                path: "/",
            })
        );
    }

    // Keep the redirect URL as a relative path for Next.js router
    const redirectUrl = redirectUrlRoute;
    console.log("[Verify] Final redirectUrl:", redirectUrl);

    // Establish database connection before querying
    await connectToDb();

    // create a beamable account if the user does not have one (or reconcile/link existing account to the userDB)
    const beamableProvider: AccountProvider | undefined =
        userDB?.beamableProvider;

    if (!beamableProvider?.id) {
        if (!connectedUserDBProviderId) {
            console.log(
                "User does not have a connected provider. Redirecting to login page."
            );
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }

        // create a beamable account on the user's behalf
        await linkBeamableAccountOnRegistrationOrSignUp(
            userDB,
            connectedUserDBProviderId
        );
    }
    console.log("verify redirect", redirectUrl);

    try {
        return {
            props: {
                userDB: JSON.stringify(userDB),
                connectedUserDBProviderId,
                connectedUserDBEmail: connectedUserDBEmail || null,
                followWildcardBool: false,
                accessRules, // access rules required for the user to access the page
                redirectUrl,
                roleElevated,
                accessDocElevatedRole,
            },
        };
    } catch (e) {
        console.log("Failed to get beamable account", e);
        return {
            props: {},
        };
    }
};
