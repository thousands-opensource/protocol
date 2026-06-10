import {
    Alchemy,
    AssetTransfersCategory,
    AssetTransfersParams,
    AssetTransfersResponse,
    AssetTransfersResult,
} from "alchemy-sdk";

export async function getToAndFromTransfersForOwner(
    alchemy: Alchemy,
    walletAddress: string,
    contractAddresses: string[],
    latestBlockNumber: number,
    categories: AssetTransfersCategory[]
): Promise<AssetTransfersResult[]> {
    let totalTransfers: AssetTransfersResult[] = [];

    const toTransfersPromise = getAssetTransfers(
        alchemy,
        "",
        walletAddress,
        contractAddresses,
        latestBlockNumber,
        categories
    );
    const fromTransfersPromise = getAssetTransfers(
        alchemy,
        walletAddress,
        "",
        contractAddresses,
        latestBlockNumber,
        categories
    );
    const [toTransfers, fromTransfers] = await Promise.all([
        toTransfersPromise,
        fromTransfersPromise,
    ]);
    totalTransfers.push(...toTransfers, ...fromTransfers);
    return totalTransfers;
}

export async function getAssetTransfers(
    alchemy: Alchemy,
    fromAddress: string,
    toAddress: string,
    contractAddresses: string[],
    latestBlockNumber: number,
    categories: AssetTransfersCategory[]
): Promise<AssetTransfersResult[]> {
    let keepFetching = true;
    let currPageKey;
    const totalTransfers: AssetTransfersResult[] = [];
    while (keepFetching) {
        let params: AssetTransfersParams = {
            fromBlock: `0x${latestBlockNumber.toString(16)}`,
            contractAddresses,
            excludeZeroValue: true,
            category: categories,
            withMetadata: false,
            pageKey: currPageKey,
        };
        if (fromAddress) {
            params.fromAddress = fromAddress;
        }
        if (toAddress) {
            params.toAddress = toAddress;
        }
        let { transfers, pageKey }: AssetTransfersResponse =
            await alchemy.core.getAssetTransfers(params);

        totalTransfers.push(...transfers);

        if (pageKey) {
            currPageKey = pageKey;
        } else {
            keepFetching = false;
        }
    }

    return totalTransfers;
}
