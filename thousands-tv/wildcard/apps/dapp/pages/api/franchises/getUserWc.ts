import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import { diContainer } from "@/inversify.config";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import { sendApiResponse } from "@/utils/backend/apiUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const primaryWalletAddress =
            user?.walletProvider?.address?.toString().toLowerCase() ?? "";
        const additionalWallets = (
            user?.walletProvider?.additionalWallets ?? []
        )
            .map((address: string) => address?.toString().toLowerCase())
            .filter(Boolean);

        const walletAddresses = Array.from(
            new Set([primaryWalletAddress, ...additionalWallets].filter(Boolean))
        );

        if (!walletAddresses.length) {
            return sendApiResponse(res, {
                success: true,
                data: { wcBalance: 0 },
            });
        }

        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );

        let totalBalance = 0;
        for (const walletAddress of walletAddresses) {
            const wcBalanceRaw =
                await franchiseCacheRepository.getUserWc(walletAddress);
            const wcBalance = Number(wcBalanceRaw ?? 0);
            if (Number.isFinite(wcBalance)) {
                totalBalance += wcBalance;
            }
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                wcBalance: Number.isFinite(totalBalance) ? totalBalance : 0,
            },
        });
    } catch (error) {
        console.error("Failed to get user WC balance", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to get user WC balance",
        });
    }
}

export default authorize(handler);
