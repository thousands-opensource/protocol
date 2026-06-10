import { ChannelType } from "discord.js";
import {
    AIRDROP_ADMIN,
    CHANNEL,
    CONCLUDE_AIRDROP,
    CREATE_AIRDROP,
    REOPEN_AIRDROP,
    AIRDROP_DURATION_HOURS,
    ROLE,
    TOKEN_ID,
    EDIT_AIRDROP_DURATION,
    AWARD_ROLE_FOR_VOICE_CHANNEL,
    UPDATE_ALL_INITIAL_WILDFILE_IDS,
    GET_WILDPASS_OG_HOLDERS,
    AIRDROP_SWAG,
} from "../constants";

/**
 * List of commands for /airdrop-admin
 */
export const airdropAdminCommandList: any[] = [
    {
        name: AIRDROP_ADMIN,
        description: "Admin commands to interact with The Wildcard Airdrop bot",
        children: [
            {
                name: CREATE_AIRDROP,
                description: "Create an airdrop that's based on a role!",
                options: [
                    {
                        optionType: ROLE,
                        optionName: ROLE,
                        optionDescription:
                            "Role required to receive the airdrop",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: TOKEN_ID,
                        optionDescription:
                            "Token ID to airdrop to the user upon receiving the role",
                        optionRequired: true,
                    },
                    {
                        optionType: CHANNEL,
                        optionName: CHANNEL,
                        optionChannelTypes: [ChannelType.GuildText],
                        optionDescription:
                            "Channel to broadcast the airdrop. If not specified, defaults to the Airdrops channel",
                        optionRequired: false,
                    },
                    {
                        optionType: "number",
                        optionName: AIRDROP_DURATION_HOURS,
                        optionDescription:
                            "Duration in hours until the airdrop automatically ends",
                        optionRequired: false,
                    },
                ],
            },
            {
                name: CONCLUDE_AIRDROP,
                description:
                    "Conclude an airdrop associated with the given role",
                options: [
                    {
                        optionType: ROLE,
                        optionName: ROLE,
                        optionDescription: "Role associated with the airdrop",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: TOKEN_ID,
                        optionDescription:
                            "Token ID associated with the airdrop",
                        optionRequired: true,
                    },
                ],
            },
            {
                name: EDIT_AIRDROP_DURATION,
                description: "Edit an airdrop's duration",
                options: [
                    {
                        optionType: ROLE,
                        optionName: ROLE,
                        optionDescription: "Role associated with the airdrop",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: TOKEN_ID,
                        optionDescription:
                            "Token ID associated with the airdrop",
                        optionRequired: true,
                    },
                    {
                        optionType: "number",
                        optionName: AIRDROP_DURATION_HOURS,
                        optionDescription:
                            "Duration in hours until the airdrop automatically ends (from now)",
                        optionRequired: true,
                    },
                ],
            },
            {
                name: REOPEN_AIRDROP,
                description: "Reopen an airdrop that has ended.",
                options: [
                    {
                        optionType: ROLE,
                        optionName: ROLE,
                        optionDescription:
                            "Role required to receive the airdrop",
                        optionRequired: true,
                    },
                    {
                        optionType: "string",
                        optionName: TOKEN_ID,
                        optionDescription:
                            "Token ID to airdrop to the user upon receiving the role",
                        optionRequired: true,
                    },
                    {
                        optionType: CHANNEL,
                        optionName: CHANNEL,
                        optionChannelTypes: [ChannelType.GuildText],
                        optionDescription:
                            "Channel to broadcast the airdrop. If not specified, defaults to the Airdrops channel",
                        optionRequired: false,
                    },
                    {
                        optionType: "number",
                        optionName: AIRDROP_DURATION_HOURS,
                        optionDescription:
                            "Duration in hours until the airdrop automatically ends (from now)",
                        optionRequired: false,
                    },
                ],
            },
            {
                name: AWARD_ROLE_FOR_VOICE_CHANNEL,
                description:
                    "Awards a role to all users present in the given voice channel",
                options: [
                    {
                        optionType: ROLE,
                        optionName: ROLE,
                        optionDescription: "Role to award",
                        optionRequired: true,
                    },
                    {
                        optionType: CHANNEL,
                        optionName: CHANNEL,
                        optionChannelTypes: [
                            ChannelType.GuildVoice,
                            ChannelType.GuildStageVoice,
                        ],
                        optionDescription:
                            "Voice channel containing members to award.",
                        optionRequired: true,
                    },
                ],
            },
            {
                name: UPDATE_ALL_INITIAL_WILDFILE_IDS,
                description: "Update all users to have initialWildfileId set",
            },
            {
                name: GET_WILDPASS_OG_HOLDERS,
                description: "Get all wildpass OG Holders",
            },
            {
                name: AIRDROP_SWAG,
                description:
                    "Airdrop swag to a comma-separated list of addresses",
            },
        ],
    },
];
