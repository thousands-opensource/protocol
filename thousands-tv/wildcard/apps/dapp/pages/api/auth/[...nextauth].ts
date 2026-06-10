import NextAuth, { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import TwitchProvider from "next-auth/providers/twitch";
import TwitterProvider from "next-auth/providers/twitter";
import { WildcardSessionTokenParams } from "./wildcard/token";
import {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next";
import { serialize } from "cookie";
import { AccountStatus, IUser } from "@repo/interfaces";
import {
    getNextAuthSecret,
    getNextAuthSessionExpirySeconds,
    getOAuthDiscordClientId,
    getOAuthDiscordClientSecret,
    getOAuthGoogleClientId,
    getOAuthGoogleClientSecret,
    getOAuthTwitchClientId,
    getOAuthTwitchClientSecret,
} from "@/utils/environmentUtilWCA";
import { findOneUserByQuery, UserDoc } from "@repo/schemas";
import {
    COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
    COOKIES_ACCESS_TOKEN_WILDCARD,
    COOKIES_EMAIL,
    COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
    COOKIES_IS_LINKING_OUTH_WALLET,
    COOKIES_IS_CONNECT_ACCOUNT,
    COOKIES_CONNECT_WALLET_EMAIL,
    COOKIES_CONNECTED_PROVIDER_ID,
} from "@/utils/accountAPIUtil";
import {
    AccountProviderParams,
    handleAuthFlow,
    handleLinkAdditionalProvider,
    handleLinkAdditionalProviderFromWallet,
    linkAccountToUser,
    searchAllProviderIdQuery,
} from "@/utils/backend/accountsBackendUtil";
import {
    User as NextAuthUserType,
    Account as NextAuthAccountType,
} from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";
import { createOrRefreshWildcardAccessToken } from "@/utils/accountsUtil";
import {
    getTwitterClientId,
    getTwitterClientSecret,
} from "@/utils/environmentUtil";
import establishMongoDBConnection from "@/db/establishMongoDBConnection";
import { randomBytes, randomUUID } from "crypto";

export interface ExtendedSession extends Session {
    accessToken: string;
    userDB: IUser;
    wildcardAccessToken: string;
    clearCookies?: boolean;
}

export interface ExtendedNextAuthUserType extends NextAuthUserType {
    isNewUser?: boolean;
}

export interface ExtendedNextAuthAccountType extends NextAuthAccountType {
    providerType?: string;
}

// Extended session object for NextAuth
interface ExtendedNextAuthSession extends Session {
    user: ExtendedNextAuthUserType;
    accessToken?: string; // Access token for OAuth
    wildcardAccessToken?: string; // Specific token used in your application
    connectedProviderId?: string; // ID for connected provider
    userDB?: IUser | null; // Detailed user information from the database
}

interface NextAuthSignInParams {
    user: ExtendedNextAuthUserType;
    account: any; // Account object, can be null
}

// extend NextAuthJWT
export interface NextAuthJWTExtended extends NextAuthJWT {
    accessToken?: string;
    wildcardAccessToken?: string;
    providerType?: string;
    exp?: number;
    userDB?: IUser | null;
    error?: string;
}

interface NextAuthJWTCallbackParams {
    token: NextAuthJWTExtended; // Token object to be returned by the callback
    user?: ExtendedNextAuthUserType; // User object, optional, available on sign in
    account?: any; // Account object from the OAuth provider, optional, available on sign in
    trigger?: string; // Triggering event, can be "signUp", "signIn", etc.
    session?: ExtendedNextAuthSession; // Session object, optional, available in session callback
}

// Define the parameters for the session callback
interface ExtendedSessionCallbackParams {
    session: ExtendedNextAuthSession; // Extended session object
    token: NextAuthJWT; // Extended token object
}

export const getNextAuthOptions = (
    req: NextApiRequest | GetServerSidePropsContext["req"],
    res: NextApiResponse | GetServerSidePropsContext["res"]
) => {
    //This controls the expiration of the NextAuth Session and the Wildcard Access Token in seconds
    const sessionExpirationSeconds = getNextAuthSessionExpirySeconds(); //24 * 60 * 60; //24 hours

    const authOptions: NextAuthOptions = {
        pages: {
            error: "/login", // Redirect errors to the login page
        },
        providers: [
            GoogleProvider({
                clientId: getOAuthGoogleClientId(),
                clientSecret: getOAuthGoogleClientSecret(),
                allowDangerousEmailAccountLinking: true,
                authorization: {
                    params: {
                        state: JSON.stringify({ linkAccount: true }),
                    },
                },
            }),
            DiscordProvider({
                clientId: getOAuthDiscordClientId(),
                clientSecret: getOAuthDiscordClientSecret(),
            }),
            TwitchProvider({
                clientId: getOAuthTwitchClientId(),
                clientSecret: getOAuthTwitchClientSecret(),
            }),
            TwitterProvider({
                clientId: getTwitterClientId(),
                clientSecret: getTwitterClientSecret(),
                version: "2.0",
            }),
        ],
        secret: getNextAuthSecret(),
        callbacks: {
            async redirect({ url, baseUrl }) {
                const parsedUrl = new URL(url, baseUrl);
                if (parsedUrl.searchParams.has("error")) {
                    const error = parsedUrl.searchParams.get("error");
                    if (error === "CustomError") {
                        return `${baseUrl}/error?error=${error}`;
                    }
                }

                if (url.startsWith("/")) return `${baseUrl}${url}`;
                else if (new URL(url).origin === baseUrl) return url;
                return baseUrl;
            },
            async signIn({ user, account }: NextAuthSignInParams) {
                await establishMongoDBConnection();

                if (
                    req?.cookies?.isConnectAccount &&
                    req?.cookies?.connectWalletEmail &&
                    req?.cookies?.connectedProviderId
                ) {
                    return await handleLinkAdditionalProvider(
                        user,
                        account,
                        req,
                        res
                    );
                }
                if (
                    req?.cookies?.isLinkingOAuthWallet &&
                    req?.cookies?.LinkingOAuthWalletAddress
                ) {
                    const accountLinking = JSON.parse(
                        req?.cookies?.isLinkingOAuthWallet
                    );
                    const walletAddress =
                        req?.cookies?.LinkingOAuthWalletAddress || "";

                    console.log(
                        `Attempting to link wallet ${walletAddress} to OAuth user ${user?.email} from account provider ${account?.provider}`
                    );

                    return await handleLinkAdditionalProviderFromWallet(
                        user,
                        account,
                        req,
                        res
                    );
                }
                // handles the login flow and creates a new user if it doesn't exist
                return await handleAuthFlow(user, account, req, res);
            },
            async jwt({
                token,
                user,
                account,
                trigger,
                session,
            }: NextAuthJWTCallbackParams) {
                console.log("session callback");

                if (trigger === "update" && session) {
                    // Validate the session
                    console.log("validate session callback");
                }
                if (account) {
                    if (!account.access_token) {
                        console.error(
                            "$$ Access token is undefined. Invalidating session."
                        );
                        throw new Error(
                            "Access token is undefined. Please sign in again."
                        );
                    }
                    token.accessToken = account.access_token;
                }
                if (user) {
                    try {
                        const oauthUserEmail = user?.email;

                        // Check if user already exists
                        const providerId = user?.id as string;

                        const query = searchAllProviderIdQuery(providerId);
                        let userDB: UserDoc | null = await findOneUserByQuery(
                            query
                        );

                        // Check if the user is suspended
                        if (
                            userDB &&
                            userDB.status === AccountStatus.SUSPENDED
                        ) {
                            token.error = "UserSuspended";
                        } else {
                            // Continue with regular token creation
                            token.userDB = userDB;
                            token.providerType = account?.provider;
                        }

                        token.userDB = userDB;
                        if (!userDB) {
                            console.log(
                                "User not found in DB, creating new user"
                            );
                            if (!account) {
                                throw new Error(
                                    "Account object is undefined. Unable to create new user."
                                );
                            }
                            if (!user?.id) {
                                throw new Error(
                                    "User ID is undefined. Unable to create new user."
                                );
                            }
                            const linkedAccount: AccountProviderParams = {
                                id: String(user?.id),
                                providerType: account.provider,
                                name: String(user?.name),
                                image: String(user?.image),
                                email: String(oauthUserEmail),
                            };
                            const newLinkedUserResponse =
                                await linkAccountToUser(linkedAccount);
                            if (!newLinkedUserResponse?.success) {
                                throw new Error(
                                    "Failed to link account to user"
                                );
                            }
                            // Update token with newly created user
                            token.userDB = newLinkedUserResponse.data;
                        }
                        const wildcardSessionTokenParams: WildcardSessionTokenParams =
                            {
                                accountProviderId: user.id,
                                accountProviderType: account.provider,
                            };

                        console.log(
                            `** 1 pre-createOrRefreshWildcardAccessToken : ${token.wildcardAccessToken}`
                        );
                        const wildcardAccessToken =
                            await createOrRefreshWildcardAccessToken(
                                wildcardSessionTokenParams,
                                token.accessToken as string
                            );
                        token.wildcardAccessToken = wildcardAccessToken;
                        console.log(
                            `** 1 post-createOrRefreshWildcardAccessToken : ${token.wildcardAccessToken}`
                        );
                        token.providerType = account.provider;
                        token.exp =
                            Math.floor(Date.now() / 1000) +
                            sessionExpirationSeconds;
                    } catch (error) {
                        throw new Error(
                            "Failed to obtain wildcard access token during JWT token creation. Please sign in again."
                        );
                    }
                }

                // Ensure the token is valid and not expired
                if (token.exp && Date.now() / 1000 > token.exp - 60 * 60) {
                    console.log(
                        `Token is about to expire. Refreshing the token...`
                    );
                    try {
                        const wildcardSessionTokenParams: WildcardSessionTokenParams =
                            {
                                accountProviderId: token.sub as string,
                                accountProviderType: token.providerType as any,
                            };

                        console.log(
                            `** 2 pre-createOrRefreshWildcardAccessToken : ${token.wildcardAccessToken}`
                        );
                        token.wildcardAccessToken =
                            await createOrRefreshWildcardAccessToken(
                                wildcardSessionTokenParams,
                                token.accessToken as string
                            );
                        // Update the expiration time
                        token.exp =
                            Math.floor(Date.now() / 1000) +
                            sessionExpirationSeconds;
                        token.error = undefined; // Clear any previous errors
                    } catch (error) {
                        console.error(
                            "Error refreshing wildcard access token:",
                            error
                        );
                        token.error = "RefreshAccessTokenError";
                    }
                }

                return token;
            },
            async session({ session, token }: any) {
                console.log("session callback");

                if (
                    token.error ||
                    !token.accessToken ||
                    !token.wildcardAccessToken
                ) {
                    session.clearCookies = true;
                    return null; // Invalidate session if there's an error or missing tokens
                }

                if (token.error === "UserSuspended") {
                    session.clearCookies = true;
                    return null;
                }

                // Define a buffer period (e.g., 5 minutes) to refresh the token before it expires
                //const bufferPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds

                const sessionExpires = session.expires;
                const isSessionExpired =
                    sessionExpires &&
                    new Date(sessionExpires).getTime() < Date.now();

                if (isSessionExpired) {
                    return null;
                }
                await establishMongoDBConnection();

                const providerId = token.sub as string;
                const query = searchAllProviderIdQuery(providerId);
                let refetchExistingUser: IUser | null =
                    await findOneUserByQuery(query);

                if (token) {
                    session.accessToken = token.accessToken;
                    session.userDB = refetchExistingUser;
                    session.connectedProviderId = providerId;
                }
                session.wildcardAccessToken = token.wildcardAccessToken;
                if (token.wildcardAccessToken && refetchExistingUser) {
                    const serializedLoginAccessTokenCookie = serialize(
                        COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
                        "",
                        {
                            maxAge: -1,
                            path: "/",
                        }
                    );
                    const serializedWildcardAccessTokenCookie = serialize(
                        COOKIES_ACCESS_TOKEN_WILDCARD,
                        refetchExistingUser ? token.wildcardAccessToken : "",
                        {
                            maxAge: sessionExpirationSeconds,
                            path: "/",
                        }
                    );

                    const serializedEmailCookie = serialize(COOKIES_EMAIL, "", {
                        maxAge: -1,
                        path: "/",
                    });
                    const serializedIsWalletLinkingOAuth = serialize(
                        COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
                        "",
                        {
                            maxAge: -1,
                            path: "/",
                        }
                    );
                    const serializedIsLinkingOAuthWallet = serialize(
                        COOKIES_IS_LINKING_OUTH_WALLET,
                        "",
                        {
                            maxAge: -1,
                            path: "/",
                        }
                    );
                    // for connectedAccounts - COOKIES_IS_CONNECT_ACCOUNT
                    const serializedIsConnectedAccount = serialize(
                        COOKIES_IS_CONNECT_ACCOUNT,
                        "",
                        {
                            maxAge: -1,
                            path: "/",
                        }
                    );

                    const serializedIsConnectWalletEmail = serialize(
                        COOKIES_CONNECT_WALLET_EMAIL,
                        "",
                        {
                            maxAge: -1,
                            path: "/",
                        }
                    );

                    const serializedConnectedProviderId = serialize(
                        COOKIES_CONNECTED_PROVIDER_ID,
                        "",
                        {
                            maxAge: -1,
                        }
                    );

                    res.setHeader("Set-Cookie", [
                        serializedLoginAccessTokenCookie,
                        serializedWildcardAccessTokenCookie,
                        serializedEmailCookie,
                        serializedIsWalletLinkingOAuth,
                        serializedIsLinkingOAuthWallet,
                        serializedIsConnectedAccount,
                        serializedIsConnectWalletEmail,
                        serializedConnectedProviderId,
                    ]);
                }

                //Increase the session expiration by sessionExpirationSeconds
                const nowSeconds = Math.floor(Date.now() / 1000);
                session.expires = nowSeconds + sessionExpirationSeconds;

                return session;
            },
        },
    };
    return authOptions;
};

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    return await NextAuth(req, res, getNextAuthOptions(req, res));
}
