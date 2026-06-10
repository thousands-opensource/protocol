import {
    DISCORD_TAG,
    GENERATE_HELIKA_REPORT,
    GIVE_KUDOS,
    KUDOS_REASON,
    KUDOS_OPTIONS,
    KUDOS_TYPE,
    GET_DISCORD_IDS_FROM_WILDFILES,
    GET_WILDFILE_IDS_FROM_DISCORD_IDS,
    TO,
    TRANSFER_WILDFILE,
    USER,
    WILDFILE_ADMIN,
    WILDFILE_ID,
    ROLE,
    AWARD_ROLE_TO_USERS,
    ARCHIVE_LEADERBOARD_COMMAND,
    LEADERBOARD_ID,
    GET_WILDFILE_IDS_FROM_WALLET_ADDRESSES,
} from "@src/constants";

/**
 * List of commands for /wildfile-admin
 */
export const wildfileAdminCommandList: any[] = [
    {
        name: WILDFILE_ADMIN,
        description: "Admin commands to interact with the Wildfile",
        children: [
            {
                name: TRANSFER_WILDFILE,
                description: "Transfer a Wildfile to another address",
                options: [
                    {
                        optionType: "string",
                        optionName: WILDFILE_ID,
                        optionDescription: "Wildfile Id to transfer",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: TO,
                        optionDescription:
                            "Address to transfer the Wildfile to",
                        optionRequired: true,
                    },
                ],
            },
            {
                name: GENERATE_HELIKA_REPORT,
                description: "Create a csv mapping wildfiles to discord ids",
            },
            {
                name: GIVE_KUDOS,
                description: "Give kudos to user",
                options: [
                    {
                        optionType: "string",
                        optionName: KUDOS_TYPE,
                        optionDescription: "Kudos type to give",
                        optionRequired: true,
                        optionChoices: true,
                        optionChoicesEntries: KUDOS_OPTIONS,
                    },
                    {
                        optionType: USER,
                        optionName: TO,
                        optionDescription: "User to give kudos to.",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: KUDOS_REASON,
                        optionDescription: "Reason for giving kudos",
                        optionRequired: false,
                    },
                ],
            },
            {
                name: GET_DISCORD_IDS_FROM_WILDFILES,
                description: "Get discord ids from wildfile ids",
            },
            {
                name: GET_WILDFILE_IDS_FROM_DISCORD_IDS,
                description: "Get wildfile ids from discord ids",
            },
            {
                name: GET_WILDFILE_IDS_FROM_WALLET_ADDRESSES,
                description: "Get wildfile ids from wallet addresses",
            },
            {
                name: AWARD_ROLE_TO_USERS,
                description:
                    "Awards a role to all users from a specific list of discord ids",
                options: [
                    {
                        optionType: ROLE,
                        optionName: ROLE,
                        optionDescription: "Role to award",
                        optionRequired: true,
                    },
                ],
            },
            {
                name: ARCHIVE_LEADERBOARD_COMMAND,
                description: "Archives pages of a leaderboard on chain",
                options: [
                    {
                        optionType: "string",
                        optionName: LEADERBOARD_ID,
                        optionDescription: "Leaderboard to archive on chain",
                        optionRequired: true,
                    },
                ],
            },
        ],
    },
];
