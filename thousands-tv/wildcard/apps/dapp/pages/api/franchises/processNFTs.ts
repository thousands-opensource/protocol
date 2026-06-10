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
import INftsToProcessRepository from "@/repositories/interfaces/INftsToProcess";
import {
    getAlchemyProvider,
    getOwnersForContract,
    getOwnersWithQtyFor1155TokenId,
} from "@/utils/backend/alchemyUtil";
import {
    buildBalancesFromLogsForOwners,
    collectLogsForContract,
} from "@/utils/backend/alchemyLogUtil";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";

export const config = {
    maxDuration: 120,
};

type HoldingPeriod = {
    startDate: string | null;
    endDate: string | null;
};

type OwnerNftHolding = {
    nftAddress: string;
    tokenId: string;
    quantity: string; // keep as string for big-number safety
    holdings: HoldingPeriod[];
};

type OwnerHoldings = {
    owner: string;
    nfts: OwnerNftHolding[];
};

const chainIdToNetwork: Record<string, Network> = {
    "1": Network.ETH_MAINNET,
    "137": Network.MATIC_MAINNET,
    "8453": Network.BASE_MAINNET,
    "42161": Network.ARB_MAINNET,
};

const BAD_MINT_CONTRACT_ADDRESS =
    "0x523edfb68d10c046dcc41a43e210f52a29e8c0d4";
const BAD_MINT_TOKEN_ID = "1";
const BAD_MINT_START_DATE = "2026-03-10T07:19:27.000Z";
const BAD_MINT_WALLET_ADDRESS =
    "0x64288c0881acbedc4bbdc4d7fee785f7dda54716";

const BAD_MINT_TOKEN_ID2 = "4";
const BAD_MINT_START_DATE2 = "2026-03-24T19:13:07.000Z";
const BAD_MINT_WALLET_ADDRESS2 =
    "0x23d558fd89e12798bf4f7c2ef16451865847c7ad";

const BAD_MINT_TOKEN_ID3 = "4";
const BAD_MINT_START_DATE3 = "2026-03-25T04:27:52.000Z";
const BAD_MINT_WALLET_ADDRESS3 =
    "0x64288c0881acbedc4bbdc4d7fee785f7dda54716";
    

function shouldFixBadMintToken(
    nftAddress?: string,
    tokenId?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    owner?: string | null
) {
    if (!nftAddress || !tokenId) {
        return false;
    }
    return (
        nftAddress.toLowerCase() === BAD_MINT_CONTRACT_ADDRESS &&
        tokenId.toString() === BAD_MINT_TOKEN_ID &&
        startDate === BAD_MINT_START_DATE &&
        (endDate === null || endDate === undefined) &&
        (owner?.toLowerCase() ?? "") === BAD_MINT_WALLET_ADDRESS
    );
}

function shouldFixBadMintToken2(
    nftAddress?: string,
    tokenId?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    owner?: string | null
) {
    if (!nftAddress || !tokenId) {
        return false;
    }
    return (
        nftAddress.toLowerCase() === BAD_MINT_CONTRACT_ADDRESS &&
        tokenId.toString() === BAD_MINT_TOKEN_ID2 &&
        startDate === BAD_MINT_START_DATE2 &&
        (endDate === null || endDate === undefined) &&
        (owner?.toLowerCase() ?? "") === BAD_MINT_WALLET_ADDRESS2
    );
}

function shouldFixBadMintToken3(
    nftAddress?: string,
    tokenId?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    owner?: string | null
) {
    if (!nftAddress || !tokenId) {
        return false;
    }
    return (
        nftAddress.toLowerCase() === BAD_MINT_CONTRACT_ADDRESS &&
        tokenId.toString() === BAD_MINT_TOKEN_ID3 &&
        startDate === BAD_MINT_START_DATE3 &&
        (endDate === null || endDate === undefined) &&
        (owner?.toLowerCase() ?? "") === BAD_MINT_WALLET_ADDRESS3
    );
}

function getFixedTokenId(
    nftAddress?: string,
    tokenId?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    owner?: string | null
) {
    if (
        shouldFixBadMintToken(
            nftAddress,
            tokenId,
            startDate,
            endDate,
            owner
        )
    ) {
        return "0";
    }
    if (
        shouldFixBadMintToken2(
            nftAddress,
            tokenId,
            startDate,
            endDate,
            owner
        )
    ) {
        return "5";
    }
    if (
        shouldFixBadMintToken3(
            nftAddress,
            tokenId,
            startDate,
            endDate,
            owner
        )
    ) {
        return "5";
    }
    return tokenId?.toString() ?? "";
}

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
        const nftsToProcessRepository =
            diContainer.get<INftsToProcessRepository>(
                "INftsToProcessRepository"
            );
        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );

        const nftsToProcess =
            await nftsToProcessRepository.getActiveNFTsToProcess();
        const expectedCountsByContract: Record<string, number> = {};

        console.log("NFTS TO PROCESS:");
        console.log(nftsToProcess);

        // group NFTs by network for batching
        const nftsByNetwork = new Map<Network, typeof nftsToProcess>();
        for (const nft of nftsToProcess) {
            const network = chainIdToNetwork[nft.chainId];
            if (!network) {
                console.warn(
                    `Skipping NFT ${nft.nftName} (${nft.address}) due to unsupported chainId: ${nft.chainId}`
                );
                continue;
            }

            if (!nftsByNetwork.has(network)) {
                nftsByNetwork.set(network, []);
            }
            nftsByNetwork.get(network)!.push(nft);

            const normalizedContract = nft.address?.toLowerCase();
            if (
                normalizedContract &&
                typeof nft.expectedTokenCount === "number" &&
                Number.isFinite(nft.expectedTokenCount) &&
                nft.expectedTokenCount > 0
            ) {
                expectedCountsByContract[normalizedContract] = Math.max(
                    expectedCountsByContract[normalizedContract] ?? 0,
                    nft.expectedTokenCount
                );
            }
        }

        // owner -> holdings
        const ownersMap: Record<string, OwnerNftHolding[]> = {};
        const seenHoldingKeys = new Set<string>();
        const contractTokenIds: Record<string, Set<string>> = {};
        const registerTokenId = (contract: string, tokenId: string) => {
            if (!tokenId) {
                return;
            }
            if (!contractTokenIds[contract]) {
                contractTokenIds[contract] = new Set();
            }
            contractTokenIds[contract].add(tokenId);
        };
        const addHolding = (owner: string, holding: OwnerNftHolding) => {
            const ownerKey = owner.toLowerCase();
            const contractKey = holding.nftAddress?.toLowerCase() ?? "";
            const tokenKey = holding.tokenId?.toString() ?? "";
            const key = `${ownerKey}|${contractKey}|${tokenKey}`;
            if (seenHoldingKeys.has(key)) {
                return;
            }
            seenHoldingKeys.add(key);
            if (!ownersMap[ownerKey]) {
                ownersMap[ownerKey] = [];
            }
            ownersMap[ownerKey].push(holding);
        };

        console.log("GET TRANSFERS FOR:");
        const networkEntries = Array.from(nftsByNetwork.entries());
        console.log(networkEntries);
        for (const [network, nfts] of networkEntries) {
            const alchemy = getAlchemyProvider(network);
            if (!alchemy) {
                console.warn(`Alchemy provider unavailable for network ${network}`);
                continue;
            }

            // prefetch transfer history per contract
            const transfersByContract: Record<
                string,
                AssetTransfersWithMetadataResult[]
            > = {};

            const uniqueContracts = Array.from(
                new Set(
                    nfts
                        .map((nft) => nft.address?.toLowerCase())
                        .filter(Boolean) as string[]
                )
            );

            for (const contract of uniqueContracts) {
                const transfers = await fetchAllTransfersForContract(
                    alchemy,
                    contract
                );
                transfersByContract[contract] = transfers;
            }

            const nftsByContract = new Map<string, typeof nfts>();
            for (const nft of nfts) {
                const normalizedContract = nft.address?.toLowerCase();
                if (!normalizedContract) {
                    continue;
                }
                if (!nftsByContract.has(normalizedContract)) {
                    nftsByContract.set(normalizedContract, []);
                }
                nftsByContract.get(normalizedContract)!.push(nft);
            }

            for (const [normalizedContract, contractNfts] of Array.from(
                nftsByContract.entries()
            )) {
                const contractAddress =
                    contractNfts.find((entry) => entry.address)?.address ||
                    normalizedContract;
                const scanMethod = contractNfts.some(
                    (entry) =>
                        (entry.scanMethod || "").trim().toLowerCase() ===
                        "fromlogs"
                )
                    ? "fromLogs"
                    : "getNFTs";

                const shouldScanAllTokenIds = contractNfts.some((entry) => {
                    const tokenIdValue =
                        entry.tokenId !== undefined && entry.tokenId !== null
                            ? entry.tokenId.toString().trim()
                            : "";
                    return !tokenIdValue;
                });

                if (shouldScanAllTokenIds) {
                    const ownersForContract = await getOwnersForContract(
                        alchemy,
                        contractAddress
                    );

                    const ownerAddresses = ownersForContract
                        .map((owner) => owner.ownerAddress)
                        .filter(Boolean) as string[];
                    const ownerSet = new Set(
                        ownerAddresses.map((owner) => owner.toLowerCase())
                    );

                    if (scanMethod === "fromLogs") {
                        const startingBlockNumber = contractNfts.reduce(
                            (min, entry) => {
                                const value = Number(entry.startingBlockNumber);
                                if (!Number.isFinite(value)) {
                                    return min;
                                }
                                if (min === null) {
                                    return value;
                                }
                                return Math.min(min, value);
                            },
                            null as number | null
                        );
                        const logs = await collectLogsForContract(
                            alchemy,
                            contractAddress,
                            startingBlockNumber ?? 0
                        );
                        const balancesByOwner =
                            buildBalancesFromLogsForOwners(logs, ownerSet);

                        for (const ownerAddressLower of Array.from(ownerSet)) {
                            const balances =
                                balancesByOwner.get(ownerAddressLower);
                            if (!balances) {
                                continue;
                            }

                            for (const [tokenId, balanceValue] of Array.from(
                                balances.entries()
                            )) {
                                const balanceCount =
                                    parseQuantityValue(balanceValue);
                                if (balanceCount <= 0) {
                                    continue;
                                }

                                const holdings = buildHoldingsForOwner(
                                    transfersByContract[normalizedContract] ||
                                        [],
                                    String(tokenId),
                                    ownerAddressLower
                                );
                                const normalizedHoldings =
                                    ensureHoldingsMatchBalance(
                                        holdings,
                                        balanceCount
                                    );

                                const holding: OwnerNftHolding = {
                                    nftAddress: contractAddress,
                                    tokenId: String(tokenId),
                                    quantity: balanceValue,
                                    holdings: normalizedHoldings,
                                };

                                addHolding(ownerAddressLower, holding);
                                registerTokenId(
                                    normalizedContract,
                                    String(tokenId)
                                );
                            }
                        }
                    } else {
                        for (const o of ownersForContract) {
                            const ownerAddress = o.ownerAddress;
                            if (!ownerAddress) {
                                continue;
                            }
                            const ownerAddressLower =
                                ownerAddress.toLowerCase();
                            const tokenBalances = o.tokenBalances ?? [];

                            for (const tb of tokenBalances) {
                                const tokenId = tb.tokenId;
                                if (tokenId == null) {
                                    continue;
                                }

                                const holdings = buildHoldingsForOwner(
                                    transfersByContract[normalizedContract] ||
                                        [],
                                    String(tokenId),
                                    ownerAddressLower
                                );

                                const holding: OwnerNftHolding = {
                                    nftAddress: contractAddress,
                                    tokenId: String(tokenId),
                                    quantity: String(tb.balance ?? "0"),
                                    holdings,
                                };

                                addHolding(ownerAddressLower, holding);
                                registerTokenId(
                                    normalizedContract,
                                    String(tokenId)
                                );
                            }
                        }
                    }
                }

                for (const nft of contractNfts) {
                    const tokenIdValue =
                        nft.tokenId !== undefined && nft.tokenId !== null
                            ? nft.tokenId.toString().trim()
                            : "";
                    if (!tokenIdValue) {
                        continue;
                    }

                    // returns [{ owner: string, balance: string }]
                    const ownersWithQty =
                        await getOwnersWithQtyFor1155TokenId(
                            alchemy,
                            contractAddress,
                            tokenIdValue
                        );

                    for (const o of ownersWithQty) {
                        if (!o?.owner) continue;
                        const ownerAddress = o.owner.toLowerCase();

                        const holdings = buildHoldingsForOwner(
                            transfersByContract[normalizedContract] || [],
                            tokenIdValue,
                            ownerAddress
                        );

                        const holding: OwnerNftHolding = {
                            nftAddress: contractAddress,
                            tokenId: tokenIdValue,
                            quantity: o.balance,
                            holdings,
                        };

                        addHolding(ownerAddress, holding);
                        registerTokenId(normalizedContract, tokenIdValue);
                    }
                }
            }
        }

        for (const [contract, expectedCount] of Object.entries(
            expectedCountsByContract
        )) {
            const tokenCount = contractTokenIds[contract]?.size ?? 0;
            if (tokenCount < expectedCount) {
                return sendApiResponse(res, {
                    success: false,
                    err: `Token count (${tokenCount}) for ${contract} is below expectedTokenCount (${expectedCount})`,
                });
            }
        }

        // Convert map -> array
        const owners: OwnerHoldings[] = Object.entries(ownersMap).map(
            ([owner, nfts]) => ({
                owner,
                nfts: nfts.map((nft) => {
                    const originalTokenId =
                        nft.tokenId?.toString() ?? "";
                    const fixedTokenId = nft.holdings.reduce(
                        (current, holding) => {
                            const next = getFixedTokenId(
                                nft.nftAddress,
                                nft.tokenId,
                                holding.startDate,
                                holding.endDate,
                                owner
                            );
                            return next !== originalTokenId ? next : current;
                        },
                        originalTokenId
                    );
                    if (fixedTokenId === originalTokenId) {
                        return nft;
                    }
                    return {
                        ...nft,
                        tokenId: fixedTokenId,
                    };
                }),
            })
        );

        const nftEntries = Object.entries(ownersMap).map(([owner, nfts]) => {
            const normalizedOwner = owner.toLowerCase();
            const flatNfts = nfts.flatMap((nft) =>
                nft.holdings.map((holding) => ({
                    nftAddress: nft.nftAddress,
                    tokenId: getFixedTokenId(
                        nft.nftAddress,
                        nft.tokenId,
                        holding.startDate,
                        holding.endDate,
                        owner
                    ),
                    startDate: holding.startDate,
                    endDate: holding.endDate,
                }))
            );
            return {
                ownerWalletAddress: normalizedOwner,
                payload: JSON.stringify({ nfts: flatNfts }),
            };
        });

        const batchSize = 500;
        for (let i = 0; i < nftEntries.length; i += batchSize) {
            const batch = nftEntries.slice(i, i + batchSize);
            await franchiseCacheRepository.addUserNftsBatch(batch);
        }

        const payload = JSON.stringify({ owners });
        await franchiseCacheRepository.setProcessedNfts(payload);

        return sendApiResponse(res, {
            success: true,
        });
    } catch (error) {
        console.error("Failed to process NFTs", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to process NFTs",
        });
    }

}

async function fetchAllTransfersForContract(
    alchemy: ReturnType<typeof getAlchemyProvider>,
    contract: string
) {
    const transfers: AssetTransfersWithMetadataResult[] = [];
    if (!alchemy) {
        return transfers;
    }

    let pageKey: string | undefined = undefined;

    do {
        const {
            transfers: pageTransfers,
            pageKey: nextPageKey,
        }: {
            transfers: AssetTransfersWithMetadataResult[];
            pageKey?: string;
        } = await alchemy.core.getAssetTransfers({
            contractAddresses: [contract],
            category: [
                AssetTransfersCategory.ERC1155,
                AssetTransfersCategory.ERC721,
            ],
            withMetadata: true,
            fromBlock: "0x0",
            maxCount: 1000,
            order: SortingOrder.DESCENDING,
            pageKey,
        });

        transfers.push(...pageTransfers);
        pageKey = nextPageKey;
    } while (pageKey);

    return transfers;
}

function ensureHoldingsMatchBalance(
    holdings: HoldingPeriod[],
    balance: number
) {
    if (!Number.isFinite(balance) || balance <= 0) {
        return holdings;
    }
    const normalizedHoldings = [...holdings];
    while (normalizedHoldings.length < balance) {
        normalizedHoldings.push({
            startDate: null,
            endDate: null,
        });
    }
    return normalizedHoldings;
}

function buildHoldingsForOwner(
    transfers: AssetTransfersWithMetadataResult[],
    tokenId: string,
    owner: string
) {
    const normalizedOwner = owner?.toLowerCase();
    const normalizedTokenId = normalizeTokenIdValue(tokenId);
    if (!normalizedOwner || !normalizedTokenId) {
        return [];
    }

    const relevantTransfers = transfers
        .filter((transfer) =>
            transferIncludesToken(transfer, normalizedTokenId)
        )
        .sort(
            (a, b) =>
                getTimestampMs(a.metadata?.blockTimestamp) -
                getTimestampMs(b.metadata?.blockTimestamp)
        );

    const holdings: HoldingPeriod[] = [];

    for (const transfer of relevantTransfers) {
        const quantity = extractTransferQuantity(
            transfer,
            normalizedTokenId
        );
        if (quantity <= 0) continue;

        const timestamp = getTimestampIso(transfer.metadata?.blockTimestamp);
        const isInbound = transfer.to?.toLowerCase() === normalizedOwner;
        const isOutbound = transfer.from?.toLowerCase() === normalizedOwner;

        if (isInbound) {
            for (let i = 0; i < quantity; i++) {
                holdings.push({
                    startDate: timestamp,
                    endDate: null,
                });
            }
        } else if (isOutbound) {
            let remaining = quantity;
            for (const holding of holdings) {
                if (!holding.endDate) {
                    holding.endDate = timestamp;
                    remaining -= 1;
                }
                if (remaining <= 0) break;
            }
        }
    }

    return holdings;
}

function transferIncludesToken(
    transfer: AssetTransfersWithMetadataResult,
    normalizedTokenId: string
) {
    if (transfer.erc1155Metadata?.length) {
        return transfer.erc1155Metadata.some(
            (meta) =>
                normalizeTokenIdValue(meta.tokenId) === normalizedTokenId
        );
    }

    if (transfer.tokenId) {
        return normalizeTokenIdValue(transfer.tokenId) === normalizedTokenId;
    }

    if (transfer.erc721TokenId) {
        return (
            normalizeTokenIdValue(transfer.erc721TokenId) ===
            normalizedTokenId
        );
    }

    return false;
}

function extractTransferQuantity(
    transfer: AssetTransfersWithMetadataResult,
    normalizedTokenId: string
) {
    if (transfer.erc1155Metadata?.length) {
        const matching = transfer.erc1155Metadata.find(
            (meta) =>
                normalizeTokenIdValue(meta.tokenId) === normalizedTokenId
        );
        const value = parseQuantityValue(matching?.value);
        if (value > 0) {
            return value;
        }
    }

    return 1;
}

function normalizeTokenIdValue(value?: string | null) {
    if (!value) return undefined;
    const trimmed = value.toString().trim();
    try {
        const bigIntValue =
            trimmed.startsWith("0x") || trimmed.startsWith("0X")
                ? BigInt(trimmed)
                : BigInt(trimmed);
        return bigIntValue.toString();
    } catch {
        return trimmed.toLowerCase();
    }
}

function parseQuantityValue(value?: string | null) {
    if (!value) return 0;
    const trimmed = value.toString().trim();
    try {
        const bigIntValue =
            trimmed.startsWith("0x") || trimmed.startsWith("0X")
                ? BigInt(trimmed)
                : BigInt(trimmed);
        const asNumber = Number(bigIntValue);
        return Number.isFinite(asNumber) ? asNumber : 0;
    } catch {
        const numeric = Number(trimmed);
        return Number.isFinite(numeric) ? numeric : 0;
    }
}

function getTimestampMs(timestamp?: string) {
    if (!timestamp) return 0;
    const date = new Date(timestamp);
    const value = date.getTime();
    return Number.isNaN(value) ? 0 : value;
}

function getTimestampIso(timestamp?: string) {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
}

export default handler;
