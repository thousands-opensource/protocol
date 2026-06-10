import { WILDPASS_CONTRACT } from "@/utils/backend/backendContracts";

/**
 * Checks if any of the given wallet addresses is a wildpass holder.
 * @param {string[]} walletAddresses - The wallet addresses to check.
 * @returns {Promise<boolean>} - Returns true if any wallet is an owner, otherwise false.
 */
export const isAddressWildpassHolder = async (
    walletAddresses: string[]
): Promise<boolean> => {
    if (!walletAddresses || walletAddresses.length === 0) {
        throw new Error("Wallet address must be provided");
    }

    try {
        for (const address of walletAddresses) {
            try {
                const isOwner = await WILDPASS_CONTRACT.isOwner(address);
                if (isOwner) {
                    return true;
                }
            } catch (addressError) {
                console.warn(
                    `Failed to get Wildpass.isOwner for ${address}`,
                    addressError
                );
                // Continue checking other addresses instead of failing completely
                continue;
            }
        }
        return false;
    } catch (error) {
        console.error(
            `Error checking ownership for addresses [${walletAddresses.join(", ")}]:`,
            error
        );
        // Return false instead of throwing to maintain function contract
        return false;
    }
};

export const doesAddressHaveWildpassTokens = async (
    walletAddresses: string[],
    tokenIds: number[]
): Promise<boolean> => {
    if (!walletAddresses || walletAddresses.length === 0) {
        throw new Error("Wallet addresses must be provided");
    }

    if (!tokenIds || tokenIds.length === 0) {
        throw new Error("Token IDs must be provided");
    }

    try {
        for (const tokenId of tokenIds) {
            try {
                const owner = await WILDPASS_CONTRACT.ownerOf(tokenId);
                if (walletAddresses.some(addr => 
                    addr.toLowerCase() === owner.toLowerCase()
                )) {
                    return true;
                }
            } catch (tokenError) {
                console.warn(`Error checking token ${tokenId}:`, tokenError);
                continue;
            }
        }
        return false;
    } catch (error) {
        console.error(
            `Error checking ownership of tokens [${tokenIds.join(", ")}] for addresses [${walletAddresses.join(", ")}]:`,
            error
        );
        return false;
    }
};