import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { authorize } from "../middleware/authorization";
import { UserRole, USERS } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import {
    playerEarningsTransactionModel,
    playerEarningsModel,
} from "@repo/schemas";

export const config = {
    maxDuration: 300, // seconds
};

function toCsvValue(value: string | number | null | undefined) {
    const raw = value === null || value === undefined ? "" : String(value);
    if (raw.includes("\"") || raw.includes(",") || raw.includes("\n")) {
        return `"${raw.replace(/\"/g, "\"\"")}"`;
    }
    return raw;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} not allowed.`,
        });
    }

    const { cutoffDate, preview = true } = req.body ?? {};
    const cutoff = cutoffDate ? new Date(cutoffDate) : null;

    if (!cutoff || Number.isNaN(cutoff.getTime())) {
        return res.status(400).json({
            success: false,
            message: "cutoffDate is required and must be a valid datetime.",
        });
    }

    await connectToDb();

    const results = await playerEarningsTransactionModel.aggregate<{
        gamerTag: string;
        competitorStripeId: string;
        userId: string;
        beamableProviderId: string;
        discordProviderId: string;
        discordProviderName: string;
        discordProviderEmail: string;
        amount: number;
    }>([
        {
            $match: {
                createdAt: { $lt: cutoff },
            },
        },
        {
            $group: {
                _id: "$gamerTag",
                amount: { $sum: "$amount" },
            },
        },
        {
            $lookup: {
                from: USERS,
                let: { gamerTag: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$beamableProvider.id",
                                            "$$gamerTag",
                                        ],
                                    },
                                    { $eq: ["$payoutMethod", "USD"] },
                                    {
                                        $eq: [
                                            "$stripeConnectedAccountEnabled",
                                            true,
                                        ],
                                    },
                                ],
                            },
                            "competitorStripeId": { $exists: true, $ne: "" },
                        },
                    },
                ],
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: 0,
                gamerTag: "$_id",
                userId: "$user._id",
                beamableProviderId: "$user.beamableProvider.id",
                discordProviderId: "$user.discordProvider.id",
                discordProviderName: "$user.discordProvider.name",
                discordProviderEmail: "$user.discordProvider.email",
                competitorStripeId: "$user.competitorStripeId",
                amount: 1,
            },
        },
        { $sort: { competitorStripeId: 1 } },
    ]);

    const positiveResults = results.filter(
        (row) => Number.isFinite(row.amount) && row.amount > 0
    );

    const header =
        "competitorStripeId,amount,userId,beamableProviderId,discordProviderId,discordProviderName,discordProviderEmail";
    const rows = positiveResults.map((row) =>
        [
            toCsvValue(row.competitorStripeId),
            toCsvValue((Number(row.amount) / 100).toFixed(2)),
            toCsvValue(row.userId),
            toCsvValue(row.beamableProviderId),
            toCsvValue(row.discordProviderId),
            toCsvValue(row.discordProviderName),
            toCsvValue(row.discordProviderEmail),
        ].join(",")
    );
    const csv = [header, ...rows].join("\n");

    if (!preview) {
        const payoutBatchId = randomUUID();
        const session = await playerEarningsTransactionModel.startSession();
        try {
            await session.withTransaction(async () => {
                const payoutRows = positiveResults
                    .map((row) => ({
                        gamerTag: row.gamerTag,
                        type: "payout",
                        tournamentId: payoutBatchId,
                        amount: 0 - Number(row.amount),
                    }))
                    .filter(
                        (row) =>
                            row.gamerTag &&
                            Number.isFinite(row.amount) &&
                            row.amount !== 0
                    );

                if (payoutRows.length) {
                    await playerEarningsTransactionModel.create(payoutRows, {
                        session,
                    });
                }

                const gamerTags = Array.from(
                    new Set(
                        payoutRows
                            .map((row) => row.gamerTag)
                            .filter(Boolean)
                    )
                );

                if (gamerTags.length) {
                    const totals = await playerEarningsTransactionModel
                        .aggregate<{ _id: string; total: number }>([
                            { $match: { gamerTag: { $in: gamerTags } } },
                            { $group: { _id: "$gamerTag", total: { $sum: "$amount" } } },
                        ])
                        .session(session);

                    const bulkUpdates = totals.map((entry) => ({
                        updateOne: {
                            filter: { gamerTag: entry._id },
                            update: {
                                $set: { earnings: entry.total },
                                $setOnInsert: { gamerTag: entry._id, claimed: 0 },
                            },
                            upsert: true,
                        },
                    }));

                    if (bulkUpdates.length) {
                        await playerEarningsModel.bulkWrite(bulkUpdates, {
                            session,
                        });
                    }
                }
            });
        } finally {
            await session.endSession();
        }
    }

    const safeTimestamp = cutoff
        .toISOString()
        .replace(/[:.]/g, "-");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="usd-payout-preview-${safeTimestamp}.csv"`
    );

    return res.status(200).send(csv);
}

export default authorize(handler, [UserRole.ADMIN, UserRole.ORGANIZER]);
