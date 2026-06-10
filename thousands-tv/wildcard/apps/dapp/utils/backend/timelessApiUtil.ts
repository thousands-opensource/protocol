import axios from "axios";
import crypto from "crypto";
import {
    getBeamCid,
    getBeamPid,
    getBeamRealmSecret,
} from "@/utils/environmentUtilWCA";

/**
 * Timeless Microservice backend microservice handles request to Beamable API calls
 * @dev - uses signed requests to authenticate and authorize requests
 * @url - https://docs.beamable.com/reference/signed-requests
 * @url - docs: https://beta-portal.beamable.com/wca/games/DE_1676368290596867/realms/DE_1676368290596866/microservices/TimelessMs/docs
 */
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;
const REALM_SECRET = getBeamRealmSecret();

/**
 * Calculate the signature for the Beamable API call
 * @param pid - Beamable Project ID
 * @param secret - Beamable Realm Secret
 * @param uriPathAndQuery - URI path and query
 * @param body - Request body
 * @returns - Signed Signature
 */
export const calculateSignature = (
    pid: string,
    secret: string,
    uriPathAndQuery: string,
    body: string | null = null
): string => {
    const version = "1"; // API version string
    let dataToSign = `${secret}${pid}${version}${uriPathAndQuery}`;
    if (body) {
        dataToSign += body;
    }
    const hash = crypto.createHash("md5").update(dataToSign, "utf8").digest();
    return hash.toString("base64");
};

/**
 * Generic API handler for making requests to the Beamable API via the Timeless Microservice
 * @param path
 * @param requestBody
 * @returns
 */
export const beamableMicroserviceApiCall = async (
    path: string,
    requestBody: any
) => {
    const fullPath = `/basic/${BEAM_SCOPE}.micro_TimelessMs${path}`;
    const apiUrl = `https://api.beamable.com${fullPath}`;
    const requestBodyString = requestBody ? JSON.stringify(requestBody) : null;

    const signature = calculateSignature(
        BEAM_PID,
        REALM_SECRET,
        fullPath,
        requestBodyString
    );

    try {
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                accept: "application/json",
                "X-BEAM-SCOPE": BEAM_SCOPE,
                "X-BEAM-SIGNATURE": signature,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error: any) {
        throw {
            status: error.response?.data?.status || "Internal Server Error",
            service: error.response?.data?.service || "N/A",
            error:
                error.response?.data?.error || "Error making Beamable API call",
            message:
                error.response?.data?.message ||
                "No additional error information",
        };
    }
};
