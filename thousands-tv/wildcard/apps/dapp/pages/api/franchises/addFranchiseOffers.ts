import { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { diContainer } from "@/inversify.config";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import IFranchiseOffersRepository from "@/repositories/interfaces/IFranchiseOffersRepository";

type FranchiseOfferRow = {
    userId?: string;
    epoch?: number;
    offerAmountInCentsUSD?: number;
};

type FranchiseOffersRequest = {
    requestId?: string;
    items?: FranchiseOfferRow[];
};

function parsePayload(body: unknown): FranchiseOffersRequest {
    if (!body) {
        return {};
    }

    const parsed =
        typeof body === "string" ? (JSON.parse(body) as unknown) : body;

    if (typeof parsed !== "object" || !parsed) {
        return {};
    }

    const payload = parsed as FranchiseOffersRequest;
    return {
        requestId:
            typeof payload.requestId === "string"
                ? payload.requestId
                : undefined,
        items: Array.isArray(payload.items) ? payload.items : [],
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} not allowed`,
        });
    }

    const apiKey = req.headers["x-api-key"];
    const serverApiKey = getGameDataApiKey();

    if (!apiKey || !serverApiKey || apiKey !== serverApiKey) {
        return sendApiResponse(res, {
            success: false,
            err: "Unauthorized: Missing or Invalid API key",
        });
    }

    let rows: FranchiseOfferRow[] = [];
    let requestId: string | undefined;

    try {
        const payload = parsePayload(req.body);
        rows = payload.items ?? [];
        requestId = payload.requestId;
    } catch (error) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid request payload.",
        });
    }

    if (!requestId) {
        return sendApiResponse(res, {
            success: false,
            err: "Missing requestId.",
        });
    }

    if (!rows.length) {
        return sendApiResponse(res, {
            success: false,
            err: "No franchise offers provided.",
        });
    }

    const invalidRow = rows.find(
        (row) =>
            !row?.userId ||
            !Types.ObjectId.isValid(row.userId) ||
            !Number.isFinite(Number(row.epoch)) ||
            !Number.isFinite(Number(row.offerAmountInCentsUSD))
    );
    if (invalidRow) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid franchise offers payload.",
        });
    }

    try {
        const franchiseOffersRepository =
            diContainer.get<IFranchiseOffersRepository>(
                "IFranchiseOffersRepository"
            );

        const offersToInsert = rows.map((row) => ({
            userId: new Types.ObjectId(row.userId),
            epoch: Number(row.epoch),
            offerAmount: Number(row.offerAmountInCentsUSD),
        }));

        const inserted =
            await franchiseOffersRepository.addFranchiseOffers(
                offersToInsert
            );

        return sendApiResponse(res, {
            success: true,
            data: {
                requestId,
                insertedCount: inserted.length,
            },
        });
    } catch (error) {
        console.error("Failed to add franchise offers", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to add franchise offers",
        });
    }
}
