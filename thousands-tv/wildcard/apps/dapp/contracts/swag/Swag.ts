import { Contract } from "ethers";
import { GasPrice } from "@repo/interfaces";
import { getWildcardSwagContractAddress } from "@/utils/environmentUtil";
import { Signer, Provider } from "@wagmi/core";
import WildcardSwag from "../abi/swag/WildcardSwag.json";
import { getGasPrice } from "@/utils/backend/blockchainUtil";
import { getBackendWalletAddress } from "@/utils/backend/backendContracts";
import { ContractResult } from "@/types";

// address of the contract onchain
const WILDCARD_SWAG_CONTRACT_ADDRESS = getWildcardSwagContractAddress();
if (!WILDCARD_SWAG_CONTRACT_ADDRESS) {
    console.warn(
        "Wildcard Swag contract address not set. Please set environment variable NEXT_PUBLIC_WILDCARD_SWAG_CONTRACT_ADDRESS"
    );
}

console.log(
    `Using Wildcard Swag contract address: ${WILDCARD_SWAG_CONTRACT_ADDRESS}`
);

/**
 * Class to interact with the WildcardSwag smart contract
 */
export class WildcardSwagContract {
    contract: Contract;

    constructor(signerOrProvider?: Signer | Provider) {
        this.contract = new Contract(
            WILDCARD_SWAG_CONTRACT_ADDRESS,
            WildcardSwag,
            signerOrProvider
        );
    }

    async tokenBalancesOf(
        address: string,
        tokenIds: number[]
    ): Promise<number[]> {
        try {
            const formattedAddressArr = [];
            for (const _ of tokenIds) {
                formattedAddressArr.push(address);
            }
            const balanceBnArr = await this.contract.balanceOfBatch(
                formattedAddressArr,
                tokenIds
            );
            const balanceArr = [];
            for (const balanceBn of balanceBnArr) {
                balanceArr.push(balanceBn.toNumber());
            }
            return balanceArr;
        } catch (e) {
            console.error(
                `Failed to retrieve token IDs '${tokenIds}' balances for address '${address}'`,
                e
            );
            return [];
        }
    }

    async airdropToken(to: string, tokenId: number): Promise<ContractResult> {
        try {
            const gasPrice: GasPrice = await getGasPrice();
            const maxFeeGwei = gasPrice.maxFeePerGas.toNumber() / 10 ** 9;
            const maxPriorityFeeGwei =
                gasPrice.maxPriorityFeePerGas.toNumber() / 10 ** 9;
            console.log(
                `Using gas price for giving away swag on farcaster: maxFeePerGas ${maxFeeGwei} gwei, maxPriorityFeePerGas ${maxPriorityFeeGwei} gwei`
            );

            // airdrop swag
            const tx = await this.contract.safeTransferFrom(
                getBackendWalletAddress(),
                to,
                tokenId,
                1,
                [],
                gasPrice
            );

            return {
                success: true,
                tx,
            };
        } catch (e: any) {
            const err = `Failed to transfer swag to address ${to}.`;
            console.error(err, e);
            return {
                success: false,
                err,
            };
        }
    }
}
