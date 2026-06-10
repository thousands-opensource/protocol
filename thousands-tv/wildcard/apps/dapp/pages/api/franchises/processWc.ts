import { NextApiRequest, NextApiResponse } from "next";
import {
    AssetTransfersCategory,
    AssetTransfersWithMetadataResult,
    Network,
    SortingOrder,
} from "alchemy-sdk";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import { diContainer } from "@/inversify.config";
import { getAlchemyProvider } from "@/utils/backend/alchemyUtil";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";

export const config = {
    maxDuration: 120,
};

const WC_CONTRACT_ADDRESS =
    "0x0290a3256c939F3Acb6CA5465154d94133DC5e02".toLowerCase();
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BIGINT_ZERO = BigInt(0);
const BIGINT_TEN = BigInt(10);

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
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

    try {
        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );

        const alchemy = getAlchemyProvider(Network.ARB_MAINNET);
        if (!alchemy) {
            return sendApiResponse(res, {
                success: false,
                err: "Alchemy provider unavailable for Arbitrum network",
            });
        }

        const expectedTotalWcRaw =
            typeof req.body?.expectedTotalWc === "number"
                ? req.body.expectedTotalWc
                : null;

        const forceFullScan = req.body?.forceFullScan === true;
        const checkpoint = forceFullScan
            ? null
            : await franchiseCacheRepository.getWcCheckpoint();
        const currentBlock = await alchemy.core.getBlockNumber();

        if (checkpoint && checkpoint.lastBlock >= currentBlock) {
            console.log(
                `Skipping WC scan: checkpoint block ${checkpoint.lastBlock} is at or ahead of current block ${currentBlock}`
            );
            return sendApiResponse(res, { success: true });
        }

        const fromBlockHex = checkpoint
            ? `0x${(checkpoint.lastBlock + 1).toString(16)}`
            : "0x0";
        const toBlockHex = `0x${currentBlock.toString(16)}`;

        const initialBalances: Record<string, bigint> = checkpoint
            ? Object.fromEntries(
                Object.entries(checkpoint.balances).map(([addr, val]) => [addr, BigInt(val)])
              )
            : {};
        const initialDecimals: number | null = checkpoint?.decimals ?? null;

        console.log(checkpoint
            ? `Incremental WC scan: blocks ${checkpoint.lastBlock + 1} to ${currentBlock}`
            : `Full WC scan: blocks 0 to ${currentBlock}`
        );

        const transfers = await fetchAllWcTransfers(alchemy, fromBlockHex, toBlockHex);
        const { balances, decimals } = buildOwnerBalances(transfers, initialBalances, initialDecimals);
        const owners = convertBalancesToOwners(balances, decimals);
        const totalWc = owners.reduce(
            (sum, owner) => sum + owner.quantityOfWc,
            0
        );

        if (expectedTotalWcRaw !== null) {
            if (!Number.isFinite(expectedTotalWcRaw) || expectedTotalWcRaw <= 0) {
                return sendApiResponse(res, {
                    success: false,
                    err: "expectedTotalWc must be a positive number",
                });
            }

            if (totalWc < expectedTotalWcRaw) {
                return sendApiResponse(res, {
                    success: false,
                    err: `Total WC (${totalWc}) is below expectedTotalWc (${expectedTotalWcRaw})`,
                });
            }
        }

        console.log(`Processing ${owners.length} WC owners into cache`);

        const batchSize = 500;
        for (let i = 0; i < owners.length; i += batchSize) {
            const batch = owners.slice(i, i + batchSize).map((owner) => ({
                ownerWalletAddress: owner.owner,
                balance: owner.quantityOfWc,
            }));
            await franchiseCacheRepository.addUserWcBatch(batch);
            console.log(`Processed WC owners ${i + 1} to ${Math.min(i + batchSize, owners.length)} of ${owners.length}`);
        }

        console.log(`Total WC holders processed: ${owners.length}, Total WC: ${totalWc}`);

        await franchiseCacheRepository.setProcessedWc(
            JSON.stringify({ owners })
        );

        const serializedBalances: Record<string, string> = Object.fromEntries(
            Object.entries(balances)
                .filter(([, val]) => val !== BIGINT_ZERO)
                .map(([addr, val]) => [addr, val.toString()])
        );
        await franchiseCacheRepository.setWcCheckpoint({
            lastBlock: currentBlock,
            balances: serializedBalances,
            decimals,
        });

        console.log(`Saved WC checkpoint at block ${currentBlock}`);
        console.log("Successfully processed $WC balances");

        return sendApiResponse(res, { success: true });
    } catch (error) {
        const err =
            error instanceof Error
            ? error
            : new Error(typeof error === "string" ? error : JSON.stringify(error));

        console.error("Failed to process $WC balances", {
            message: err.message,
            stack: err.stack,
            raw: error,
        });

        return sendApiResponse(res, {
            success: false,
            err: err.message || "Failed to process $WC balances",
        });
    }
}

async function fetchAllWcTransfers(
    alchemy: ReturnType<typeof getAlchemyProvider>,
    fromBlock: string,
    toBlock: string
) {
    const transfers: AssetTransfersWithMetadataResult[] = [];
    if (!alchemy) {
        return transfers;
    }

    let pageKey: string | undefined;

    do {
        const {
            transfers: pageTransfers,
            pageKey: nextPageKey,
        } = await alchemy.core.getAssetTransfers({
            contractAddresses: [WC_CONTRACT_ADDRESS],
            category: [AssetTransfersCategory.ERC20],
            withMetadata: true,
            fromBlock,
            toBlock,
            maxCount: 1000,
            order: SortingOrder.ASCENDING,
            pageKey,
        });

        transfers.push(...pageTransfers);
        pageKey = nextPageKey;
    } while (pageKey);

    return transfers;
}

function buildOwnerBalances(
    transfers: AssetTransfersWithMetadataResult[],
    initialBalances: Record<string, bigint> = {},
    initialDecimals: number | null = null
) {
    const balances: Record<string, bigint> = { ...initialBalances };
    let tokenDecimals: number | null = initialDecimals;

    for (const transfer of transfers) {
        const amount = parseTransferAmount(transfer);
        if (amount <= BIGINT_ZERO) continue;

        if (tokenDecimals === null) {
            const parsedDecimals = parseDecimals(transfer);
            if (parsedDecimals !== null) {
                tokenDecimals = parsedDecimals;
            }
        }

        const fromAddress = normalizeAddress(transfer.from);
        const toAddress = normalizeAddress(transfer.to);

        if (fromAddress && fromAddress !== ZERO_ADDRESS) {
            balances[fromAddress] =
                (balances[fromAddress] ?? BIGINT_ZERO) - amount;
        }

        if (toAddress && toAddress !== ZERO_ADDRESS) {
            balances[toAddress] =
                (balances[toAddress] ?? BIGINT_ZERO) + amount;
        }
    }

    return { balances, decimals: tokenDecimals ?? 0 };
}

function convertBalancesToOwners(
    balances: Record<string, bigint>,
    decimals: number
) {
    return Object.entries(balances)
        .filter(([, balance]) => balance > BIGINT_ZERO)
        .map(([owner, balance]) => ({
            owner,
            quantityOfWc: decimalStringToNumber(
                convertBaseUnitsToDecimalString(balance, decimals)
            ),
        }))
        .filter((entry) => entry.quantityOfWc > 0)
        .sort((a, b) => b.quantityOfWc - a.quantityOfWc);
}

function parseTransferAmount(
    transfer: AssetTransfersWithMetadataResult
): bigint {
    const rawValue = transfer.rawContract?.value;
    if (!rawValue) {
        return BIGINT_ZERO;
    }
    try {
        return BigInt(rawValue);
    } catch {
        return BIGINT_ZERO;
    }
}

function parseDecimals(transfer: AssetTransfersWithMetadataResult) {
    const decimal = transfer.rawContract?.decimal;
    if (!decimal) {
        return null;
    }
    try {
        return parseInt(decimal, 16);
    } catch {
        return null;
    }
}

function normalizeAddress(address?: string | null) {
    return address ? address.toLowerCase() : null;
}

function convertBaseUnitsToDecimalString(value: bigint, decimals: number) {
    if (decimals <= 0) {
        return value.toString();
    }
    const divisor = powBigInt(BIGINT_TEN, decimals);
    const whole = value / divisor;
    const fraction = value % divisor;
    if (fraction === BIGINT_ZERO) {
        return whole.toString();
    }
    const fractionStr = fraction
        .toString()
        .padStart(decimals, "0")
        .replace(/0+$/, "");
    return `${whole.toString()}.${fractionStr}`;
}

function decimalStringToNumber(value: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        return 0;
    }
    return numeric;
}

function powBigInt(base: bigint, exponent: number) {
    if (exponent <= 0) {
        return BigInt(1);
    }
    let result = BigInt(1);
    for (let i = 0; i < exponent; i++) {
        result *= base;
    }
    return result;
}

export default handler;
