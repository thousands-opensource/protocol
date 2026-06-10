import { Contract } from "ethers";
import WildcardEventTicketJson from "./abi/WildcardEventTicket.json";
import { logInfo } from "@src/logger";
import { WALLET } from "@src/util/contractConstructorUtil";
import { getWildcardEventTicketContractAddress } from "@src/util/environmentUtil";

// Address of the WildcardEventTicket contract on-chain
export const WILDCARD_EVENT_TICKET_ADDRESS =
    getWildcardEventTicketContractAddress();

if (!WILDCARD_EVENT_TICKET_ADDRESS) {
    console.warn(
        "Address of WildcardEventTicket contract not found. Set WILDCARD_EVENT_TICKET_ADDRESS environment variable to the deployed contract address"
    );
} else {
    logInfo(
        `Using WildcardEventTicket contract with address ${WILDCARD_EVENT_TICKET_ADDRESS}`
    );
}

export class WildcardEventTicketContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            WILDCARD_EVENT_TICKET_ADDRESS,
            WildcardEventTicketJson.abi,
            WALLET
        );
    }

    async ownerOf(tokenId: number): Promise<string | null> {
        try {
            return await this.contract.ownerOf(tokenId);
        } catch (e) {
            console.log(
                `Failed to get owner of Wildcard event ticket ${tokenId}`,
                e
            );
            return null;
        }
    }
}

export const WILDCARD_EVENT_TICKET_CONTRACT = new WildcardEventTicketContract();
