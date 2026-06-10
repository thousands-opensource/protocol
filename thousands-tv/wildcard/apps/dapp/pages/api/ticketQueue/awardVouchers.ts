// pages/api/ticketQueue/awardVouchers.ts

import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { TicketTierType } from "@repo/interfaces";
import { TicketQueueRepository } from "@/repositories/implementations/mongodb/ticketQueueRepository";
import { authorize } from "@/pages/api/middleware/authorization";

/**
 * API endpoint to award vouchers to eligible users in the ticket queue
 * @param req
 * @param res
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { seriesId, numberOfVouchersToAward, tier } = req.body;

    if (!seriesId || !numberOfVouchersToAward || !tier) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        const ticketQueueRepository = diContainer.get<TicketQueueRepository>(
            "ITicketQueueRepository"
        );

        const awardedUsers =
            await ticketQueueRepository.awardVouchersToEligibleUsers(
                seriesId,
                numberOfVouchersToAward,
                tier as TicketTierType
            );

        return res.status(200).json({
            message: "Vouchers awarded successfully",
            awardedUsers,
        });
    } catch (error) {
        console.error("Error awarding vouchers:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default authorize(handler);
