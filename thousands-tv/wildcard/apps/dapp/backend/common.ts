import {
    getAdminAccountEmail,
    getAdminAccountPassword,
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import axios from "axios";

// Beamable Constants
const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const ADMIN_ACCOUNT_EMAIL = getAdminAccountEmail();
const ADMIN_ACCOUNT_PASSWORD = getAdminAccountPassword();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

/**
 * This function is used to get an admin access token.
 * It makes a POST request to the BEAM API's auth token endpoint with the admin's username and password.
 * If successful, it returns the access token from the response.
 * If an error occurs during the request, it logs the error and throws an error message.
 *
 * @returns {Promise<string>} A promise that resolves to the admin access token.
 * @throws {Error} If there is an error obtaining the admin access token.
 */
export const getAdminAccessToken = async () => {
    try {
        const authResponse = await axios.post(
            `${BEAM_API_URL}/basic/auth/token`,
            {
                // grant_type: "guest", // Assuming this is the grant type for admin
                grant_type: "password",
                username: ADMIN_ACCOUNT_EMAIL,
                password: ADMIN_ACCOUNT_PASSWORD,
            },
            {
                headers: {
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                },
            }
        );
        return authResponse.data.access_token;
    } catch (error) {
        console.error("Error obtaining admin access token:", error);
        throw new Error("Failed to obtain admin access token");
    }
};
/**
 * This function is used to get a guest access token.
 * It makes a POST request to the BEAM API's auth token endpoint with the grant type set to "guest".
 * If successful, it returns the access token from the response.
 * If an error occurs during the request, it logs the error and throws an error message.
 *
 * @returns {Promise<string>} A promise that resolves to the guest access token.
 * @throws {Error} If there is an error obtaining the guest access token.
 */
export const getGuestAccessToken = async () => {
    try {
        const authResponse = await axios.post(
            `${BEAM_API_URL}/basic/auth/token`,
            {
                grant_type: "guest",
            },
            {
                headers: {
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                },
            }
        );
        return authResponse.data.access_token;
    } catch (error) {
        console.error("Error obtaining guest access token:", error);
        throw new Error("Failed to obtain guest access token");
    }
};

/**
 * This function is used to authenticate a user.
 * It makes a POST request to the BEAM API's auth token endpoint with the user's email and password.
 * If successful, it returns an object containing the access token and refresh token (if applicable) from the response.
 * If an error occurs during the request, it logs the error and throws an error message.
 *
 * @param {string} email - The email of the user to authenticate.
 * @param {string} password - The password of the user to authenticate.
 * @returns {Promise<{accessToken: string, refreshToken: string}>} A promise that resolves to an object containing the access token and refresh token.
 * @throws {Error} If there is an error authenticating the user.
 */
export const authenticateUser = async (email: string, password: string) => {
    try {
        const authResponse = await axios.post(
            `${BEAM_API_URL}/basic/auth/token`,
            {
                grant_type: "password",
                username: email,
                password: password,
            },
            {
                headers: {
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                },
            }
        );
        return {
            accessToken: authResponse.data.access_token,
            refreshToken: authResponse.data.refresh_token, // If applicable
        };
    } catch (error: any) {
        console.error(
            "Error authenticating user:",
            error.response ? error.response.data : error
        );
        throw new Error("Failed to authenticate user");
    }
};

/**
 * This is an instance of axios with a predefined configuration.
 * The base URL is set to BEAM_API_URL and the headers include "Content-Type" and "X-DE-SCOPE".
 * This instance can be used for making HTTP requests to the BEAM API.
 *
 * @type {AxiosInstance}
 */
export const axiosInstance = axios.create({
    baseURL: BEAM_API_URL,
    headers: {
        "Content-Type": "application/json",
        "X-DE-SCOPE": BEAM_SCOPE,
    },
});
