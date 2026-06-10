import { WolvesDaoContract } from "@/contracts/wolvesDao";
import { BACKEND_PROVIDER } from "./backendContracts";

const WOLVES_DAO_CONTRACT = new WolvesDaoContract(BACKEND_PROVIDER);
/**
 * Checks if any of the given wallet addresses is a wildpass holder.
 * @param {string[]} walletAddresses - The wallet addresses to check.
 * @returns {Promise<boolean>} - Returns true if any wallet is an owner, otherwise false.
 */
export const isWolvesDaoHolder = async (
    walletAddresses: string[]
): Promise<boolean> => {
    if (!walletAddresses || walletAddresses.length === 0) {
        throw new Error("Wallet address must be provided");
    }

    try {
        for (const address of walletAddresses) {
            const isOwner = await WOLVES_DAO_CONTRACT.isOwner(address);
            if (isOwner) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error(`Error checking ownership for addresses [${walletAddresses.join(", ")}]:`, error);
        return false;
    }
};
