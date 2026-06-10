import {
    AIRDROP,
    VIEW_ACTIVE_AIRDROPS,
    GET_AIRDROP_CONTRACT_ADDRESS,
    GET_TOKEN_BALANCE,
    ADDRESS,
    TOKEN_ID,
    GET_AIRDROP_BOT_WALLET_ADDRESS,
} from "../constants";

/**
 * List of commands for /airdrop
 */
export const airdropCommandList: any[] = [
    {
        name: AIRDROP,
        description: "Commands to interact with The Wildcard Airdrop bot",
        children: [
            {
                name: GET_AIRDROP_CONTRACT_ADDRESS,
                description: "Get the smart contract address for the Airdrop",
            },
            {
                name: GET_AIRDROP_BOT_WALLET_ADDRESS,
                description: "Get the wallet address of the Airdrop bot",
            },
            {
                name: VIEW_ACTIVE_AIRDROPS,
                description: "View all active Airdrops",
            },
            {
                name: GET_TOKEN_BALANCE,
                description:
                    "Retrieve the balance of a token ID for the given address",
                options: [
                    {
                        optionType: "string",
                        optionName: ADDRESS,
                        optionDescription:
                            "Address to retrieve the balance for",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: TOKEN_ID,
                        optionDescription: "Token ID to retrieve balance for",
                        optionRequired: true,
                    },
                ],
            },
        ],
    },
];
