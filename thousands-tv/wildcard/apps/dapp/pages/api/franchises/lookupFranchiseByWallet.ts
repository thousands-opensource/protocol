import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { IUser, UserRole } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { usersModel } from "@repo/schemas";
import { diContainer } from "@/inversify.config";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import IUserSponsoredEventRepository from "@/repositories/interfaces/IUserSponsoredEventRepository";
import { Types } from "mongoose";

type UserNftsPayload = {
    nfts?: {
        nftAddress?: string;
        tokenId?: string;
        startDate?: string | null;
        endDate?: string | null;
    }[];
};

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
    }

    const { walletAddress } = req.body as { walletAddress?: string };
    const normalizedWallet = walletAddress?.toString().trim().toLowerCase();
    if (!normalizedWallet) {
        return sendApiResponse(res, {
            success: false,
            err: "Missing walletAddress",
        });
    }

    try {
        await connectToDb();

        const walletRegex = new RegExp(
            `^${normalizedWallet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
        );
        const matchedUser = await usersModel
            .findOne({
                $or: [
                    { "walletProvider.address": walletRegex },
                    { "walletProvider.additionalWallets": walletRegex },
                ],
            })
            .lean<(IUser & { _id: Types.ObjectId }) | null>();

        if (!matchedUser?._id) {
            return sendApiResponse(res, {
                success: false,
                err: "User not found for wallet address",
            });
        }

        const primaryWallet =
            matchedUser?.walletProvider?.address?.toString().toLowerCase() ??
            "";
        const additionalWallets =
            matchedUser?.walletProvider?.additionalWallets?.map(
                (address: string) => address?.toString().toLowerCase()
            ) ?? [];

        const walletAddresses = Array.from(
            new Set([primaryWallet, ...additionalWallets].filter(Boolean))
        );

        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );
        const userSponsoredEventRepository =
            diContainer.get<IUserSponsoredEventRepository>(
                "IUserSponsoredEventRepository"
            );

        const franchisePayload =
            await franchiseCacheRepository.getFranchise(
                matchedUser._id.toString()
            );
        let franchiseData: any = null;
        if (franchisePayload) {
            try {
                franchiseData = JSON.parse(franchisePayload);
            } catch (error) {
                console.error("Failed to parse franchise payload", error);
            }
        }

        const aggregatedNfts: UserNftsPayload["nfts"] = [];
        for (const address of walletAddresses) {
            const payload = await franchiseCacheRepository.getUserNfts(
                address
            );
            if (!payload) {
                continue;
            }
            try {
                const parsed = JSON.parse(payload) as UserNftsPayload;
                if (Array.isArray(parsed?.nfts)) {
                    aggregatedNfts.push(...parsed.nfts);
                }
            } catch (error) {
                console.error("Failed to parse user NFTs payload", error);
            }
        }

        let totalWc = 0;
        for (const address of walletAddresses) {
            const wcBalanceRaw =
                await franchiseCacheRepository.getUserWc(address);
            const wcBalance = Number(wcBalanceRaw ?? 0);
            if (Number.isFinite(wcBalance)) {
                totalWc += wcBalance;
            }
        }

        const sponsorships =
            await userSponsoredEventRepository.getSponsoredEventsByUserId(
                matchedUser._id.toString()
            );

        return sendApiResponse(res, {
            success: true,
            data: {
                user: matchedUser,
                franchise: franchiseData,
                walletAddresses,
                nfts: aggregatedNfts,
                wcTotal: totalWc,
                sponsorships,
            },
        });
    } catch (error) {
        console.error("Failed to lookup franchise data", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to lookup franchise data",
        });
    }
}

export default authorize(handler, [UserRole.ADMIN, UserRole.ORGANIZER]);
