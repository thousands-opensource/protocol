import { Contract, ContractReceipt } from "ethers";
import WildcardTicketBoothJson from "./abi/WildcardTicketBooth.json";
import { getWildcardTicketBoothContractAddress } from "../util/environmentUtil";
import { WALLET } from "../util/contractConstructorUtil";
import { logError, logInfo } from "../logger";
import { ContractResult, GasPrice } from "@src/types";
import { WILDCARD_EVENT_TICKET_ADDRESS } from "@src/contracts/WildcardEventTicket";

// Address of the WildcardTicketBooth contract on-chain
const WILDCARD_TICKET_BOOTH_ADDRESS = getWildcardTicketBoothContractAddress();

if (!WILDCARD_TICKET_BOOTH_ADDRESS) {
    console.warn(
        "Address of WildcardTicketBooth contract not found. Set WILDCARD_TICKET_BOOTH_ADDRESS environment variable to the deployed contract address"
    );
} else {
    logInfo(
        `Using WildcardTicketBooth contract with address ${WILDCARD_TICKET_BOOTH_ADDRESS}`
    );
}

/**
 * Class to interact with the WildcardTicketBooth smart contract
 */
class WildcardTicketBoothContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            WILDCARD_TICKET_BOOTH_ADDRESS,
            WildcardTicketBoothJson.abi,
            WALLET
        );
    }

    /**
     * Mint a new ticket
     * @param to The address to mint the ticket to
     * @returns A promise resolving to the result of the contract execution
     */
    async mintTicket(to: string, gasPrice: GasPrice): Promise<ContractResult> {
        try {
            logInfo(`Minting an event ticket for ${to}...`);
            const tx = await this.contract.mintTicket(to, gasPrice);

            return {
                success: true,
                data: tx,
            };
        } catch (e) {
            logError(`Failed to mint ticket to ${to}`, e);
            return {
                success: false,
                err: e.message,
            };
        }
    }

    /**
     * Handle the mint ticket transaction result
     * @param receipt The receipt of the transaction
     * @returns The result of the contract execution
     */
    handleMintTicketResult(receipt: ContractReceipt): ContractResult {
        const events = receipt.events;
        let ticketIds: number[] = [];

        ticketIds = events
            .filter(
                (event) =>
                    event.address?.toLowerCase() ===
                    WILDCARD_EVENT_TICKET_ADDRESS?.toLowerCase()
            ) // Only look at events from the Wildfile contract
            .map((event) => {
                try {
                    const hexId = event.topics[3];
                    return parseInt(hexId, 16);
                } catch (e) {
                    logError(`Failed to parse a wildfileId`, e);
                    return null;
                }
            });

        return {
            success: true,
            data: ticketIds[0],
            txHash: receipt.transactionHash,
        };
    }

    // Rip multiple tickets for an event
    async ripTickets(
        eventName: string,
        ticketIds: number[],
        gasPrice: GasPrice
    ): Promise<ContractResult> {
        try {
            const tx = await this.contract.ripTickets(
                eventName,
                ticketIds,
                gasPrice
            );
            const receipt = await tx.wait();
            logInfo(
                `Ripped tickets with IDs ${ticketIds.join(
                    ", "
                )} for event ${eventName} with transaction hash: ${
                    receipt.transactionHash
                }`
            );
            return receipt;
        } catch (e) {
            logError(
                `Failed to rip tickets with IDs ${ticketIds.join(
                    ", "
                )} for event ${eventName}`,
                e
            );
            throw e;
        }
    }

    /**
     * Rip a single ticket for an event
     * @param eventName The name of the event
     * @param ticketId The ID of the ticket to rip
     * @returns A promise resolving to the result of the contract execution
     */
    async ripTicket(
        eventName: string,
        ticketId: number,
        gasPrice: GasPrice
    ): Promise<ContractResult> {
        try {
            logInfo(
                `Ripping ticket with ID ${ticketId.toString()} for event ${eventName}...`
            );
            const tx = await this.contract.ripTicket(
                eventName,
                ticketId,
                gasPrice
            );
            return {
                success: true,
                data: tx,
            };
        } catch (e) {
            logError(
                `Failed to rip ticket with ID ${ticketId.toString()} for event ${eventName}`,
                e
            );
            return {
                success: false,
                err: e.message,
            };
        }
    }

    /**
     * Handle the rip ticket transaction result
     * @param receipt The receipt of the transaction
     * @returns The result of the contract execution
     */
    handleRipTicketResult(receipt: ContractReceipt): ContractResult {
        const events = receipt.events;
        let ticketId: number | null;

        // Extract the ticket ID from the events
        events.forEach((event) => {
            if (event.event === "TicketRipped") {
                ticketId = event.args?.ticketId || null;
            }
        });

        if (ticketId) {
            logInfo(`Successfully ripped ticket with ID ${ticketId}`);
            return {
                success: true,
                data: ticketId,
                txHash: receipt.transactionHash,
            };
        } else {
            const errMsg = "Failed to find ticket ID in transaction receipt";
            logError(errMsg);
            return {
                success: false,
                err: errMsg,
                txHash: receipt.transactionHash,
            };
        }
    }

    // Check if an attendee attended an event
    async attendedEvent(eventName: string, attendee: string): Promise<boolean> {
        try {
            return await this.contract.attendedEvent(eventName, attendee);
        } catch (e) {
            logError(
                `Failed to check if attendee ${attendee} attended event ${eventName}`,
                e
            );
            throw e;
        }
    }
}

export const WILDCARD_TICKET_BOOTH_CONTRACT: WildcardTicketBoothContract =
    new WildcardTicketBoothContract();
