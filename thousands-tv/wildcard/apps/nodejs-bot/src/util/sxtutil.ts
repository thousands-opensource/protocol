import { getSpaceAndTimeConfigs } from "@src/util/environmentUtil";
import { SXT_API_BASE_URL } from "@src/constants";

import axios from "axios";
import nacl from "tweetnacl";

export async function executeSxTSQLQuery(sqlText: string) {
    const accessToken = await authenticateSxt();

    const { sxtUserId, sxtUserPublicKey, sxtUserPrivateKey, sxtTableBiscuit } =
        getSpaceAndTimeConfigs();

    const axiosConfig = {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const queryResponse = await axios.post(
        `${SXT_API_BASE_URL}/sql/dql`,
        {
            sqlText: sqlText,
            biscuits: [sxtTableBiscuit],
        },
        axiosConfig
    );

    return queryResponse.data;
}

// # https://docs.spaceandtime.io/reference/authentication-code
export async function request_auth_code() {
    console.log("Requesting auth code from the SxT API...");
    const url = SXT_API_BASE_URL + "auth/code";

    const { sxtUserId, sxtUserPublicKey, sxtUserPrivateKey, sxtTableBiscuit } =
        getSpaceAndTimeConfigs();

    const payload = {
        userId: sxtUserId,
    };

    const headers = { accept: "application/json" };
    const resp = await axios.post(url, payload, { headers });

    if (resp.status !== 200) {
        console.error(
            "Non 200 response from the auth/code endpoint! Stopping."
        );
        process.exit();
    }

    const auth_code = resp.data.authCode;
    console.debug("Auth code: " + auth_code);
    return auth_code;
}

// https://docs.spaceandtime.io/reference/authentication-code begin authentication process
export async function authenticateSxt() {
    // 1) Request auth code from SxT API
    console.log("Requesting auth code from the SxT API...");
    const auth_code = await request_auth_code();

    // 2) Sign the auth code with our private key
    const signed_auth_code = await sign_message(auth_code);
    if (!signed_auth_code) {
        console.log("unable to get signed auth code");
        return;
    }

    // 3) Request access token using signed_auth_code
    const [access_token, refresh_token] = await request_token(
        auth_code,
        signed_auth_code
    );

    console.log(
        `Authenticaiton to the SxT API has been completed successfully!\n Access token: ${access_token}\n Refresh token: ${refresh_token}`
    );
    return access_token;
}

// # https://docs.spaceandtime.io/reference/authentication-code
// Generate a signature with the given authCode and privateKey
export async function sign_message(auth_code: string) {
    console.log("Signing auth code with our private key...");
    // Convert the authCode to a Uint8Array
    let authCode = new TextEncoder().encode(auth_code);

    const { sxtUserId, sxtUserPublicKey, sxtUserPrivateKey, sxtTableBiscuit } =
        getSpaceAndTimeConfigs();

    try {
        // Call the base64ToUint8 function with your Base64 strings as arguments
        const uint8ArrayKey = base64ToUint8(
            sxtUserPrivateKey,
            sxtUserPublicKey
        );

        // Log or use the resulting Uint8Array
        console.debug("Uint8ArrayKey:", uint8ArrayKey);

        // The NACL Binding for signature generation uses "only" ED25519
        let signatureArray = nacl.sign(authCode, uint8ArrayKey);
        let signature = Buffer.from(
            signatureArray.buffer,
            signatureArray.byteOffset,
            signatureArray.byteLength
        ).toString("hex");
        signature = signature.slice(0, 128);
        console.debug("Signature | hashed message, hex: " + signature);
        return signature;
    } catch (error: any) {
        // Log the error message if an error occurs
        console.error("An error occurred signing auth_code:", error.message);
        //process.exit();
    }
}

// # https://docs.spaceandtime.io/reference/token-request
export async function request_token(
    auth_code: string,
    signed_auth_code: string
) {
    console.log("Requesting token from the SxT API...");

    const { sxtUserId, sxtUserPublicKey, sxtUserPrivateKey, sxtTableBiscuit } =
        getSpaceAndTimeConfigs();

    const url = SXT_API_BASE_URL + "auth/token";
    const payload = {
        userId: sxtUserId,
        authCode: auth_code,
        signature: signed_auth_code,
        key: sxtUserPublicKey,
        scheme: "ed25519",
    };
    // iterate through payload and log each key-value pair
    Object.entries(payload).forEach(([key, value]) => {
        console.debug(`${key}: ${value}`);
    });

    const headers = { accept: "application/json" };

    const resp = await axios.post(url, payload, { headers });

    if (resp.status !== 200) {
        console.error("Failed to request token from the API!");
        console.error(resp.status, resp.data);
        process.exit();
    }
    // iterate through response and log each key-value pair
    Object.entries(resp.data).forEach(([key, value]) => {
        console.debug(`${key}: ${value}`);
    });
    let { accessToken, refreshToken } = resp.data;

    return [accessToken, refreshToken];
}

export const isBase64 = (str: string) => {
    const notBase64 = new RegExp(/[^A-Za-z0-9+/=]/g);
    return !notBase64.test(str);
};

const base64ToUint8 = (base64PrivateKey: string, base64PublicKey: string) => {
    if (!isBase64(base64PrivateKey) || !isBase64(base64PublicKey)) {
        throw new Error("Invalid Base64 string");
    }

    let privateKeyUint8 = Uint8Array.from(
        Buffer.from(base64PrivateKey, "base64")
    );
    let publicKeyUint8 = Uint8Array.from(
        Buffer.from(base64PublicKey, "base64")
    );

    if (privateKeyUint8.length === publicKeyUint8.length) {
        privateKeyUint8 = Uint8Array.from([
            ...privateKeyUint8,
            ...publicKeyUint8,
        ]);
    }

    return privateKeyUint8;
};
