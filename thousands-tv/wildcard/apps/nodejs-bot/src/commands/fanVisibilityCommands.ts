import { REACT, REACTION, FAN } from "@src/constants";

/**
 * List of commands for /fan-visibility
 */
export const fanVisibilityCommandList: any[] = [
    {
        name: FAN,
        description: "Commands to interact live in-game",
        children: [
            {
                name: REACT,
                description: "Reactions from users",
                options: [
                    {
                        optionType: "string",
                        optionName: REACTION,
                        optionDescription: "Emoji you want to react with",
                        optionRequired: true,
                        optionChoices: true,
                        optionChoicesEntries: [
                            {
                                name: "Fire 🔥",
                                value: "🔥",
                            },
                            {
                                name: `Heart 💖`,
                                value: "💖",
                            },
                            {
                                name: "Wave 👋",
                                value: "👋",
                            },
                            {
                                name: "Clap 👏",
                                value: "👏",
                            },
                            {
                                name: "Tada 🎉",
                                value: "🎉",
                            },
                            {
                                name: "Bang 💥",
                                value: "💥",
                            },
                        ],
                    },
                ],
            },
        ],
    },
];
