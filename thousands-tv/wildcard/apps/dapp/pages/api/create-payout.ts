import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import ProtocolPayoutRepository from "@/repositories/implementations/mongodb/protocolPayoutRepository";
import StreamerStatsRepository from "@/repositories/implementations/mongodb/streamerStatsRepository";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { createThousandsPayout, validateThousandsProtocolConfig } from "@/services/thousandsPayoutService";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: "Method not allowed",
        });
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleCreatePayout(req, user);
        sendApiResponse(res, war);
    } catch (error: any) {
        console.error("Error creating payout:", error);
        sendApiResponse(res, {
            success: false,
            err: error.message || "Internal server error",
        });
    }
}

async function handleCreatePayout(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const twitchChannelName = user.twitchProvider?.name;
    const { recipientAddress } = req.body;

    if (!twitchChannelName) {
        return {
            success: false,
            err: "User must have a connected Twitch account",
        };
    }

    if (!user.walletProvider?.address) {
        return {
            success: false,
            err: "You must connect a wallet to receive payouts. Please link your wallet in the dashboard first.",
        };
    }

    const userWallets = [
        user.walletProvider.address,
        ...(user.walletProvider.additionalWallets || [])
    ];

    if (!recipientAddress || !userWallets.includes(recipientAddress.toLowerCase()) && !userWallets.includes(recipientAddress)) {
        return {
            success: false,
            err: "Invalid recipient address. Please select one of your connected wallets.",
        };
    }

    const configValidation = validateThousandsProtocolConfig();
    if (!configValidation.isValid) {
        console.error("Thousands Protocol configuration error:", configValidation.error);
        return {
            success: false,
            err: "Payment system is temporarily unavailable. Please try again later.",
        };
    }

    if (!user.walletProvider?.address) {
        return {
            success: false,
            err: "You must connect a wallet to receive payouts. Please link your wallet in the dashboard first.",
        };
    }

    const streamerStatsRepo = new StreamerStatsRepository();
    const unpaidStreamerStats = await streamerStatsRepo.findUnpaidByChannelNameAndPlatform(twitchChannelName, 'twitch');

    const totalHoursWatched = unpaidStreamerStats.reduce(
        (sum, stat) => sum + stat.hoursWatched,
        0
    );

    if (totalHoursWatched === 0) {
        return {
            success: false,
            err: "No unpaid hours available for payout",
        };
    }

    const payoutAmount = totalHoursWatched * 0.00617;

    try {
        const payoutResult = await createThousandsPayout({
            user,
            twitchChannelName,
            hoursWatched: totalHoursWatched,
            payoutAmount,
            recipientAddress
        });

        if (!payoutResult.success) {
            console.error("Thousands Protocol payout failed:", payoutResult.error);
            return {
                success: false,
                err: payoutResult.error || "Failed to process payout on blockchain",
            };
        }

        const payoutData: any = {
            userId: user._id,
            twitchChannelName,
            hoursWatched: totalHoursWatched,
            payoutAmount,
            transactionHash: payoutResult.transactionHash,
            distributionId: payoutResult.distributionId,
            valueUSDC: payoutAmount,
            type: "streamer_payout",
            isPaid: true,
        };

        const payout = await ProtocolPayoutRepository.createPayout(payoutData);

        const statIds = unpaidStreamerStats.map(stat => stat._id);
        await streamerStatsRepo.markAsPaidOut(statIds);

        return {
            success: true,
            data: {
                ...(payout as any).toObject(),
                transactionHash: payoutResult.transactionHash,
                distributionId: payoutResult.distributionId
            },
        };

    } catch (error: any) {
        console.error("Error creating payout:", error);
        return {
            success: false,
            err: error.message || "Internal server error during payout creation",
        };
    }
}

export default authorize(handler);
