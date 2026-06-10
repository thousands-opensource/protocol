import type { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import {
    IUser,
    KycStatus,
} from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import { usersModel, updateOneUserDB } from "@repo/schemas";
import Stripe from 'stripe';
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";

const STRIPE_VERIFICATION_ENDPOINT =
    "https://api.stripe.com/v1/identity/verification_sessions";
const DEFAULT_SNAG_API_BASE_URL = "https://admin.snagsolutions.io";

async function rewardSnagBadge(walletAddress: string) {
    const apiKey = process.env.SNAG_SOLUTIONS_API_KEY || "";
    const badgeId = process.env.SNAG_SOLUTIONS_BADGE_ID || "";
    const baseUrl =
        process.env.SNAG_SOLUTIONS_API_BASE_URL || DEFAULT_SNAG_API_BASE_URL;

    if (!apiKey || !badgeId || !walletAddress) {
        console.warn(
            "[verification-session] Skipping Snag badge reward. Missing inputs.",
            {
                hasApiKey: !!apiKey,
                hasBadgeId: !!badgeId,
                walletAddress: walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "",
                baseUrl,
            }
        );
        return;
    }

    console.log("[verification-session] Rewarding Snag badge", {
        badgeId,
        walletAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        baseUrl,
    });

    const response = await fetch(
        `${baseUrl}/api/loyalty/badges/${badgeId}/reward`,
        {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress }),
        }
    );

    if (!response.ok) {
        const payload = await response.text();
        console.error(
            "[verification-session] Failed to reward Snag badge",
            {
                status: response.status,
                body: payload,
            }
        );
        return;
    }

    try {
        const payload = await response.json();
        console.log("[verification-session] Snag badge rewarded", payload);
    } catch {
        console.log("[verification-session] Snag badge rewarded (no JSON body)");
    }
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: "Method not allowed",
        });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        console.error(
            "[verification-session] Missing STRIPE_SECRET_KEY environment variable"
        );
        return sendApiResponse(res, {
            success: false,
            err: "Stripe is not configured",
        });
    }

    const stripe = new Stripe(stripeSecretKey);

    const userId = user?._id;
    if (!userId) {
        return sendApiResponse(res, {
            success: false,
            err: "User not found in session",
        });
    }

    await connectToDb();

    //Look up users
    const existingKyc = await usersModel
        .findOne(
            { _id: userId },
            { "kyc.sessionId": 1, "kyc.status": 1 }
        )
        .lean<IUser>();

    //if we already completed the KYC or the KYC failed, we don't want to do it again
    if (existingKyc?.kyc?.status === KycStatus.COMPLETED || existingKyc?.kyc?.status === KycStatus.FAILED)
    {
        return sendApiResponse(res, {
                    success: true,
                    data: {
                        sessionId: existingKyc.kyc.sessionId,
                        clientSecret: null,
                        status: existingKyc?.kyc?.status,
                    },
                });
    }

    //If we need to get the client_secret using a previous session
    if (existingKyc?.kyc?.sessionId && existingKyc?.kyc?.status !== KycStatus.NOTSTARTED) {
        console.log("WE FOUND A STRIPE SESSION, SO LOOKING IT UP...");

        const verificationSessionId = existingKyc?.kyc?.sessionId;
        const verificationSession = await stripe.identity.verificationSessions.retrieve(
            verificationSessionId
        );

        console.log(`verificationSession: ${verificationSession.status}`);

        var statusToReturn = KycStatus.STARTED;

        //If the Stripe session returns verified, but we don't have our user record kyc.status marked as COMPLETED, then mark it as COMPLETED 
        if (verificationSession.status === "verified")
        {
            //Update kyc.status in users collection
            await updateOneUserDB(
                { _id: userId },
                {
                    $set: {
                        "kyc.status": KycStatus.COMPLETED,
                    },
                }
            );
            await removeUserSession(userId);
            const walletAddress =
                user?.walletProvider?.address?.toString() ?? "";
            console.log("[verification-session] KYC completed. Rewarding badge.", {
                userId: userId.toString(),
                walletAddress: walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "",
            });
            try {
                await rewardSnagBadge(walletAddress);
            } catch (badgeError) {
                console.error(
                    "[verification-session] Snag badge reward failed",
                    badgeError
                );
            }

            statusToReturn = KycStatus.COMPLETED;
        }
        //If the Stripe session returns canceled, but we don't have our user record kyc.status marked as FAILED, then mark it as FAILED 
        else if (verificationSession.status === "canceled")
        {
            //Update kyc.status in users collection
            await updateOneUserDB(
                { _id: userId },
                {
                    $set: {
                        "kyc.status": KycStatus.FAILED,
                    },
                }
            );
            await removeUserSession(userId);

            statusToReturn = KycStatus.FAILED;
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                sessionId: existingKyc.kyc.sessionId,
                clientSecret: verificationSession.client_secret,
                status: statusToReturn,
            },
        });
    }

    const metadataUserId = userId.toString();
    //const metadataEmail = user?.email || "";

    const body = new URLSearchParams({
        type: "document",
    });

    body.append("metadata[userId]", metadataUserId);
    /*
    if (metadataEmail) {
        body.append("metadata[email]", metadataEmail);
    }
    */

    try {
        const stripeResponse = await fetch(STRIPE_VERIFICATION_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeSecretKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        const payload = await stripeResponse.json();
        /*
        console.log(
            "[verification-session] Stripe response",
            stripeResponse.status,
            payload
        );
        */

        if (!stripeResponse.ok) {
            const errorMessage =
                payload?.error?.message ||
                "[verification-session] Stripe request failed";
            console.error(
                "[verification-session] Failed to create session",
                payload
            );

            return sendApiResponse(res, {
                success: false,
                err: errorMessage,
            });
        }

        const responsePayload = {
            success: true,
            data: {
                sessionId: payload.id,
                clientSecret: payload.client_secret,
                status: KycStatus.STARTED,
            },
        };

        if (payload.id && payload.client_secret) {
            await updateOneUserDB(
                { _id: userId },
                {
                    $set: {
                        "kyc.sessionId": payload.id,
                        "kyc.status": KycStatus.STARTED,
                    },
                }
            );
            await removeUserSession(userId);
        }

        return sendApiResponse(res, responsePayload);
    } catch (error: any) {
        console.error(
            "[verification-session] Unexpected error creating session",
            error
        );
        return sendApiResponse(res, {
            success: false,
            err: error?.message || "Failed to create verification session",
        });
    }
}

export default authorize(handler);
