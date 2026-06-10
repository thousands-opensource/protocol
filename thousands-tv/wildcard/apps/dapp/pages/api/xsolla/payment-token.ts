import { NextApiRequest, NextApiResponse } from "next";
import {
    getXsollaMerchantId,
    getXsollaProjectId,
    getXsollaApiKey,
    getXsollaSandboxMode
} from "../../../utils/environmentUtilWCA";

type XsollaTokenRequest = {
    userId: string;
    userName: string;
    userEmail: string;
    sku: string;
    quantity?: number;
    currency?: string;
    paymentMethod?: number;
    returnUrl?: string;
    externalId?: string;
};

type XsollaTokenResponse = {
    token: string;
    order_id: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const {
            userId,
            userName,
            userEmail,
            sku,
            quantity = 1,
            currency = "USD",
            paymentMethod = 1380,
            returnUrl = "https://test.thousands.tv/",
            externalId = `TC${Date.now()}`
        }: XsollaTokenRequest = req.body;

        if (!userId || !userName || !userEmail || !sku) {
            return res.status(400).json({
                error: "Missing required fields: userId, userName, userEmail, sku"
            });
        }

        const merchantId = getXsollaMerchantId();
        const projectId = getXsollaProjectId();
        const apiKey = getXsollaApiKey();
        const isSandboxMode = getXsollaSandboxMode();

        if (!merchantId || !projectId || !apiKey) {
            return res.status(500).json({
                error: "Xsolla configuration missing"
            });
        }

        const xsollaRequestBody = {
            sandbox: isSandboxMode,
            user: {
                id: {
                    value: userId
                },
                name: {
                    value: userName
                },
                email: {
                    value: userEmail
                },
                country: {
                    value: "US",
                    allow_modify: false
                }
            },
            purchase: {
                items: [
                    {
                        sku: sku,
                        quantity: quantity
                    }
                ]
            },
            settings: {
                language: "en",
                external_id: externalId,
                currency: currency,
                payment_method: paymentMethod,
                return_url: returnUrl,
                ui: {
                    theme: "63295aab2e47fab76f7708e3"
                }
            }
        };

        const xsollaResponse = await fetch(
            `https://store.xsolla.com/api/v2/project/${projectId}/admin/payment/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${Buffer.from(`${merchantId}:${apiKey}`).toString('base64')}`
                },
                body: JSON.stringify(xsollaRequestBody)
            }
        );

        if (!xsollaResponse.ok) {
            const errorData = await xsollaResponse.text();
            console.error("Xsolla API Error:", errorData);
            return res.status(xsollaResponse.status).json({
                error: "Failed to create payment token",
                details: errorData
            });
        }

        const tokenData: XsollaTokenResponse = await xsollaResponse.json();

        return res.status(200).json({
            success: true,
            token: tokenData.token,
            orderId: tokenData.order_id
        });

    } catch (error) {
        console.error("Payment token creation error:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}