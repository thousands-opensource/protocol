import { createPublicClient, http } from "viem";
import { getRpcProvider, isProdEnvironment } from "./environmentUtil";
import { polygonMumbai, polygon } from "viem/chains";

/**
 * https://viem.sh/
 * Retrieves viem.sh public client
 * @returns - public client (the provider in ethers.js)
 */
export function getPublicClient() {
    if (!getRpcProvider()) {
        throw new Error("RPC_PROVIDER not set");
    }

    if (isProdEnvironment()) {
        return createPublicClient({
            chain: polygon,
            transport: http(getRpcProvider()),
        });
    }

    // If not in production, use the Mumbai testnet
    return createPublicClient({
        chain: polygonMumbai,
        transport: http(getRpcProvider()),
    });
}
