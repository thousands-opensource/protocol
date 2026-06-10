import { getBlockExplorerUrl } from "@/utils/environmentUtil";

/**
 * Return a link to the Block Explorer for a specific transaction
 * @param txnHash hash of the transaction
 * @returns URL to that transaction on the block explorer
 */
export function getBlockExplorerTxUrl(txnHash?: string) {
    const blockExplorerUrl = getBlockExplorerUrl();
    return `${blockExplorerUrl}/tx/${txnHash}`;
}
