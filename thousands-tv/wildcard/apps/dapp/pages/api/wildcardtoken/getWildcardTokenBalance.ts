import type { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import { getBaseErc20TokenBalances } from "@/utils/backend/alchemyUtil";
import { diContainer } from "@/inversify.config";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import { BigNumber, utils } from "ethers";

const WILDCARD_TOKEN_CONTRACT = "0x4c462Eb3DE6b30Fd9deca1f8aa5F6bfC4f879056";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    return sendApiResponseWithStatusCode(
        res,
        {
            success: false,
            err: "This endpoint is disabled.",
        },
        403
    );
    /*
    if (req.method !== "GET") {
        return sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: `Method ${req.method} Not Allowed`,
            },
            405
        );
    }

    const userIdParam = req.query.userId;
    const resetParam = req.query.reset;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const shouldResetCache = (() => {
        const isTruthy = (value: string) =>
            value.toLowerCase() === "true" || value === "1";
        if (Array.isArray(resetParam)) {
            return resetParam.some(
                (value) => typeof value === "string" && isTruthy(value)
            );
        }
        return typeof resetParam === "string" && isTruthy(resetParam);
    })();

    if (!userId || typeof userId !== "string") {
        return sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "Missing or invalid userId parameter",
            },
            400
        );
    }

    try {
        await connectToDb();

        const userRepository =
            diContainer.get<IUserRepository>("IUserRepository");
        const user = await userRepository.findUserById(userId);

        if (!user) {
            return sendApiResponseWithStatusCode(
                res,
                {
                    success: false,
                    err: "User not found",
                },
                404
            );
        }

        const walletAddresses = [
            user.walletProvider?.address,
            ...(user.walletProvider?.additionalWallets || []),
        ].filter((address): address is string => !!address);

        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );

        if (shouldResetCache) {
            await franchiseCacheRepository.clearFranchiseSalaryCap(userId);
        } else {
            const cachedBalance =
                await franchiseCacheRepository.getFranchiseSalaryCap(userId);
            if (cachedBalance !== null) {
                const formattedBalance = utils.formatUnits(
                    BigNumber.from(cachedBalance),
                    18
                );

                return sendApiResponse(res, {
                    success: true,
                    data: {
                        totalBalance: cachedBalance,
                        formattedBalance,
                        walletAddresses,
                        cacheHit: true,
                    },
                });
            }
        }

        if (walletAddresses.length === 0) {
            await franchiseCacheRepository.setFranchiseSalaryCap(userId, "0");
            return sendApiResponse(res, {
                success: true,
                data: {
                    totalBalance: "0",
                    formattedBalance: "0",
                    walletAddresses,
                },
            });
        }

        const targetContract = WILDCARD_TOKEN_CONTRACT.toLowerCase();
        let totalBalance = BigNumber.from(0);

        for (const address of walletAddresses) {
            try {
                const balances =
                    (await getBaseErc20TokenBalances(address, [
                        WILDCARD_TOKEN_CONTRACT,
                    ])) || [];

                const wildcardBalance = balances.find(
                    (tokenBalance) =>
                        tokenBalance?.contractAddress?.toLowerCase() ===
                        targetContract
                );

                if (wildcardBalance?.tokenBalance) {
                    totalBalance = totalBalance.add(
                        BigNumber.from(wildcardBalance.tokenBalance)
                    );
                }
            } catch (alchemyError) {
                console.error(
                    `Failed to fetch Wildcard token balance for wallet ${address}`,
                    alchemyError
                );
            }
        }

        const formattedBalance = utils.formatUnits(totalBalance, 18);

        await franchiseCacheRepository.setFranchiseSalaryCap(
            userId,
            totalBalance.toString()
        );

        return sendApiResponse(res, {
            success: true,
            data: {
                totalBalance: totalBalance.toString(),
                formattedBalance,
                walletAddresses,
            },
        });
    } catch (error) {
        console.error("Failed to fetch Wildcard token balance", error);
        return sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "Failed to fetch Wildcard token balance",
            },
            500
        );
    }
    */
}
