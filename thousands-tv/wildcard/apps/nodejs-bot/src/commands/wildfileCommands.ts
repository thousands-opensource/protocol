import { ADDRESS, GET_WILDFILE_INFO, WILDFILE } from "@src/constants";

/**
 * List of commands for /wildfile
 */
export const wildfileCommandList: any[] = [
    {
        name: WILDFILE,
        description: "Commands to interact with the Wildfile",
        children: [
            {
                name: GET_WILDFILE_INFO,
                description: "Retrieve an address' Wildfile's information",
                options: [
                    {
                        optionType: "string",
                        optionName: ADDRESS,
                        optionDescription: "Address to find Wildfile Id",
                        optionRequired: false,
                    },
                ],
            },
        ],
    },
];
