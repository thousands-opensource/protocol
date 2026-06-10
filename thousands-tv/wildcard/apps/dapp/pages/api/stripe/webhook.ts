import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import connectToDb from "@/db/connectToDb";
import { updateOneUserDB, usersModel } from "@repo/schemas";
import { KycStatus } from "@repo/interfaces";
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";

const DEFAULT_SNAG_API_BASE_URL = "https://admin.snagsolutions.io";

async function rewardSnagBadge(walletAddress: string) {
    const apiKey = process.env.SNAG_SOLUTIONS_API_KEY || "";
    const badgeId = process.env.SNAG_SOLUTIONS_BADGE_ID || "";
    const baseUrl =
        process.env.SNAG_SOLUTIONS_API_BASE_URL || DEFAULT_SNAG_API_BASE_URL;

    if (!apiKey || !badgeId || !walletAddress) {
        console.warn(
            "[stripe-webhook] Skipping Snag badge reward. Missing inputs.",
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

    console.log("[stripe-webhook] Rewarding Snag badge", {
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
            "[stripe-webhook] Failed to reward Snag badge",
            {
                status: response.status,
                body: payload,
            }
        );
        return;
    }

    try {
        const payload = await response.json();
        console.log("[stripe-webhook] Snag badge rewarded", payload);
    } catch {
        console.log("[stripe-webhook] Snag badge rewarded (no JSON body)");
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};

const readRawBody = async (req: NextApiRequest) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks as unknown as Uint8Array[]);
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
        console.error(
            "[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET"
        );
        return res.status(500).json({ error: "Stripe is not configured" });
    }

    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
        return res.status(400).json({ error: "Missing Stripe signature" });
    }

    let event: Stripe.Event;
    try {
        const rawBody = await readRawBody(req);
        const stripe = new Stripe(stripeSecretKey);
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret
        );
    } catch (error) {
        console.error("[stripe-webhook] Signature verification failed", error);
        return res.status(400).json({ error: "Invalid signature" });
    }

    const eventType = event.type as string;
    if (
        eventType === "identity.verification_session.updated" ||
        eventType === "identity.verification_session.verified"
    ) {
        const session = event.data
            .object as Stripe.Identity.VerificationSession;
        const userId = session.metadata?.userId;
        const status = session.status;

        if (!userId) {
            console.warn(
                "[stripe-webhook] Missing userId metadata on verification session",
                session.id
            );
            return res.status(200).json({ received: true });
        }

        let nextStatus: KycStatus | null = null;
        if (status === "verified") {
            nextStatus = KycStatus.COMPLETED;
        } else if (status === "canceled") {
            nextStatus = KycStatus.FAILED;
        }

        if (nextStatus) {
            try {
                await connectToDb();
                await updateOneUserDB(
                    { _id: userId },
                    { $set: { "kyc.status": nextStatus } }
                );
                await removeUserSession(userId);
                if (nextStatus === KycStatus.COMPLETED) {
                    const user = await usersModel
                        .findById(userId, { "walletProvider.address": 1 })
                        .lean<{ walletProvider?: { address?: string } } | null>();
                    const walletAddress =
                        user?.walletProvider?.address?.toString() ?? "";
                    console.log(
                        "[stripe-webhook] KYC completed. Rewarding badge.",
                        {
                            userId,
                            walletAddress: walletAddress
                                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                                : "",
                        }
                    );
                    try {
                        await rewardSnagBadge(walletAddress);
                    } catch (badgeError) {
                        console.error(
                            "[stripe-webhook] Snag badge reward failed",
                            badgeError
                        );
                    }
                }
            } catch (error) {
                console.error(
                    "[stripe-webhook] Failed to update user KYC status",
                    error
                );
                return res.status(500).json({ error: "Failed to update user" });
            }
        }
    }

    return res.status(200).json({ received: true });
};

export default handler;
