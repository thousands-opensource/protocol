import { NextApiRequest, NextApiResponse } from "next";
import { WildcardApiResponse } from "@repo/interfaces";
import { ethers } from "ethers";
import { BACKEND_ETH_PROVIDER } from "@/utils/backend/backendContracts";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<WildcardApiResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            err: "Method not allowed"
        });
    }

    try {
        const { address } = req.query;

        if (!address || typeof address !== "string") {
            return res.status(400).json({
                success: false,
                err: "Address parameter is required"
            });
        }

        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({
                success: false,
                err: "Invalid address format"
            });
        }

        console.log(`Fetching balances for address: ${address}`);

        const tokenContracts = [
            process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
        ].filter(Boolean);

        const balances: { [contractAddress: string]: { balance: string; decimals: number; symbol?: string } } = {};

        for (const contractAddress of tokenContracts) {
            if (!contractAddress) continue;

            try {
                const erc20ABI = [
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)",
                    "function symbol() view returns (string)"
                ];

                const tokenContract = new ethers.Contract(contractAddress, erc20ABI, BACKEND_ETH_PROVIDER);

                const [balance, decimals, symbol] = await Promise.all([
                    tokenContract.balanceOf(address),
                    tokenContract.decimals().catch(() => 18),
                    tokenContract.symbol().catch(() => "UNKNOWN")
                ]);

                balances[contractAddress] = {
                    balance: ethers.utils.formatUnits(balance, decimals),
                    decimals: decimals,
                    symbol: symbol
                };

                console.log(`${symbol} balance for ${address}: ${ethers.utils.formatUnits(balance, decimals)}`);
            } catch (error) {
                console.error(`Error fetching balance for contract ${contractAddress}:`, error);
                balances[contractAddress] = {
                    balance: "0",
                    decimals: 18,
                    symbol: "UNKNOWN"
                };
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                address,
                balances,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error("Error in user-balances API:", error);
        return res.status(500).json({
            success: false,
            err: error.message || "Failed to fetch user balances"
        });
    }
}
