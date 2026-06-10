import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import jwt from "jsonwebtoken";
import axios from "axios";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import {
    getNextAuthSecret,
    getNextAuthSessionExpirySeconds,
} from "@/utils/environmentUtilWCA";
import { UserDoc } from "@repo/schemas";
import { findUserByProviderId, findOneUserByQuery } from "@repo/schemas";
import {
    ACCESS_TOKEN_WILDCARD_EXPIRY,
    COOKIES_ACCESS_TOKEN_WILDCARD,
    COOKIES_REDIRECT_URL,
} from "@/utils/accountAPIUtil";
import {
    AccountProviderType,
    EventPointTypeEnum,
    IUser,
    UserRole,
} from "@repo/interfaces";
import { setCookieValue } from "@/utils/oauthUtil";
import { ONE_WEEK_MS } from "@/constants/constants";
import Cookies from "cookies";
import { createUserWithAttributes } from "@repo/schemas";
import { updateSocialEventPointsType } from "../../updateSocialEventPoints";
import { validateBeamableToken } from "@/utils/beamableUtil";
import { serialize } from "cookie";
import { searchAllProviderIdQuery } from "@/utils/backend/accountsBackendUtil";
import { DICEBEAR_URL } from "@/constants";
import { getEthRPCProvider } from "@/utils/environmentUtil";

const client = createPublicClient({
    chain: mainnet,
    transport: http(getEthRPCProvider()),
});

export interface WildcardSessionTokenParams {
    accountProviderType: AccountProviderType;
    accountProviderId: string;
}

export interface WildcardWeb3SessionTokenParams {
    accountProviderType: AccountProviderType;
    message: string;
    signature: string;
    address: string;
}

const NEXT_AUTH_SECRET = getNextAuthSecret();

async function validateAndCreateToken(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ message: `Method ${req.method} Not Allowed` });
    }

    const sessionExpirationSeconds = getNextAuthSessionExpirySeconds(); //24 * 60 * 60; //24 hours

    // Validate session logic, get _id and accountProvider, validate user, retrieve their roles, create token
    const { wildcardSessionTokenParams } = req.body;

    const { accountProviderType } = wildcardSessionTokenParams as
        | WildcardSessionTokenParams
        | WildcardWeb3SessionTokenParams;

    if (accountProviderType === AccountProviderType.WALLET) {
        try {
            const { message, signature, address } =
                wildcardSessionTokenParams as WildcardWeb3SessionTokenParams;

            if (!address) {
                return res.status(400).json({
                    message: "Invalid address during signature verification",
                });
            }

            if (!message) {
                return res.status(400).json({
                    message: "Invalid message during signature verification",
                });
            }

            if (!signature) {
                return res.status(400).json({
                    message: "Invalid signature during signature verification",
                });
            }

            // we create the access token directly for the signed wallet address
            // we'll need a separate process to link the wallet address to the user

            const sigVerification = await verifySignedMessage(
                message,
                signature,
                address
            );

            if (!sigVerification) {
                return res.status(401).json({
                    success: false,
                    data: null,
                    message: "Invalid signature",
                });
            }

            // link the address to the user
            await connectToDb();

            // we want to create a db entry for the wallet address if it doesn't exist
            const userDBResponse = await retrieveOrCreateUserByWallet(address);

            const userDB: IUser | undefined = userDBResponse.data;

            if (!userDB || !userDB.walletProvider?.address) {
                return res.status(404).json({
                    success: false,
                    message: "User not found with linked wallet address",
                });
            }

            const userId = userDB._id?.toString() ?? "";
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "Couldn't find valid userId",
                });
            }

            const cookies = new Cookies(req, res);

            const userRoles: UserRole[] = userDB.roles || [UserRole.SPECTATOR];

            // Create token (use the email to find the _id)
            const wildcardAccessToken = createWildcardAccessToken(
                userDB.walletProvider.address,
                userId,
                userRoles
            );

            setCookieValue(
                COOKIES_ACCESS_TOKEN_WILDCARD,
                wildcardAccessToken,
                cookies,
                ONE_WEEK_MS
            );

            const serializedWildcardAccessTokenCookie = serialize(
                COOKIES_ACCESS_TOKEN_WILDCARD,
                wildcardAccessToken,
                {
                    maxAge: sessionExpirationSeconds,
                    path: "/",
                }
            );

            res.setHeader("Set-Cookie", [serializedWildcardAccessTokenCookie]);

            return res.status(200).json({
                success: true,
                wildcardAccessToken: wildcardAccessToken,
                message: "Token is valid",
            });
        } catch (error: any) {
            console.log(
                "Error validating signature and creating user token:",
                error.message
            );
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    } else {
        const { accountProviderId, accountProviderType } =
            wildcardSessionTokenParams as WildcardSessionTokenParams;

        const authHeader = req.headers.authorization;
        const oauthAccessToken = authHeader?.split(" ")[1];

        if (!oauthAccessToken) {
            return res
                .status(401)
                .json({ error: "Unauthorized no valid token provided" });
        }

        try {
            await connectToDb();

            const infoMsg = `Validating user and creating token for user with linked account id: ${accountProviderId} and account provider type: ${accountProviderType}`;
            console.info(infoMsg);

            if (!accountProviderId) {
                return res
                    .status(400)
                    .json({ message: "Invalid accountProviderId" });
            }

            if (!accountProviderType) {
                return res
                    .status(400)
                    .json({ message: "Invalid accountProviderType" });
            }

            // Important logic to find the user with the same accountId and accountProviderType. Imperative the a user cannot have more than 1 accountId linked
            const user: UserDoc | null = await findUserByProviderId(
                accountProviderId,
                accountProviderType
            );

            if (!user) {
                const errMsg = `User not found with linked account id: ${accountProviderId} and account provider type: ${accountProviderType}`;
                return res.status(404).json({ message: errMsg });
            }

            const isOAuthTokenValid = await validateProviderOAuthToken(
                accountProviderType,
                oauthAccessToken,
                user
            );

            if (!isOAuthTokenValid.success) {
                const errMsg = `OAuth not valid with linked account id: ${accountProviderId} and account provider type: ${accountProviderType}`;
                return res
                    .status(401)
                    .json({ success: false, message: errMsg });
            }

            const userId = user._id?.toString() ?? "";
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "Couldn't find valid userId",
                });
            }

            // Create token (use the email to find the _id)
            const wildcardAccessToken = createWildcardAccessToken(
                accountProviderId, // account provider id (related to the sign-in provider)
                userId, // user id (related to the db user)
                user.roles
            );

            // Return token
            return res
                .status(200)
                .json({ wildcardAccessToken: wildcardAccessToken });
        } catch (error: any) {
            console.log(
                "Error validating and creating user token:",
                error.message
            );
            return res.status(500).json({
                success: "Internal Server Error",

                message: error.message,
            });
        }
    }
}

export default validateAndCreateToken;

/**
 * Validates an OAuth access token based on the account provider type.
 *
 * @param {AccountProviderType} accountProviderType - The type of the account provider.
 * @param {string} oauthAccessToken - The OAuth access token to validate.
 * @param {UserDoc} user - The user to validate the token for
 */
export async function validateProviderOAuthToken(
    accountProviderType: AccountProviderType,
    oauthAccessToken: string,
    user: UserDoc
): Promise<{ success: boolean; data: any; message: string }> {
    switch (accountProviderType) {
        case AccountProviderType.BEAMABLE:
            return await validateBeamableToken(oauthAccessToken);
        case AccountProviderType.GOOGLE:
            return await validateGoogleToken(oauthAccessToken);
        case AccountProviderType.DISCORD:
            return await validateDiscordToken(oauthAccessToken);
        case AccountProviderType.TWITCH:
            return await validateTwitchToken(oauthAccessToken);
        case AccountProviderType.TWITTER:
            return await validateTwitterToken(oauthAccessToken, user);
        default:
            console.error("Login method not supported");
            throw new Error("Login method not supported 🚨");
    }
}

/**
 * Create a wildcard access token.
 * @param {string} id - The user's ID.
 * @param {string} roles - The user's roles.
 * @returns {string} The wildcard access token.
 */
export function createWildcardAccessToken(
    id: string,
    userId: string,
    roles: string[]
): string {
    const wildcardAccessToken = jwt.sign(
        { id, userId, roles },
        NEXT_AUTH_SECRET,
        {
            expiresIn: ACCESS_TOKEN_WILDCARD_EXPIRY,
        }
    );

    return wildcardAccessToken;
}

/**
 * Validates a Twitter OAuth access token by making a request to the Twitter API.
 * @todo could do this with 75 api call due to rate limiting
 * for reference: https://developer.x.com/en/docs/twitter-api/users/lookup/api-reference/get-users-me
 * @param {string} providerOAuthAccessToken - The OAuth access token to validate.
 * @param {UserDoc} user - The user to validate the token for
 * @returns {Promise<object>} The response data from the Twitter API if the token is valid.
 */
async function validateTwitterToken(
    providerOAuthAccessToken: string,
    user: UserDoc
) {
    // first let's try to give user event points if they haven't gotten them already for linking twitter
    updateSocialEventPointsType(EventPointTypeEnum.LINK_TWITTER, user);
    return {
        success: true,
        data: { access_token: providerOAuthAccessToken },
        message: "Token is valid",
    };
}

/**
 * Validates a Twitch OAuth access token by making a request to the Twitch API.
 *
 * @param {string} providerOAuthAccessToken - The OAuth access token to validate.
 * @returns {Promise<object>} The response data from the Twitch API if the token is valid.
 */
async function validateTwitchToken(providerOAuthAccessToken: string) {
    try {
        const response = await axios.get(
            "https://id.twitch.tv/oauth2/validate",
            {
                headers: {
                    Authorization: `OAuth ${providerOAuthAccessToken}`,
                },
            }
        );

        if (response.status === 200) {
            return {
                success: true,
                data: response.data,
                message: "Token is valid",
            };
        } else {
            return {
                success: false,
                data: null,
                message: "Invalid Twitch token",
            };
        }
    } catch (error: any) {
        console.error("Error validating Twitch token:", error);
        return { success: false, data: null, message: error?.message };
    }
}

/**
 * Validates a Discord OAuth access token by making a request to the Discord API.
 *
 * @param {string} providerOAuthAccessToken - The OAuth access token to validate.
 * @returns {Promise<object>} The response data from the Discord API if the token is valid.
 */

export async function validateDiscordToken(providerOAuthAccessToken: string) {
    try {
        const response = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${providerOAuthAccessToken}`,
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                data: response.data,
                message: "Token is valid",
            };
        } else {
            return {
                success: false,
                data: null,
                message: "Invalid Discord token",
            };
        }
    } catch (error: any) {
        console.error("Error validating Discord token:", error);
        return { success: false, data: null, message: error?.message };
    }
}

/**
 * Validates a Google OAuth access token by making a request to the Google API.
 *
 * @param {string} providerOAuthAccessToken - The OAuth access token to validate.
 * @returns {Promise<object>} The response data from the Google API if the token is valid.
 */
async function validateGoogleToken(providerOAuthAccessToken: string) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${providerOAuthAccessToken}`
        );

        if (response.status === 200) {
            return {
                success: true,
                data: response.data,
                message: "Token is valid",
            };
        } else {
            return {
                success: false,
                data: null,
                message: "Invalid Google token",
            };
        }
    } catch (error: any) {
        console.error("Error validating Google token:", error);
        return { success: false, data: null, message: error?.message };
    }
}

/**
Verify the signature of a message based on user signed message
@param message - The message to verify.
@param signature - The signature to verify.
@param address - The expected address of the signer.
@returns true if the signature is valid, false otherwise.
*/
export const verifySignedMessage = async (
    message: any,
    signature: any,
    address: any
) => {
    try {
        const valid = await client.verifyMessage({
            address: address,
            message: message,
            signature,
        });
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

// must ensure an existing wallet cannot be linked
export async function linkWeb3AccountToUser(
    walletAddress: string,
    userDBId: string
) {
    try {
        await connectToDb();

        // Check if the wallet address already exists in any user's wallet provider
        const existingUser: UserDoc | null = await findOneUserByQuery({
            "walletProvider.address": walletAddress,
        });

        if (existingUser) {
            const errorMsg = `Wallet address ${walletAddress} is already linked to another account`;
            console.log(errorMsg);
            return {
                success: false,
                message: errorMsg,
            };
        }

        // Find the user by userDBId
        const user: UserDoc | null = await findOneUserByQuery({
            _id: userDBId,
        });

        if (!user) {
            const errorMsg = "User not found";
            console.log(errorMsg);
            return {
                success: false,
                message: errorMsg,
            };
        }

        console.log("User found", user, "about to link wallet");

        // Link wallet address to walletProvider
        user.walletProvider = {
            address: walletAddress,
            additionalWallets: user.walletProvider?.additionalWallets || [],
        };

        await user.save();
        console.log("Wallet linked to user", user.walletProvider);
        return {
            success: true,
            data: user,
            message: "Wallet linked to user",
        };
    } catch (error: any) {
        const errorMsg = "Error linking Web3 account to user";
        console.error(errorMsg, error);
        return {
            success: false,
            error: errorMsg,
            message: error.message,
        };
    }
}

/**
 * Retrieves or creates a user based on a Web3 wallet address.
 * If an existing user with the given wallet address is found, it returns that user.
 * Otherwise, it creates a new user linked to the provided wallet address.
 *
 * @param {string} walletAddress - The wallet address to link or verify.
 * @returns {Promise<Object>} - Result of the retrieval or user creation process.
 */
export async function retrieveOrCreateUserByWallet(walletAddress: string) {
    try {
        await connectToDb();

        // Check if the wallet address already exists in any user's wallet provider (both primary and additional wallets)
        const query = searchAllProviderIdQuery(walletAddress);
        const existingUser: UserDoc | null = await findOneUserByQuery(query);

        if (existingUser) {
            const successMsg = `Wallet address ${walletAddress} found, associated with user id ${existingUser._id}`;
            console.log(successMsg);
            return {
                success: true,
                data: existingUser,
                message: successMsg,
            };
        }

        const seed = walletAddress + new Date().getTime().toString();
        const imageUrl = `${DICEBEAR_URL}&seed=${encodeURIComponent(seed)}`;

        // Since no existing user is linked with this wallet, create a new user
        const newUser = await createUserWithAttributes({
            roles: [UserRole.SPECTATOR],
            preferences: {
                displayName: "",
                avatarThemeColor: "",
                showLinkedSocials: false,
                sendNotifications: false,
                defaultProfileImageUrl: imageUrl,
            },
            walletProvider: {
                address: walletAddress,
                additionalWallets: [],
            },
            preferredProvider: AccountProviderType.WALLET,
        });

        if (!newUser) {
            const errorMsg = "Failed to create new user";
            console.error(errorMsg);
            return {
                success: false,
                message: errorMsg,
            };
        }

        console.log("New user created with wallet", newUser.walletProvider);
        return {
            success: true,
            data: newUser,
            message: "New user created and wallet linked",
        };
    } catch (error: any) {
        const errorMsg = "Error processing Web3 account";
        console.error(errorMsg, error);
        return {
            success: false,
            error: errorMsg,
            message: error.message,
        };
    }
}
