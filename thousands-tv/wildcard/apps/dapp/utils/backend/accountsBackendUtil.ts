import {
    findOneUserByQuery,
    updateOneUserDB,
    createUserWithAttributes,
    ServerDoc,
    updateActivePfpProviderDB,
} from "@repo/schemas";
import { UserDoc } from "@repo/schemas";
import { serialize } from "cookie";
import { GetServerSidePropsContext, NextApiResponse } from "next";
import {
    COOKIES_IS_SIGN_UP,
    COOKIES_IS_LOGIN,
    fetchBeamableUserByEmail,
    COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
    COOKIES_ACCESS_TOKEN_WILDCARD,
    COOKIES_CONNECT_WALLET_EMAIL,
    COOKIES_CONNECTED_PROVIDER_ID,
    COOKIES_EMAIL,
    COOKIES_IS_CONNECT_ACCOUNT,
    COOKIES_IS_LINKING_OUTH_WALLET,
    COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
    COOKIES_USER_SERVER_PREFERENCES,
    COOKIES_USER_SERVER_PREFERENCES_EXPIRATION_TIME_MS,
    getRedirectUrlFromCookiesServerSide,
    COOKIES_NEXT_AUTH_SESSION_TOKEN,
} from "../accountAPIUtil";
import {
    getAccountProviderByAccountId,
    getUserDBProviderByType,
} from "../accountsUtil";
import { UserDetailsMe } from "@/contexts/globalContextAccounts";
import axios from "axios";
import {
    getAPIEndpointRootUrl,
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
    getPubnubSecretKey,
} from "../environmentUtilWCA";
import connectToDb from "@/db/connectToDb";
import { User as NextAuthUserType } from "next-auth";
import {
    AccessCodeIntent,
    AccessCodeType,
    AccountProvider,
    AccountProviderType,
    ActivityLog,
    ActivityLogTypeEnum,
    IAccessCode,
    IClaimedTicket,
    IUser,
    PfpMetadata,
    TicketTierType,
    UserRole,
    WildcardApiResponse,
} from "@repo/interfaces";
import { WildcardSessionTokenParams } from "@/pages/api/auth/wildcard/token";
import { WildcardAccountsApiResponse } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { getGuestAccessToken } from "@/backend/common";
import { diContainer } from "@/inversify.config";
import IAccessCodeRepository from "@/repositories/interfaces/iAccessCodeRepository";
import IServerRepository from "@/repositories/interfaces/iServerRepository";
import { setCookieValue } from "../oauthUtil";
import Cookies from "cookies";
import {
    DEFAULT_SERVER_CODE,
    DEFAULT_USER_SERVER_PREFERENCES,
} from "../tenancyUtil";
import { DEFAULT_SERVER_CODE_PLACEHOLDER } from "@/constants/routes";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import { Types, UpdateQuery } from "mongoose";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import { generateAccessCode } from "../eventUtil";
import { getPubnubInstance } from "./pubnubUtil";
import {
    getAllAssociatedWalletsForUser,
    getUserProviderPicture,
} from "../userUtil";
import { isSupportedPfpCollection } from "../pfpCollectionUtil";
import { createActivityLogEntry } from "./activityLogUtil";
import { doesListOfAddressesOwnedNft } from "./alchemyUtil";
import { removeUserSession } from "./userSessionBackendUtil";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateGUID } from "../beamableUtil";
import { retry } from "../util";

/**
 * The type of provider used to authenticate a user.
 */
export enum ProviderType {
    WalletProvider = "walletProvider",
    BeamableProvider = "beamableProvider",
    GoogleProvider = "googleProvider",
    DiscordProvider = "discordProvider",
    TwitchProvider = "twitchProvider",
    TwitterProvider = "twitterProvider",
}

/**
 * The list of provider fields used for MongoDB queries to find users by ID.
 * Includes both wallet and relevant social provider fields.
 */
export const providerFields = [
    "walletProvider.address",
    "walletProvider.additionalWallets",
    "twitchProvider.id",
    "discordProvider.id",
];

/**
 * Generates a MongoDB query to search for a user ID across multiple provider fields.
 * @param {string} id - The wallet address or social provider user ID to search for.
 * @dev - Supports both wallet providers and social providers (Twitch, Google, Discord, Twitter, Beamable)
 * @returns {Object} A MongoDB query object.
 */
export const searchAllProviderIdQuery = (id: string) => {
    return {
        $or: providerFields.map((field) => {
            if (field === "walletProvider.additionalWallets") {
                // Special case for walletProvider's additionalWallets array
                return { "walletProvider.additionalWallets": { $in: [id] } };
            }
            return { [field]: id };
        }),
    };
};

/**
 * Converts a provider type into the corresponding provider property name on the user document.
 * @param {string} providerType - The type of the provider (e.g., 'Discord', 'Google').
 * @returns {string} The property name corresponding to the provider (e.g., 'discordProvider', 'googleProvider').
 */
export function getProviderPropertyName(providerType: string): string {
    return providerType.toLowerCase() + "Provider"; // Converts 'Discord' to 'discordProvider'
}

interface GenericResponse {
    setHeader: (name: string, value: string | string[]) => void;
}

/**
 * `getUserByAccountId` is an asynchronous function that fetches a user by comparing the give provider ID to all provider's IDs in the database.
 *
 * @async
 * @function
 * @param {string} providerId - The ID of the account.
 * @returns {Promise<object|null>} The data from the response if the request is successful, or null if an error occurs.
 * @throws Will log the error message if the HTTP request fails.
 */
export async function getUserByProviderId(
    providerId: string
): Promise<UserDoc | null> {
    try {
        await connectToDb();
        const query = searchAllProviderIdQuery(providerId);
        const user: UserDoc | null = await findOneUserByQuery(query);
        return user;
    } catch (error) {
        console.error(`Error fetching user by providerId: ${error}`);
        return null;
    }
}

/**
 * Clears cookies based on a list of cookie names and their settings.
 * @param res - The HTTP response object where cookies will be set.
 * @param cookies - An array of objects containing cookie settings.
 */

export function clearAllCookies(res: GenericResponse) {
    const cookiesToClear = [
        COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
        COOKIES_ACCESS_TOKEN_WILDCARD,
        COOKIES_EMAIL,
        COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
        COOKIES_IS_LINKING_OUTH_WALLET,
        COOKIES_IS_CONNECT_ACCOUNT,
        COOKIES_CONNECT_WALLET_EMAIL,
        COOKIES_CONNECTED_PROVIDER_ID,
    ];

    const clearedCookies = cookiesToClear.map((cookieName) =>
        serialize(cookieName, "", {
            maxAge: -1,
            path: "/",
            expires: new Date(0),
        })
    );

    res.setHeader("Set-Cookie", clearedCookies);
}

/**
 * Clears the next-auth session token cookie.
 */
export function clearNextAuthSessionTokenCookie(res: NextApiResponse) {
    const serializedWildcardAccessToken = serialize(
        COOKIES_ACCESS_TOKEN_WILDCARD,
        "",
        {
            maxAge: -1,
            path: "/",
        }
    );
    const serializedLocalNextAuthSessionToken = serialize(
        "next-auth.session-token",
        "",
        {
            maxAge: -1,
            path: "/",
        }
    );
    const serializedSecureNextAuthSessionToken = serialize(
        COOKIES_NEXT_AUTH_SESSION_TOKEN,
        "",
        {
            maxAge: -1,
            secure: true,
            path: "/",
        }
    );
    res.setHeader("Set-Cookie", [
        serializedSecureNextAuthSessionToken,
        serializedWildcardAccessToken,
        serializedLocalNextAuthSessionToken,
    ]);
}

/*
 * Clears Wildcard Accounts cookie
 */
export function clearWildcardAccountsCookie(res: NextApiResponse) {
    const serializedToken = serialize(COOKIES_ACCESS_TOKEN_WILDCARD, "", {
        maxAge: -1,
        path: "/",
    });
    res.setHeader("Set-Cookie", serializedToken);
}

function clearSignUpCookie(res: NextApiResponse) {
    const serializedIsSignUp = serialize(COOKIES_IS_SIGN_UP, "", {
        maxAge: -1,
        path: "/",
    });
    res.setHeader("Set-Cookie", [serializedIsSignUp]);
}

function clearLoginCookie(res: NextApiResponse) {
    const serializedIsLogin = serialize(COOKIES_IS_LOGIN, "", {
        maxAge: -1,
        path: "/",
    });
    res.setHeader("Set-Cookie", [serializedIsLogin]);
}

async function handleCreateWildfileUserDB(
    user: any,
    account: any
): Promise<string | boolean> {
    try {
        const linkedAccount: AccountProviderParams = {
            id: String(user.id),
            name: String(user.name),
            image: String(user.image),
            providerType: account.provider,
            email: String(user.email),
        };
        const providerPropertyName = getProviderPropertyName(account.provider);

        const createdWildfileUserDBResponse = await createWildfileUserDB(
            linkedAccount,
            providerPropertyName
        );

        if (!createdWildfileUserDBResponse.success) {
            return `/login?error=SignUpFailed`;
        }

        const createdWildfileUserDB: IUser | null =
            createdWildfileUserDBResponse.data || null;

        const userDBAccountProvider: AccountProvider = getUserDBProviderByType(
            createdWildfileUserDB,
            account.provider
        );

        if (!userDBAccountProvider) {
            return `/login?error=SignUpFailed`;
        }

        const successMsg = `User ${userDBAccountProvider.email} created successfully`;
        console.log(successMsg);

        return true;
    } catch (e) {
        console.log("$$ error saving user during sign-up:", e);
        return `/login?error=SignUpFailed`;
    }
}

/**
 * Handles the authentication flow for a user (sign-up or login).
 * Attempt to login in if the user exists, otherwise create a new user.
 * @param user
 * @param account
 * @param req
 * @param res
 * @returns
 */
export async function handleAuthFlow(
    user: any,
    account: any,
    req: any,
    res: any
): Promise<string | boolean> {
    const providerId = user.id as string;
    console.log(`providerId: ${providerId} is logging in`);

    // Check if user already exists
    const query = searchAllProviderIdQuery(providerId);
    let existingUser: UserDoc | null = await findOneUserByQuery(query);

    if (existingUser) {
        // Check if the user has not been suspended
        if (
            existingUser.isSuspended &&
            existingUser.suspendedUntil &&
            existingUser.suspendedUntil > new Date()
        ) {
            console.log("User has been suspended. Redirecting to login page.");
            return `/login?error=UserSuspended`;
        }

        // User exists, proceed with login
        console.log(`User ${user.email} is logging in`);
        try {
            return await handleLogin(user, account, existingUser);
        } catch (e) {
            console.log("Error during login flow:", e);
            return `/login?error=LoginFailed`;
        }
    } else {
        // User doesn't exist, proceed with signup
        console.log(`User ${user.email} is signing up`);
        try {
            return await handleSignUp(user, account);
        } catch (e) {
            console.log("Error saving user during sign-up:", e);
            return `/login?error=SignUpFailed`;
        }
    }
}

export async function handleSignUp(
    user: any,
    account: any
): Promise<string | boolean> {
    console.log(`User ${user.email} is signing up`);

    return await handleCreateWildfileUserDB(user, account);
}

export async function handleLogin(
    user: NextAuthUserType,
    account: any,
    existingUser: UserDoc
): Promise<string | boolean> {
    const providerId = user.id as string;
    console.log(`providerId: ${providerId} is logging in`);
    const query = searchAllProviderIdQuery(providerId);

    if (!existingUser) {
        return `/login?error=AccountDoesNotExist`;
    }

    const accountProviderExists: AccountProvider = getUserDBProviderByType(
        existingUser,
        account?.provider
    );

    if (accountProviderExists) {
        return true;
    }

    return false;
}

/**
 * Handles the account linking process for a user via modal flows (verify beamable account)
 * @param existingUser -
 * @param connectedUserDBProviderId
 * @param email - email to create in beamable and link
 * @returns
 */
export async function linkBeamableAccountOnRegistrationOrSignUp(
    existingUser: IUser | null,
    connectedUserDBProviderId: string,
    email?: string
): Promise<WildcardAccountsApiResponse> {
    let userDBConnectedProvider: AccountProvider | null = null;
    let userEmail: string | null = null;

    try {
        if (!existingUser) {
            return {
                success: false,
                data: null,
                message:
                    "User DB does not exist. Skipping Beamable account creation.",
            };
        }

        userDBConnectedProvider = getAccountProviderByAccountId(
            existingUser,
            connectedUserDBProviderId
        );

        const userEmail = userDBConnectedProvider?.email || email;

        if (!userEmail) {
            return {
                success: false,
                data: null,
                message:
                    "User email does not exist. Skipping Beamable account creation.",
            };
        }

        console.log(
            `Linking Beamable account on registration or sign-up for user: ${userEmail}`
        );

        const beamableLinkedAccount = existingUser.beamableProvider?.email;
        if (beamableLinkedAccount) {
            return {
                success: true,
                data: existingUser.beamableProvider,
                message: `User email ${userEmail} already has a linked account with provider.`,
            };
        }

        const registerOnSignUpResp: WildcardAccountsApiResponse =
            await registerOnSignUp(userEmail);

        if (!registerOnSignUpResp.success) {
            if (
                registerOnSignUpResp.data?.error ===
                "EmailAlreadyRegisteredError"
            ) {
                throw new Error("EmailAlreadyRegisteredError");
            }
            return registerOnSignUpResp;
        }

        const userBeamableAccountCreation: UserDetailsMe =
            registerOnSignUpResp.data;

        /*
        //This was removed now that we only sign up with a wallet, we will not have a userEmail prior to creating a Beamable account
        if (userBeamableAccountCreation.email !== userEmail) {
            return {
                success: false,
                data: null,
                message: "Error creating Beamable account: Emails do not match",
            };
        }
        */

        const beamableLinkAccountParams: AccountProviderParams = {
            id: userBeamableAccountCreation.id.toString(),
            name: "",
            email: String(userBeamableAccountCreation.email),
            providerType: AccountProviderType.BEAMABLE,
        };

        return await linkProviderToExistingUser(
            existingUser,
            beamableLinkAccountParams,
            "beamableProvider"
        );
    } catch (error: any) {
        if (error.message === "EmailAlreadyRegisteredError") {
            console.log(
                "Beamable account already exists for existing user. Fetching user details and linking..."
            );

            if (!userEmail || !existingUser) {
                return {
                    success: false,
                    data: null,
                    message:
                        "Could not verify email account as this already exists. Please contact support.",
                };
            }

            const fetchedBeamableUser = await fetchBeamableUserByEmail(
                userEmail
            );

            if (
                !fetchedBeamableUser ||
                fetchedBeamableUser?.gamerTags?.length === 0
            ) {
                return {
                    success: false,
                    data: null,
                    message:
                        "Error fetching Beamable user or no gamertag found.",
                };
            }

            // @dev - https://docs.beamable.com/reference/get_basic-accounts-search
            const gamerTagId = fetchedBeamableUser.gamerTags[0]?.gamerTag; // get the first gamer tag id

            const beamableLinkAccountParams: AccountProviderParams = {
                id: gamerTagId?.toString(),
                name: "",
                email: String(fetchedBeamableUser.email),
                providerType: AccountProviderType.BEAMABLE,
            };

            return await linkProviderToExistingUser(
                existingUser,
                beamableLinkAccountParams,
                "beamableProvider"
            );
        }

        console.log("Error creating Beamable account", error);
        return {
            success: false,
            data: null,
            message: `Error creating Beamable account: ${error.message}`,
        };
    }
}

export async function registerOnSignUp(
    email: string
): Promise<WildcardAccountsApiResponse> {
    const BEAM_API_URL = getBeamApiUrl();
    const BEAM_CID = getBeamCid();
    const BEAM_PID = getBeamPid();
    const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

    const password = uuidv4().substring(0, 15);

    try {
        const accessToken = await getGuestAccessToken();
        console.log(`Creating a new beamable account for ${email}`);

        const response = await axios.post(
            `${BEAM_API_URL}/basic/accounts/register`,
            { email, password },
            {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log(`Beamable account created for ${email}`);
        return {
            success: true,
            data: response.data,
            message: `Beamable account created for ${email}`,
        };
    } catch (error: any) {
        // If the email is already registered, return a 400 error
        if (
            error.response &&
            error.response.data.error === "EmailAlreadyRegisteredError"
        ) {
            return {
                success: false,
                data: error.response.data,
                message: error.response.data.error,
            };
        }

        return {
            success: false,
            data: {
                status: error.response
                    ? error.response.data.status
                    : "Internal Server Error",
                service: error.response ? error.response.data.service : "N/A",
                error: error.response
                    ? error.response.data.error
                    : "Error registering user",
                message: error.response
                    ? error.response.data.message
                    : "No additional error information",
            },
            message: "Error registering user",
        };
    }
}

export interface AccountProviderParams {
    providerType: string;
    id: string;
    name: string;
    image?: string;
    email?: string;
}

/**
 * Main function to handle linking an account provider to a user or create a new user if one does not exist.
 */
export async function handleProviderUserAssociation(
    linkingAccountObject: AccountProviderParams
) {
    try {
        await connectToDb();

        if (!linkingAccountObject.email && !linkingAccountObject.id) {
            return {
                success: false,
                data: null,
                error: "Email is required to link account.",
                message: "Email is required to link account.",
            };
        }

        const query = searchAllProviderIdQuery(linkingAccountObject.id);
        const existingUser = await findOneUserByQuery(query);
        const providerPropertyName = getProviderPropertyName(
            linkingAccountObject.providerType
        );

        if (existingUser) {
            return await linkProviderToExistingUser(
                existingUser,
                linkingAccountObject,
                providerPropertyName
            );
        } else {
            return await createWildfileUserDB(
                linkingAccountObject,
                providerPropertyName
            );
        }
    } catch (error: any) {
        const errorMsg = `Error processing account link: ${error.message}`;
        console.error(errorMsg, error);
        return { success: false, error: errorMsg, message: error.message };
    }
}

/**
 * Links provider data to an existing user if not already linked.
 */
export async function linkProviderToExistingUser(
    userDB: IUser,
    linkingAccountObject: AccountProviderParams,
    providerPropertyName: string
) {
    let existingUserDBProviderObject: AccountProvider = (userDB as any)[
        providerPropertyName
    ];

    if (existingUserDBProviderObject && existingUserDBProviderObject.id) {
        const infoMsg = `Provider ${linkingAccountObject.providerType} already linked.`;
        console.log(infoMsg);
        return { success: true, message: infoMsg, data: userDB };
    }

    let s3ImageUrl = linkingAccountObject.image;
    if (
        linkingAccountObject.image &&
        !isImageFromOurS3Bucket(linkingAccountObject.image)
    ) {
        const userAddress =
            userDB.walletProvider?.address ||
            userDB._id?.toString() ||
            "unknown";
        const providerType = linkingAccountObject.providerType;

        console.log(
            `Uploading provider image to S3 for ${providerType} linking: ${linkingAccountObject.image}`
        );
        try {
            const uploadedUrl = await retry(() =>
                uploadPfpImageToS3(
                    linkingAccountObject.image!,
                    userAddress,
                    providerType
                )
            );
            if (uploadedUrl) {
                s3ImageUrl = uploadedUrl;
                console.log(
                    `Provider image successfully uploaded to S3: ${uploadedUrl}`
                );
            } else {
                console.warn(
                    `Failed to upload provider image to S3, using original URL: ${linkingAccountObject.image}`
                );
            }
        } catch (error) {
            console.error(`Error uploading provider image to S3:`, error);
        }
    }

    const update = {
        $set: {
            [providerPropertyName]: {
                // Update the provider information
                id: linkingAccountObject.id,
                name: linkingAccountObject.name,
                image: s3ImageUrl,
                email: linkingAccountObject.email,
            },
        },
    };

    // Attempt to update the user by email, ensuring they already exist
    const result = await updateOneUserDB({ _id: userDB._id }, update);

    if (!result) {
        console.log("User not found, unable to link provider.");
        return {
            success: false,
            message: "User not found, unable to link provider.",
        };
    }

    console.log("Provider information updated successfully:", result);

    if (!result.preferences.activePfpImageUrl || !result.walletProvider?.pfp) {
        console.log(
            `User has no active PFP, setting PFP from linked account obj ${linkingAccountObject.providerType}, image url: ${s3ImageUrl}`
        );
        const pfpMetaData: PfpMetadata = {
            name: `${linkingAccountObject.providerType} Profile Picture`,
            tokenId: "",
            contractAddress: "",
            chainId: 0,
            imageUrl: s3ImageUrl || "",
            accountProviderType:
                linkingAccountObject.providerType as AccountProviderType,
        };
        await updatePfp(pfpMetaData, result);
    }

    if (userDB._id) {
        // Invalidate User Session Cache
        console.log(`Invalidating user session for user [${userDB._id}]`);
        await removeUserSession(userDB._id.toString());
    }

    return {
        success: true,
        message: `Provider linked to user successfully.`,
        data: result,
    };
}

/**
 * Creates a new user and links the account provider data.
 */
async function createWildfileUserDB(
    linkingAccountObject: AccountProviderParams,
    providerPropertyName: string
) {
    let s3ImageUrl = linkingAccountObject.image;
    if (
        linkingAccountObject.image &&
        !isImageFromOurS3Bucket(linkingAccountObject.image)
    ) {
        const userAddress = linkingAccountObject.id;
        const providerType = linkingAccountObject.providerType;

        try {
            const uploadedUrl = await retry(() =>
                uploadPfpImageToS3(
                    linkingAccountObject.image!,
                    userAddress,
                    providerType
                )
            );
            if (uploadedUrl) {
                s3ImageUrl = uploadedUrl;
                console.log(
                    `Provider image successfully uploaded to S3: ${uploadedUrl}`
                );
            } else {
                console.warn(
                    `Failed to upload provider image to S3, using original URL: ${linkingAccountObject.image}`
                );
            }
        } catch (error) {
            console.error(`Error uploading provider image to S3:`, error);
        }
    }

    const updatedLinkingAccountObject = {
        ...linkingAccountObject,
        image: s3ImageUrl,
    };

    const newUserDetails: Partial<IUser> = {
        roles: [UserRole.SPECTATOR],
        preferences: {
            displayName: linkingAccountObject.name
                ? linkingAccountObject.name
                : "",
            avatarThemeColor: "",
            showLinkedSocials: false,
            sendNotifications: false,
        },
        [providerPropertyName]: updatedLinkingAccountObject,
        preferredProvider:
            linkingAccountObject.providerType as AccountProviderType,
    };

    const createdUserDB = await createUserWithAttributes(newUserDetails);
    if (!createdUserDB) {
        console.log("Failed to create new user.");
        return { success: false, message: "Failed to create new user." };
    }

    if (s3ImageUrl) {
        const pfpMetaData: PfpMetadata = {
            name: `${linkingAccountObject.providerType} Profile Picture`,
            tokenId: "",
            contractAddress: "",
            chainId: 0,
            imageUrl: s3ImageUrl,
            accountProviderType:
                linkingAccountObject.providerType as AccountProviderType,
        };
        await updatePfp(pfpMetaData, createdUserDB);
    }

    return {
        success: true,
        data: createdUserDB,
        message: "New user created and linked",
    };
}

// flow to connect additional linked socials to a user account
export async function handleLinkAdditionalProvider(
    user: any, // nextauth user object
    account: any,
    req: any,
    res: any
): Promise<string | boolean> {
    const connectedProviderId = req.cookies.connectedProviderId;
    const isConnectAccount = req.cookies.isConnectAccount;
    const connectWalletEmail = req.cookies.connectWalletEmail;

    console.log(
        `Attempting to link account ${account?.providerAccountId}, and user ${user.email} to existing user with connected provider id: ${connectedProviderId}.`
    );

    if (!isConnectAccount || !connectWalletEmail || !connectedProviderId) {
        return false; // routes back to login page w/ error message
    }

    const accountLinking = JSON.parse(req.cookies.isConnectAccount);
    if (!accountLinking) {
        setAuthErrorCookie(res);
        return `/wildfile?error=ConnectAccountFailed`;
    }

    const linkingAdditionalAccountObj: AccountProviderParams = {
        id: String(user.id),
        name: String(user.name),
        image: String(user.image),
        providerType: account.provider,
        email: String(user.email),
    };

    await connectToDb();
    // Ensure that the account / provider id is not already linked to a user
    const query = searchAllProviderIdQuery(user.id);
    const existingUser = await findOneUserByQuery(query);
    if (existingUser) {
        console.log(
            `Account provider ${account.provider} already linked to a user.`
        );
        return `/wildfile/?error=AccountAlreadyLinked`;
    }

    const mongoQuery = searchAllProviderIdQuery(connectedProviderId);
    const userDB = await findOneUserByQuery(mongoQuery);
    const providerPropertyName = getProviderPropertyName(
        linkingAdditionalAccountObj.providerType
    );

    console.log(
        `UserDB found: ${userDB?._id}. Linking additional account providerId ${account.providerAccountId} with provider type ${account.provider} to UserDB. `
    );

    // the logic here should strictly link an additional account provider
    if (userDB) {
        await linkProviderToExistingUser(
            userDB,
            linkingAdditionalAccountObj,
            providerPropertyName
        );
    }

    return true;
}

export async function processAccountLinking(user: any, account: any) {
    try {
        const linkedAccount = {
            id: String(user.id),
            name: String(user.name),
            image: String(user.image),
            providerType: account.provider,
        };
        await handleProviderUserAssociation(linkedAccount);
        return true;
    } catch (e) {
        console.error("Error saving user during account linking:", e);
        return `/login?error=AccountLinkingFailed`;
    }
}

export function setAuthErrorCookie(res: NextApiResponse) {
    const cookie = serialize("auth_error", "AccessDenied", {
        path: "/",
        httpOnly: true,
        secure: false,
    });
    res.setHeader("Set-Cookie", cookie);
}

// @audit - to refactor - to be deprecated
export async function linkAccountToUser(
    linkingAccountObject: AccountProviderParams
) {
    try {
        await connectToDb();

        // First try to find user by provider ID (same strategy as JWT callback)
        const providerIdQuery = searchAllProviderIdQuery(
            linkingAccountObject.id
        );
        let userDB: UserDoc | null = await findOneUserByQuery(providerIdQuery);
        console.log(
            `linkAccountToUser: Searched by provider ID ${linkingAccountObject.id}, found user:`,
            !!userDB
        );

        // Fallback to email search if provider ID search fails and email is available
        if (!userDB && linkingAccountObject.email) {
            const emailQuery = { email: linkingAccountObject.email };
            userDB = await findOneUserByQuery(emailQuery);
            console.log(
                `linkAccountToUser: Searched by email ${linkingAccountObject.email}, found user:`,
                !!userDB
            );
        }

        const providerPropertyName = getProviderPropertyName(
            linkingAccountObject.providerType
        );

        if (userDB) {
            if ((userDB as any)[providerPropertyName]) {
                const infoMsg = `Account provider ${linkingAccountObject.providerType} already is linked`;
                console.log(infoMsg);
                return {
                    success: true,
                    data: userDB,
                    message: infoMsg,
                };
            }

            (userDB as any)[providerPropertyName] = linkingAccountObject;
            await userDB.save();
            console.log("Account linked to user", linkingAccountObject);

            // If the user has no pfp, set the pfp to the one from the linking account
            if (!userDB.preferences.activePfpImageUrl) {
                console.log(
                    `User has no active PFP, setting PFP from linked account ${linkingAccountObject.providerType}, image url: ${linkingAccountObject.image}`
                );
                const pfpUrl = linkingAccountObject.image || "";
                const pfpMetaData: PfpMetadata = {
                    name: "",
                    tokenId: "",
                    contractAddress: "",
                    chainId: 0,
                    imageUrl: pfpUrl,
                    accountProviderType:
                        linkingAccountObject.providerType as AccountProviderType,
                };
                await updatePfp(pfpMetaData, userDB);
            }

            return {
                success: true,
                data: userDB,
                message: "Account linked to user",
            };
        } else {
            console.log("User not found, creating new user...");
            const newUserDetails: Partial<IUser> = {
                roles: [UserRole.SPECTATOR],
                preferences: {
                    displayName: "",
                    avatarThemeColor: "",
                    showLinkedSocials: false,
                    sendNotifications: false,
                },
                [providerPropertyName]: linkingAccountObject,
                preferredProvider:
                    linkingAccountObject.providerType as AccountProviderType,
            };

            const createdUserDB = await createUserWithAttributes(
                newUserDetails
            );

            // Update the user's active PFP in the DB
            if (createdUserDB) {
                const pfpUrl = linkingAccountObject.image || "";
                const pfpMetaData: PfpMetadata = {
                    name: "",
                    tokenId: "",
                    contractAddress: "",
                    chainId: 0,
                    imageUrl: pfpUrl,
                    accountProviderType:
                        linkingAccountObject.providerType as AccountProviderType,
                };
                await updatePfp(pfpMetaData, createdUserDB);
            }

            return {
                success: true,
                data: createdUserDB,
                message: "New user created",
            };
        }
    } catch (error: any) {
        const errorMsg = "Error fetching user information";
        console.error(errorMsg, error);
        return {
            success: false,
            error: errorMsg,
            message: error.message,
        };
    }
}

export async function handleLinkAdditionalProviderFromWallet(
    user: any, // nextauth user object
    account: any,
    req: any,
    res: any
): Promise<string | boolean> {
    const isLinkingOAuthWallet = req.cookies.isLinkingOAuthWallet;
    const isLinkingOAuthWalletAddress = req.cookies.LinkingOAuthWalletAddress;

    console.log(
        `Attempting to link account ${account?.providerAccountId}, and user ${user.email} to existing user with connected to wallet address: ${isLinkingOAuthWalletAddress}.`
    );

    if (!isLinkingOAuthWallet || !isLinkingOAuthWalletAddress) {
        return false; // routes back to login page w/ error message
    }

    const linkingAdditionalAccountObj = {
        id: String(user.id),
        name: String(user.name),
        image: String(user.image),
        providerType: account.provider,
        email: String(user.email),
    };

    await connectToDb();

    // Find the user by the wallet address
    const userDBToLinkAccount = await findOneUserByQuery({
        "walletProvider.address": isLinkingOAuthWalletAddress,
    });
    const providerPropertyName = getProviderPropertyName(
        linkingAdditionalAccountObj.providerType
    );

    let s3ImageUrl = linkingAdditionalAccountObj.image;
    if (
        linkingAdditionalAccountObj.image &&
        !isImageFromOurS3Bucket(linkingAdditionalAccountObj.image)
    ) {
        const userAddress =
            userDBToLinkAccount?.walletProvider?.address ||
            userDBToLinkAccount?._id?.toString() ||
            "unknown";
        const providerType = linkingAdditionalAccountObj.providerType;

        console.log(
            `Uploading provider image to S3 for ${providerType} linking: ${linkingAdditionalAccountObj.image}`
        );
        try {
            const uploadedUrl = await retry(() =>
                uploadPfpImageToS3(
                    linkingAdditionalAccountObj.image,
                    userAddress,
                    providerType
                )
            );
            if (uploadedUrl) {
                s3ImageUrl = uploadedUrl;
                console.log(
                    `Provider image successfully uploaded to S3: ${uploadedUrl}`
                );
            } else {
                console.warn(
                    `Failed to upload provider image to S3, using original URL: ${linkingAdditionalAccountObj.image}`
                );
            }
        } catch (error) {
            console.error(`Error uploading provider image to S3:`, error);
        }
    }

    const update = {
        $set: {
            [providerPropertyName]: {
                id: linkingAdditionalAccountObj.id,
                name: linkingAdditionalAccountObj.name,
                image: s3ImageUrl,
                email: linkingAdditionalAccountObj.email,
            },
        },
    };

    const result = await updateOneUserDB(
        { _id: userDBToLinkAccount?._id },
        update
    );

    if (!result) {
        console.log("User not found, unable to link provider.");
        return false;
    }

    console.log(`Provider successfully added to web3 wallet user`);

    if (!result.preferences.activePfpImageUrl || !result.walletProvider?.pfp) {
        console.log(
            `User has no active PFP, setting PFP from linked account ${linkingAdditionalAccountObj.providerType}, image url: ${s3ImageUrl}`
        );
        const pfpMetaData: PfpMetadata = {
            name: `${linkingAdditionalAccountObj.providerType} Profile Picture`,
            tokenId: "",
            contractAddress: "",
            chainId: 0,
            imageUrl: s3ImageUrl || "",
            accountProviderType:
                linkingAdditionalAccountObj.providerType as AccountProviderType,
        };
        await updatePfp(pfpMetaData, result);
    }

    return true;
}

/**
 * Validates the user's access token and creates a new wildcard token.
 * @dev (Access token passed through the header)
 * @async
 * @param {wildcardAccessTokenConstruct} param0 - An object containing the user's ID, access token, and login method.
 * @returns {Promise<string>} The new wildcard access token.
 * @throws Will throw an error if the response status is not 200 or if the axios request fails.
 */
export async function validateAndCreateWildcardToken(
    accountProviderId: string,
    accessToken: string,
    accountProviderType: AccountProviderType
) {
    try {
        const wildcardSessionTokenParams: WildcardSessionTokenParams = {
            accountProviderId: accountProviderId.toString(),
            accountProviderType,
        };

        const response = await axios.post(
            `${getAPIEndpointRootUrl()}/api/auth/wildcard/token`,
            { wildcardSessionTokenParams: wildcardSessionTokenParams },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (response.status === 200) {
            const { wildcardAccessToken } = response.data;
            return wildcardAccessToken;
        } else {
            throw new Error(`Unexpected response code: ${response.status}`);
        }
    } catch (error) {
        console.error("Error getting token:", error);
        throw error;
    }
}

/**
 * Handles the process of validating, claiming, and elevating a user's role based on the access code.
 *
 * @param {GetServerSidePropsContext} context - The Next.js context containing the query parameters and cookies.
 * @param {IUser | null} userDB - The database record of the currently authenticated user.
 * @returns {Promise<{ roleElevated: boolean, accessDocElevatedRole: UserRole[] | undefined }>} The role elevation status and the elevated roles.
 */
export const verifyAndElevateAccessRoles = async (
    context: GetServerSidePropsContext,
    userDB: IUser | null
): Promise<{
    roleElevated: boolean;
    accessDocElevatedRole: UserRole[] | [];
    updatedUserDB: IUser | null;
}> => {
    const accessCodeFromQuery = context.query.accessCode as string | undefined;
    let roleElevated = false;

    if (!userDB || !userDB._id || !accessCodeFromQuery) {
        return { roleElevated, accessDocElevatedRole: [], updatedUserDB: null };
    }

    const accessCodeRepository: IAccessCodeRepository = diContainer.get(
        "IAccessCodeRepository"
    );

    try {
        // Find the access code document
        const accessCodeDoc = await accessCodeRepository.findAccessCodeByCode(
            accessCodeFromQuery
        );

        if (!accessCodeDoc || !accessCodeDoc?._id) {
            console.error("Access code not found");
            return {
                roleElevated,
                accessDocElevatedRole: [],
                updatedUserDB: null,
            };
        }

        if (accessCodeDoc?.intent !== AccessCodeIntent.ACCESS_ROLE) {
            return {
                roleElevated,
                accessDocElevatedRole: [],
                updatedUserDB: null,
            };
        }

        // Claim the access code and handle any role elevation via the intent action
        const claimedAccessCode = await accessCodeRepository.claimAccessCode(
            accessCodeDoc._id.toString(),
            userDB._id.toString()
        );

        if (claimedAccessCode) {
            roleElevated = true;
        }

        const accessDocElevatedRole = accessCodeDoc.accessRoles || [];
        // also provide the updated userDB with the new roles
        const updatedUserDB = await findOneUserByQuery({ _id: userDB._id });

        return { roleElevated, accessDocElevatedRole, updatedUserDB };
    } catch (error) {
        console.error("Error claiming access code:", error);
        return { roleElevated, accessDocElevatedRole: [], updatedUserDB: null };
    }
};

/**
 * Validates the provided serverCode by checking its existence in the database.
 * @param serverCode - server code associated with the server.
 * @returns {Promise<ServerDoc | null>} The server document if found, otherwise null.
 */
export const validateServerCode = async (
    serverCode: string | undefined
): Promise<ServerDoc | null> => {
    const startTime = Date.now();
    console.log(`[PERF] validateServerCode - START for serverCode: ${serverCode}`);
    
    try {
        const dbConnectStart = Date.now();
        await connectToDb();
        console.log(`[PERF] connectToDb took: ${Date.now() - dbConnectStart}ms`);

        if (!serverCode || serverCode.trim() === "") {
            console.log(`Invalid serverCode: ${serverCode}`);
            return null;
        }

        const serverRepository: IServerRepository =
            diContainer.get("IServerRepository");
        
        const queryStart = Date.now();
        const server = await serverRepository.getServerFromCode(serverCode);
        const queryTime = Date.now() - queryStart;
        console.log(`[PERF] getServerFromCode query took: ${queryTime}ms`);
        
        if (server) {
            const docSize = JSON.stringify(server).length;
            console.log(`[PERF] Server document size: ${(docSize / 1024).toFixed(2)}KB`);
        }

        if (!server) {
            console.log(`No server found for serverCode: ${serverCode}`);
            return null;
        }
        
        console.log(`[PERF] validateServerCode - TOTAL: ${Date.now() - startTime}ms`);
        return server;
    } catch (error) {
        // Step 7: Log and handle any unexpected errors
        console.error(`Error validating serverCode: ${serverCode}`, error);
        return null;
    }
};

/**
 * Sets the user preferences cookie based on the server document.
 * It only updates the cookie if the server code has changed.
 * @param serverDoc - The server document containing the logo URL.
 * @param cookies - The Cookies instance to set the cookie.
 */
export const setUserServerPreferencesCookie = (
    serverDoc: ServerDoc,
    cookies: Cookies
) => {
    if (serverDoc) {
        const userServerPreferences = {
            serverPrimaryLogoUrl: serverDoc.serverPrimaryLogoUrl || "",
            serverCode: serverDoc.serverCode || "",
        };

        // Update the cookie to default to the server's primary logo (if not already set)
        updateServerPreferenceCookieIfChanged(
            COOKIES_USER_SERVER_PREFERENCES,
            JSON.stringify(userServerPreferences),
            cookies,
            COOKIES_USER_SERVER_PREFERENCES_EXPIRATION_TIME_MS
        );
    }
};

/**
 * Updates the server code cookie if the value has changed or does not exist.
 * @param cookieName - The name of the cookie to check and update.
 * @param newValue - The new value to set for the cookie.
 * @param cookies - The Cookies instance to manipulate cookies.
 * @param maxAge - Optional. The max age for the cookie.
 */
export const updateServerPreferenceCookieIfChanged = (
    cookieName: string,
    newValue: string,
    cookies: Cookies,
    maxAge?: number
) => {
    const existingCookie = cookies.get(cookieName);

    // Check if the cookie needs to be updated
    if (!existingCookie || existingCookie !== newValue) {
        setCookieValue(cookieName, newValue, cookies, maxAge, false);
        console.log(`Cookie "${cookieName}" has been set/updated: ${newValue}`);
    }
};

/**
 * Retrieves the existing server code from the cookies. Defaults to the wildcard server code.
 * If the cookie does not exist, it updates the cookie with default preferences.
 * @param cookies - The Cookies instance for accessing cookies.
 * @returns {string} - The existing server code or the default server code if not found.
 */
export const getExistingServerCodeFromCookie = (cookies: Cookies): string => {
    const existingCookie = cookies.get(COOKIES_USER_SERVER_PREFERENCES);
    let existingServerCode = "";

    if (existingCookie) {
        // Parse the cookie
        const existingCookieObj = JSON.parse(existingCookie);
        existingServerCode = existingCookieObj.serverCode || "";
    } else {
        // Update user server preferences cookie with defaults
        updateServerPreferenceCookieIfChanged(
            COOKIES_USER_SERVER_PREFERENCES,
            JSON.stringify(DEFAULT_USER_SERVER_PREFERENCES),
            cookies,
            COOKIES_USER_SERVER_PREFERENCES_EXPIRATION_TIME_MS
        );
        existingServerCode = `/${DEFAULT_SERVER_CODE}`; // Default to wildcard
    }

    return existingServerCode;
};

/**
 * Resolves the server code from the request context parameters.
 * If the server code is a placeholder ":serverCode" (i.e via a redirectUrl path), it attempts to
 * extract the actual server code from the stored redirect URL in cookies.
 *
 * @param context - The GetServerSidePropsContext from Next.js.
 * @returns The resolved server code as a string or undefined if not found.
 */
export const resolveServerCode = (
    context: GetServerSidePropsContext
): string | undefined => {
    // Get the server code from params
    const serverCode = context.params?.serverCode as string | undefined;
    const storedRedirectUrl = getRedirectUrlFromCookiesServerSide(context);

    // Check if server code is a placeholder and use the stored redirect URL if available
    let resolvedServerCode = serverCode;

    if (serverCode === DEFAULT_SERVER_CODE_PLACEHOLDER && storedRedirectUrl) {
        const extractedServerCode = storedRedirectUrl.split("/")[1];
        resolvedServerCode = extractedServerCode || serverCode;
    }

    return resolvedServerCode;
};

/**
 * Claims a ticket and redirects to the stream page if successful.
 * @param userId - The ID of the user.
 * @param eventId - The ID of the event.
 * @param accessCode - The access code from query parameters.
 * @param stageId - The stage ID for the redirect URL.
 * @param serverCode - The server code for the redirect URL.
 * @returns An object containing redirect info or error message.
 */
export const claimTicketAndRedirectToStreamPage = async (
    userId: string,
    eventId: string,
    accessCode: string,
    stageId: string,
    serverCode: string
) => {
    let backendInfoMessage = "";
    try {
        console.log(
            `Attempting to claim ticket and redirect for user: ${userId}, event: ${eventId}, access code: ${accessCode}`
        );

        const claimedTicket = await claimTicketViaAccessCode(
            userId,
            stageId,
            accessCode
        );

        if (!claimedTicket) {
            backendInfoMessage =
                "All tickets have been claimed!  Head to the event Discord for a chance at additional tickets.";
            return { backendInfoMessage };
        }

        if (!stageId) {
            backendInfoMessage =
                "Oops! We couldn't find the stage associated with this link. Please contact the Organizer for more information.";
            return { backendInfoMessage };
        }

        const streamRepository: IStreamRepository =
            diContainer.get("IStreamRepository");

        const stream = await streamRepository.findStreamByStageId(stageId);
        const streamId = stream?._id.toString(); // Assuming this is how you get the stream ID

        // Construct the URL for the redirect
        const stageIdUrl = `/${serverCode}/stream/${streamId}`;
        console.log(
            `User ${userId} ticket claimed successfully. Redirecting to stream: ${stageIdUrl}`
        );

        if (!streamId) {
            backendInfoMessage =
                "We couldn't find the stream associated with this link. Please contact the Organizer for more information.";
            return { backendInfoMessage };
        }

        return {
            redirect: {
                destination: stageIdUrl,
                permanent: false,
            },
        };
    } catch (error: any) {
        console.error("Error claiming access code:", error);
        backendInfoMessage =
            error?.message || "An unexpected error occurred. Please try again.";
        return { backendInfoMessage };
    }
};

/**
 * Claims a ticket for a user based on the provided access code.
 * @param userId - The ID of the user claiming the ticket.
 * @param stageId - The ID of the stage.
 * @param accessCode - The access code being used to claim the ticket.
 * @param claimedTicketRepository - The claimed ticket repository instance.
 * @param accessCodeRepository - The access code repository instance.
 * @returns {Promise<IClaimedTicket | null>} - The claimed ticket or null if claiming failed.
 */
export async function claimTicketViaAccessCode(
    userId: string,
    stageId: string,
    accessCode: string
): Promise<IClaimedTicket | null> {
    try {
        const accessCodeRepository: IAccessCodeRepository = diContainer.get(
            "IAccessCodeRepository"
        );
        const claimedTicketRepository: IClaimedTicketRepository =
            diContainer.get("IClaimedTicketRepository");

        // Find the access code document
        const foundAccessCodeDoc =
            await accessCodeRepository.findAccessCodeByCode(accessCode);

        if (!foundAccessCodeDoc || !foundAccessCodeDoc._id) {
            console.error(
                `Invalid access code for user [${userId}] and stage [${stageId}]: ${accessCode}`
            );
            return null;
        }

        const tier = foundAccessCodeDoc.tier as TicketTierType;
        const organizationId = foundAccessCodeDoc.organizationId || undefined;

        // Check if the user has already claimed the access code
        const hasUserClaimedAccessCode =
            await accessCodeRepository.hasClaimedClaimedAccessCodeByUserId(
                userId,
                accessCode
            );

        // If not claimed, claim the access code
        if (!hasUserClaimedAccessCode) {
            const claimedAccessCode =
                await accessCodeRepository.claimAccessCode(
                    foundAccessCodeDoc._id.toString(),
                    userId
                );

            if (!claimedAccessCode) {
                console.error(
                    `Failed to claim access code [${accessCode}] for user [${userId}]`
                );
                return null;
            }
        }

        // Create the claimed ticket
        const newClaimedTicket: IClaimedTicket = {
            userId: new Types.ObjectId(userId),
            eventId: stageId,
            tier,
            accessCodeId: foundAccessCodeDoc._id,
            organizationId,
            creditMultiplier: 1,
        };

        // Add to repo
        const { claimedTicket, error } =
            await claimedTicketRepository.createClaimedTicket(newClaimedTicket);

        return claimedTicket;
    } catch (error) {
        console.error("Error claiming ticket via access code:", error);
        return null;
    }
}

/**
 * Creates a single access code based on the provided parameters.
 * @param {Object} params - Parameters for creating the access code.
 * @param {string|null} params.organizationId - The organization ID (if applicable).
 * @param {AccessCodeType} params.codeType - The type of access code to generate.
 * @param {number} params.maxQuantity - The maximum quantity for the code.
 * @param {string|null} params.seriesId - The ID of the series (if applicable).
 * @param {AccessCodeIntent} params.intent - The intent for the access code.
 * @param {string} [params.tier] - The tier for ticket access codes (if applicable).
 * @param {UserRole[]} [params.accessRoles] - The roles associated with access code (if applicable).
 * @returns {Promise<string|null>} - The generated access code or null if creation fails.
 */
export async function createAccessCode({
    organizationId,
    codeType,
    maxQuantity,
    seriesId,
    intent,
    tier,
    accessRoles,
}: {
    organizationId?: Types.ObjectId | null;
    codeType: AccessCodeType;
    maxQuantity: number;
    seriesId?: Types.ObjectId | null;
    intent: AccessCodeIntent;
    tier?: TicketTierType;
    accessRoles?: UserRole[];
}): Promise<string | null> {
    try {
        const createdCode = await createAccessCodeDocument({
            organizationId,
            codeType,
            maxQuantity,
            seriesId,
            intent,
            tier,
            accessRoles,
        });

        return createdCode ? createdCode.accessCode : null;
    } catch (error) {
        console.error("Error creating access code:", error);
        return null;
    }
}

/**
 * Creates a single access code based on the provided parameters.
 * @param {Object} params - Parameters for creating the access code.
 * @param {string|null} params.organizationId - The organization ID (if applicable).
 * @param {AccessCodeType} params.codeType - The type of access code to generate.
 * @param {number} params.maxQuantity - The maximum quantity for the code.
 * @param {string|null} params.seriesId - The ID of the series (if applicable).
 * @param {AccessCodeIntent} params.intent - The intent for the access code.
 * @param {string} [params.tier] - The tier for ticket access codes (if applicable).
 * @param {UserRole[]} [params.accessRoles] - The roles associated with access code (if applicable).
 * @returns {Promise<string|null>} - The generated access code or null if creation fails.
 */
export async function createAccessCodeDocument({
    organizationId,
    codeType,
    maxQuantity,
    seriesId,
    intent,
    tier,
    accessRoles,
}: {
    organizationId?: Types.ObjectId | null;
    codeType: AccessCodeType;
    maxQuantity: number;
    seriesId?: Types.ObjectId | null;
    intent: AccessCodeIntent;
    tier?: TicketTierType;
    accessRoles?: UserRole[];
}): Promise<IAccessCode | null> {
    try {
        const accessCodeRepository: IAccessCodeRepository = diContainer.get(
            "IAccessCodeRepository"
        );

        const accessCodeData: IAccessCode = {
            organizationId: organizationId || null,
            accessCode: generateAccessCode(),
            isClaimed: false,
            claimedUsers: [],
            codeType,
            maxQuantity:
                codeType === AccessCodeType.SINGLE_USE ? 1 : maxQuantity,
            seriesId: seriesId || null,
            intent,
            ...(intent === AccessCodeIntent.TICKET && { tier }), // Conditionally add tier (based on intent)
            ...(intent === AccessCodeIntent.ACCESS_ROLE && { accessRoles }),
        };

        const createdCode = await accessCodeRepository.createAccessCode(
            accessCodeData
        );

        return createdCode ? createdCode : null;
    } catch (error) {
        console.error("Error creating access code document:", error);
        return null;
    }
}

/**
 *
 * @param pfp - the pfp to update to
 * @param user - the user to update the pfp for
 * @param ignoreGasExpense - whether to ignore gas expense
 * @returns  - The result of the API call
 */
export async function updatePfp(
    pfp: PfpMetadata,
    user: IUser
): Promise<WildcardApiResponse> {
    const { tokenId, contractAddress, chainId, accountProviderType } = pfp;
    console.log(
        `Setting PFP for user ${user._id}:
        - PFP tokenId: ${tokenId}, contractAddress: ${contractAddress}, chainId: ${chainId}`
    );

    if (!user || !user._id) {
        return {
            success: false,
            err: "Error updating PFP. User not found",
        };
    }

    // Check if the PFP is supported
    console.log("supportedPFP", pfp);
    const isSupportedPfpResult = await isSupportedPfp(pfp, user);
    if (!isSupportedPfpResult.success) {
        return isSupportedPfpResult;
    }

    let pfpToStore = { ...pfp };

    if (
        pfp.imageUrl &&
        pfp.imageUrl !== "" &&
        pfp.imageUrl !== "0x0000000000000000000000000000000000000000"
    ) {
        if (isImageFromOurS3Bucket(pfp.imageUrl)) {
            console.log(
                `PFP image is already from our S3 bucket: ${pfp.imageUrl}`
            );
        } else {
            const userAddress =
                user.walletProvider?.address ||
                user._id?.toString() ||
                "unknown";
            const providerType =
                accountProviderType || AccountProviderType.WALLET;

            console.log(
                `Uploading PFP image to S3 for user ${user._id} from URL: ${pfp.imageUrl}`
            );
            const s3ImageUrl = await retry(() =>
                uploadPfpImageToS3(pfp.imageUrl, userAddress, providerType)
            );

            if (s3ImageUrl) {
                pfpToStore.imageUrl = s3ImageUrl;
                console.log(
                    `PFP image successfully uploaded to S3: ${s3ImageUrl}`
                );
            } else {
                console.warn(
                    `Failed to upload PFP image to S3, using original URL: ${pfp.imageUrl}`
                );
            }
        }
    }

    // Update the PFP in the DB
    const update: UpdateQuery<IUser> = {
        $set: { "walletProvider.pfp": pfpToStore },
    };
    const updatedUser = await updateOneUserDB({ _id: user._id }, update);

    // Update the user's activity log
    const activityLog: ActivityLog | undefined = await createActivityLogEntry(
        user._id.toString(),
        ActivityLogTypeEnum.UPDATE_PFP,
        JSON.stringify(pfpToStore)
    );

    // Update the user's active PFP in the DB
    updateActivePfpProviderDB(
        user._id,
        accountProviderType || AccountProviderType.WALLET
    );

    //If the walletProvider imageUrl is empty, we cannot send this to PubNub, so use the default provider image
    let pfpImageUrl = pfpToStore.imageUrl;
    if (!pfpImageUrl) {
        pfpImageUrl = getUserProviderPicture(user);
    }

    // handles updating the pubnub user metadata
    const displayName = user.preferences.displayName;
    const secretKey = getPubnubSecretKey();
    const pubnub = getPubnubInstance(user._id.toString(), secretKey);
    try {
        await pubnub.objects.setUUIDMetadata({
            data: {
                name: displayName,
                profileUrl: pfpImageUrl,
                custom: {},
            },
        });
    } catch (e) {
        console.error("error setting pfp on pubnub", e);
    }

    const msg = `Successfully set pfp for user [${user._id}]`;
    console.log(msg);

    return {
        success: true,
        data: { updatedUser, activityLog },
    };
}

/**
 * Checks if is in the supported PFP collection and if the user owns the NFT
 * @param pfp - the pfp to update to
 * @param user - the user to update the pfp for
 * @returns
 */
async function isSupportedPfp(
    pfp: PfpMetadata,
    user: IUser
): Promise<WildcardApiResponse> {
    const { tokenId, contractAddress, chainId, accountProviderType } = pfp;

    if (
        accountProviderType &&
        accountProviderType !== AccountProviderType.WALLET
    ) {
        console.log(`Using provider type ${accountProviderType}`);
        return { success: true };
    }

    try {
        // Check if resetting PFP
        const isResettingPfp =
            tokenId === "0" &&
            contractAddress === "0x0000000000000000000000000000000000000000" &&
            !chainId;

        // Validate if PFP contract is supported
        const isSupported =
            isResettingPfp || isSupportedPfpCollection(contractAddress);
        if (!isSupported) {
            const err = `PFP contract ${contractAddress} is not a supported collection`;
            console.error(err);
            return { success: false, err };
        }

        // Validate ownership of NFT unless resetting PFP
        if (!isResettingPfp) {
            const ownerAddresses = getAllAssociatedWalletsForUser(user);
            const isNftOwner = await doesListOfAddressesOwnedNft(
                ownerAddresses,
                contractAddress,
                tokenId
            );
            /// COMMENT OUT BELOW IF TESTING IN DEV USING A WALLET YOU DON'T OWN
            if (!isNftOwner) {
                const err = `You are not the owner of NFT: tokenId ${tokenId}, contractAddress: ${contractAddress}, chainId: ${chainId}`;
                console.error(err);
                return { success: false, err };
            }
        }
        return { success: true };
    } catch (e: any) {
        const err = `Failed to verify if the PFP is supported for ${user._id}: ${e.message}`;
        console.error(err, e);
        return { success: false, err };
    }
}

/**
 * Returns an array of serialized cookies to clear on logout.
 */
export function getLogoutCookies(): string[] {
    const clearCookie = (name: string) =>
        serialize(name, "", {
            expires: new Date(0), // Expire immediately
            path: "/",
        });

    return [
        COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE,
        COOKIES_ACCESS_TOKEN_WILDCARD,
        COOKIES_EMAIL,
        COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
        COOKIES_IS_LINKING_OUTH_WALLET,
        COOKIES_IS_LOGIN,
        COOKIES_IS_SIGN_UP,
    ].map(clearCookie);
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

function isImageFromOurS3Bucket(imageUrl: string): boolean {
    if (!imageUrl || !process.env.AWS_S3_BUCKET) {
        return false;
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || "us-east-1";

    // Check for both possible S3 URL formats
    const s3UrlPattern1 = `https://${bucketName}.s3.${region}.amazonaws.com/`;
    const s3UrlPattern2 = `https://s3.${region}.amazonaws.com/${bucketName}/`;

    return (
        imageUrl.startsWith(s3UrlPattern1) || imageUrl.startsWith(s3UrlPattern2)
    );
}

/**
 * Uploads an image from a URL to S3 bucket with a unique filename
 * @param imageUrl - The source image URL to download and upload
 * @param userAddress - The user's wallet address (used for prefixing)
 * @param providerType - The account provider type (defaults to 'wallet')
 * @returns The S3 URL of the uploaded image or null if failed
 */
async function uploadPfpImageToS3(
    imageUrl: string,
    userAddress: string,
    providerType: string = "wallet"
): Promise<string | null> {
    try {
        if (
            !imageUrl ||
            imageUrl === "" ||
            imageUrl === "0x0000000000000000000000000000000000000000"
        ) {
            return null;
        }

        console.log(`Starting S3 upload for PFP image: ${imageUrl}`);

        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.error(
                `Failed to fetch image from ${imageUrl}: ${response.statusText}`
            );
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 10 * 1024 * 1024) {
            // 10MB limit
            console.error(`Image too large: ${buffer.length} bytes`);
            return null;
        }

        // Get file extension from URL or content type
        let fileExtension = "jpg";
        const contentType = response.headers.get("content-type");
        if (contentType) {
            if (contentType.includes("png")) fileExtension = "png";
            else if (contentType.includes("gif")) fileExtension = "gif";
            else if (contentType.includes("webp")) fileExtension = "webp";
            else if (contentType.includes("svg")) fileExtension = "svg";
        } else {
            const urlExtension = imageUrl.split(".").pop()?.toLowerCase();
            if (
                urlExtension &&
                ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
                    urlExtension
                )
            ) {
                fileExtension = urlExtension === "jpeg" ? "jpg" : urlExtension;
            }
        }

        const cleanUserAddress = userAddress.replace(/[^a-zA-Z0-9]/g, "");

        const filename = `pfp/${cleanUserAddress}_${providerType}.${fileExtension}`;

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: filename,
            Body: buffer,
            ContentType: contentType || "image/jpeg",
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        console.log(`Successfully uploaded PFP image to S3: ${s3Url}`);
        return s3Url;
    } catch (error) {
        console.error("Error uploading PFP image to S3:", error);
        return null;
    }
}

// @note cannot recall what was the performance issue
// after inserting item into array. mongodb re-adds document into db
export async function addRole(
    user: IUser,
    role: UserRole
): Promise<WildcardApiResponse> {
    try {
        const filter = { _id: user._id?.toString() };
        const update = { $push: { roles: role } };
        const newUser = await updateOneUserDB(filter, update);
        return { success: true, data: newUser };
    } catch (e: any) {
        console.error("Error add role for user", e.message);
        return { success: false, err: `Error unable add role ${e.message}` };
    }
}
