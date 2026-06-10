import type { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { IUser, UserRole } from "@repo/interfaces";
import Stripe from "stripe";

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

    const { sessionId } = req.body as { sessionId?: string };
    const trimmedSessionId = sessionId?.toString().trim();
    if (!trimmedSessionId) {
        return sendApiResponse(res, {
            success: false,
            err: "Missing sessionId",
        });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        console.error(
            "[getVerificationSession] Missing STRIPE_SECRET_KEY environment variable"
        );
        return sendApiResponse(res, {
            success: false,
            err: "Stripe is not configured",
        });
    }

    try {
        const stripe = new Stripe(stripeSecretKey);
        const verificationSession =
            await stripe.identity.verificationSessions.retrieve(
                trimmedSessionId,
                {
                    expand: [
                        "verified_outputs",
                        "last_verification_report",
                    ],
                }
            );

        let verificationReport: Stripe.Identity.VerificationReport | null =
            null;

        try {
            const reportList =
                await stripe.identity.verificationReports.list({
                    verification_session: trimmedSessionId,
                    limit: 1,
                });
            verificationReport = reportList.data?.[0] ?? null;
        } catch (listError) {
            console.error(
                "[getVerificationSession] Failed to list verification reports",
                listError
            );
        }

        if (!verificationReport) {
            const reportId =
                typeof verificationSession.last_verification_report ===
                "string"
                    ? verificationSession.last_verification_report
                    : verificationSession.last_verification_report?.id ??
                      (verificationSession as any)?.verification_report?.id ??
                      (verificationSession as any)?.verification_report ??
                      null;

            if (reportId) {
                try {
                    verificationReport =
                        await stripe.identity.verificationReports.retrieve(
                            reportId
                        );
                } catch (reportError) {
                    console.error(
                        "[getVerificationSession] Failed to retrieve verification report",
                        reportError
                    );
                }
            }
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                session: verificationSession,
                verificationReport,
            },
        });
    } catch (error: any) {
        console.error(
            "[getVerificationSession] Failed to retrieve session",
            error
        );
        return sendApiResponse(res, {
            success: false,
            err: error?.message || "Failed to retrieve verification session",
        });
    }
}

export default authorize(handler, [UserRole.ADMIN, UserRole.ORGANIZER]);
