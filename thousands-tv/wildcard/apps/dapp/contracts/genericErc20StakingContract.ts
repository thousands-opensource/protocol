import { Contract } from "ethers";
import { BACKEND_ETH_PROVIDER } from "@/utils/backend/backendContracts";

// Minimal ABI that only includes getErc20Balance
const GENERIC_STAKING_CONTRACT_ABI = [
    {
        inputs: [{ internalType: "address", name: "_user", type: "address" }],
        name: "getErc20Balance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

export class GenericErc20StakingContract {
    private contract: Contract;

    constructor(contractAddress: string) {
        this.contract = new Contract(
            contractAddress,
            GENERIC_STAKING_CONTRACT_ABI,
            BACKEND_ETH_PROVIDER
        );
    }

    async getErc20Balance(userAddress: string): Promise<BigInt> {
        try {
            const balance = await this.contract.getErc20Balance(userAddress);
            return BigInt(balance.toString());
        } catch (e) {
            console.error(
                `Error getting staked balance for ${userAddress}:`,
                e
            );
            return BigInt(0);
        }
    }
}
