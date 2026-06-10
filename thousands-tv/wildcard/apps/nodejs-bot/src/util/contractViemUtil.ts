import { getWildfileContractAddress } from "@src/util/environmentUtil";
import { parseAbi } from "viem";

/**
 * Note: The following constants are used to retrieve data from the blockchain via the viem client.
 * */

// Wildfile Contract Constants
export const WILDFILE_CONTRACT_VIEM = {
    address: getWildfileContractAddress(),
    abi: parseAbi([
        `function ownerOf(uint256 tokenId) external view returns (address)`,
        `function getWildfileId(address owner) external view returns (uint256)`,
    ] as const),
};
