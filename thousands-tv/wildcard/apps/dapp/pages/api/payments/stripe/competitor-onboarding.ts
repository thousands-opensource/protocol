import { NextApiRequest, NextApiResponse } from "next";
import StripeSdk from "stripe";
import connectToDb from "@/db/connectToDb";
import { authorize } from "../../middleware/authorization";
import { diContainer } from "@/inversify.config";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import { IUser } from "@repo/interfaces";
import { getProtocol } from "@/utils/util";

const DEFAULT_COMPETITOR_RETURN_PATH = "/competitor";

function getPreferredEmail(user: IUser | null): string | undefined {
    return (
        user?.googleProvider?.email ||
        user?.discordProvider?.email ||
        user?.beamableProvider?.email ||
        user?.twitchProvider?.email ||
        user?.kickProvider?.email ||
        user?.twitterProvider?.email ||
        user?.preferences?.primarylNotificationEmail ||
        undefined
    );
}

function toStringParam(value: unknown): string | undefined {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value) && value.length > 0) {
        return value[0];
    }
    return undefined;
}

function resolveBaseUrl(req: NextApiRequest) {
    const protocol = getProtocol(req);
    const host = req.headers.host;
    if (!host) {
        return "";
    }
    return `${protocol}://${host}`;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ success: false, message: "Method not allowed." });
    }

    if (!user?._id) {
        return res
            .status(400)
            .json({ success: false, message: "User is required." });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        console.error(
            "Stripe secret key is not configured. Please set STRIPE_SECRET_KEY."
        );
        return res.status(500).json({
            success: false,
            message: "Stripe configuration is missing.",
        });
    }

    const stripe = new StripeSdk(stripeSecretKey);

    const {
        refreshUrl: refreshUrlBody,
        returnUrl: returnUrlBody
    } = req.body ?? {};

    const serverCodeParam = "thousands";
    const baseUrl = resolveBaseUrl(req);
    const defaultPath = serverCodeParam
        ? `/${serverCodeParam}/competitor`
        : DEFAULT_COMPETITOR_RETURN_PATH;
    const computedUrl =
        (typeof returnUrlBody === "string" && returnUrlBody.startsWith("http")
            ? returnUrlBody
            : undefined) ||
        (baseUrl ? `${baseUrl}${defaultPath}` : undefined);
    const computedRefreshUrl =
        (typeof refreshUrlBody === "string" &&
        refreshUrlBody.startsWith("http")
            ? refreshUrlBody
            : undefined) || computedUrl;

    if (!computedUrl || !computedRefreshUrl) {
        return res.status(400).json({
            success: false,
            message: "Unable to resolve redirect URLs for onboarding.",
        });
    }

    try {
        await connectToDb();
        const userRepository: IUserRepository =
            diContainer.get("IUserRepository");

        let competitorStripeId = user.competitorStripeId;

        if (!competitorStripeId) {
            const email = getPreferredEmail(user);
            const accountParams: StripeSdk.AccountCreateParams = {
                type: "express",
                business_type: "individual",
                business_profile: {
                    url: "https://www.thousands.tv",
                },
            };

            if (email) {
                accountParams.email = email;
            }

            const account = await stripe.accounts.create(accountParams);

            competitorStripeId = account?.id;

            if (!competitorStripeId) {
                console.error("Stripe account creation response missing ID.");
                return res.status(502).json({
                    success: false,
                    message: "Failed to create Stripe account.",
                });
            }

            await userRepository.setCompetitorStripeId(
                user._id.toString(),
                competitorStripeId
            );
        }

        const accountLink = await stripe.accountLinks.create({
            account: competitorStripeId,
            refresh_url: computedRefreshUrl,
            return_url: computedUrl,
            type: "account_onboarding",
        });

        const onboardingUrl = accountLink?.url;

        if (!onboardingUrl) {
            console.error("Stripe onboarding link response missing URL.");
            return res.status(502).json({
                success: false,
                message: "Failed to create Stripe onboarding link.",
            });
        }

        return res.status(200).json({
            success: true,
            url: onboardingUrl,
            competitorStripeId,
        });
    } catch (error: any) {
        const errorMessage =
            error?.response?.data || error?.message || "Unknown error";
        console.error("Failed to start Stripe onboarding:", errorMessage);
        return res.status(500).json({
            success: false,
            message: "Failed to start Stripe onboarding.",
        });
    }
}

export default authorize(handler);
