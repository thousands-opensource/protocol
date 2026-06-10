import {
    BigNumber,
    Contract,
    ContractReceipt,
    ContractTransaction,
} from "ethers";
import WildeventRegistryJson from "../abi/wildevents/WildeventRegistry.json";
import { ContractResult, GasPrice, Wildevent } from "../../types";
import { logError, logInfo } from "../../logger";
import { getWildeventRegistryContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";
import { getDiscordBotWalletAddress } from "@src/util/blockchainUtil";
import { WILDFILE_CONTRACT } from "@src/contracts/Wildfile";

// address of the contract onchain
const WILDEVENT_REGISTRY_CONTRACT_ADDRESS =
    getWildeventRegistryContractAddress();
if (!WILDEVENT_REGISTRY_CONTRACT_ADDRESS) {
    console.warn(
        // incorrect
        "Address of WildeventRegistry contract not found. Run 'npm run deploy' or set WILDEVENT_REGISTRY_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using WildeventRegistry contract address: ${WILDEVENT_REGISTRY_CONTRACT_ADDRESS}`
    );
}

/**
 * Class to interact with the WildeventRegistry smart contract
 */
class WildeventRegistryContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            WILDEVENT_REGISTRY_CONTRACT_ADDRESS,
            WildeventRegistryJson.abi,
            WALLET
        );
    }

    /**
     * Posts a Wildevent of the given type
     * @param wildeventType The type of Wildevent to post
     * @param wildfileIds An array of Wildfile IDs to associate with the event
     * @param data The bytes data resprenting the event
     * @param gasPrice Gas price to use for the transaction
     * @returns A promise resolving to the result of the contract execution
     */
    async postWildevent(
        wildeventType: string,
        wildfileIds: number[],
        data: Uint8Array,
        gasPrice: GasPrice
    ): Promise<ContractResult> {
        try {
            // make sure that posting the Wildevent will most likely succeed
            const preflightIssue = await this.postWildeventPreflight(
                wildeventType
            );
            if (preflightIssue) {
                return {
                    success: false,
                    err: preflightIssue,
                };
            }

            const tx: ContractTransaction = await this.contract.postWildevent(
                wildeventType,
                wildfileIds,
                data,
                gasPrice
            );

            return {
                success: true,
                data: tx,
            };
        } catch (e) {
            logError(`Failed to post Wildevent of type ${wildeventType}`, e);
            return {
                success: false,
                err: e.message,
            };
        }
    }

    /**
     * Parse the result of a post Wildevent transaction to extract the Wildevent ID
     * @param receipt The receipt of the transaction
     * @returns The result of the contract execution
     */
    handleWildeventResult(receipt: ContractReceipt): ContractResult {
        const event = receipt.events.find(
            (event) => event.event === "WildeventPosted"
        );

        const [wildeventId, ,] = event.args;

        // Calculate gas cost
        const gasUsed: BigNumber = receipt.gasUsed;
        const effectiveGasPrice: BigNumber = receipt.effectiveGasPrice;
        const gasCost: BigNumber = gasUsed.mul(effectiveGasPrice);

        return {
            success: true,
            data: {
                wildeventId: wildeventId.toNumber(),
                gasCost: gasCost.toString(),
            },
            txHash: receipt.transactionHash,
        };
    }

    /**
     * Preflights posting a Wildevent of the given type. Verifies that the Wildevent type is valid,
     * the bot has a Wildfile, and the bot is allowed to attest to events of the given type.
     */
    async postWildeventPreflight(wildeventType: string): Promise<string> {
        // make sure the Wildevent type is registered
        const isRegistered = await this.contract.isWildeventTypeRegistered(
            wildeventType
        );
        if (!isRegistered) {
            return `Cannot post Wildevent. Wildevent type ***${wildeventType}*** has not been registered yet`;
        }

        const discordBotWallet = getDiscordBotWalletAddress();
        const discordBotWildfileId = await WILDFILE_CONTRACT.getWildfileId(
            discordBotWallet
        );
        if (!discordBotWildfileId || discordBotWildfileId < 1) {
            return `Cannot post Wildevent. My wallet ***${discordBotWallet}*** does not have a Wildfile`;
        }

        // make sure that the discord bot's wallet address is an attestor
        const isAttestor: boolean = await this.contract.isWildeventAttestor(
            wildeventType,
            discordBotWildfileId
        );
        if (!isAttestor) {
            return `Cannot post Wildevent. My Wildfile ***#${discordBotWildfileId}*** cannot attest to Wildevents of type ***${wildeventType}***`;
        }

        // preflight passed
        return "";
    }

    async getWildeventTypes(): Promise<string[]> {
        try {
            const eventTypes = await this.contract.getWildeventTypes();
            return eventTypes;
        } catch (e) {
            logError("Failed to get event types", e);
            return null;
        }
    }

    async getNumWildevents(wildeventType: string): Promise<number> {
        try {
            const numWildevents = await this.contract.getNumWildevents(
                wildeventType
            );
            return numWildevents.toNumber();
        } catch (e) {
            logError(
                `Failed to getNumWildevents for wildevent type '${wildeventType}'`,
                e
            );
            return 0;
        }
    }

    async isWildeventTypeRegistered(wildeventType: string): Promise<boolean> {
        try {
            return await this.contract.isWildeventTypeRegistered(wildeventType);
        } catch (e) {
            logError(
                `Failed to check if wildevent type '${wildeventType}' is registered`,
                e
            );
            return false;
        }
    }

    async getWildeventSchema(wildeventType: string): Promise<string> {
        try {
            const schema = await this.contract.getWildeventSchema(
                wildeventType
            );
            return schema;
        } catch (e) {
            logError(`Failed to get Wildevent schema for ${wildeventType}`, e);
            return null;
        }
    }

    async getWildevents(wildeventType: string): Promise<Wildevent[]> {
        try {
            return await this.contract.getWildevents(wildeventType);
        } catch (e) {
            logError(`Failed to get Wildevents for ${wildeventType}`, e);
            return null;
        }
    }

    async getWildeventsBatch(
        wildeventType: string,
        startIndex: number,
        endIndex: number
    ): Promise<Wildevent[]> {
        try {
            return await this.contract.getWildeventsBatch(
                wildeventType,
                startIndex,
                endIndex
            );
        } catch (e) {
            logError(
                `Failed to get Wildevents batch for Wildevent ${wildeventType}, startIndex ${startIndex}, endIndex ${endIndex}`,
                e
            );
            return [];
        }
    }

    async isWildeventAttestor(
        wildeventType: string,
        wildfileId: number
    ): Promise<boolean> {
        try {
            return await this.contract.isWildeventAttestor(
                wildeventType,
                wildfileId
            );
        } catch (e) {
            logError(
                `Failed to check isWildeventAttestor for event ${wildeventType} and wildfileId ${wildfileId}`,
                e
            );
            return false;
        }
    }
}

export const WILDEVENT_REGISTRY_CONTRACT: WildeventRegistryContract =
    new WildeventRegistryContract();
