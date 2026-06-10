// This only needs to be executed once to register slash commands for the bot
// see https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
import moduleAlias from "module-alias";
moduleAlias.addAliases({
    "@src": `${__dirname}/src/`,
});
import dotenv from "dotenv";
import { REST } from "@discordjs/rest";
import {
    ChannelType,
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandNumberOption,
    SlashCommandRoleOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from "discord.js";
import { CHANNEL, ROLE } from "./src/constants";
import {
    getDiscordAppId,
    getDiscordGuildId,
    getDiscordToken,
    getEnvironment,
} from "./src/util/environmentUtil";
import { airdropAdminCommandList } from "./src/commands/airdropAdminCommands";
import { Environment } from "./src/types";
import { airdropCommandList } from "./src/commands/airdropCommands";
import { logError, logInfo } from "@src/logger";
import { wildfileCommandList } from "@src/commands/wildfileCommands";
import { wildfileAdminCommandList } from "@src/commands/wildfileAdminCommands";
import { wildeventsCommandList } from "@src/commands/wildeventsCommands";
import { fanVisibilityCommandList } from "@src/commands/fanVisibilityCommands";

dotenv.config();

// build the slash command definitions to send to discord to be registered for the bot
const commands: RESTPostAPIApplicationCommandsJSONBody[] =
    buildSlashCommandBuilder();

// register the built commands
registerCommands();

/**
 * Registers commands for the discord bot, if there's a command line arg 'testEnv',
 * then the commands will be registered for the test environment bot
 */
async function registerCommands() {
    // delete the bot's existing commands so we always start from a clean slate
    await deleteCommands();

    const env: Environment = getEnvironment();
    logInfo(`Registering commands for environment ${env}`);
    const discordToken = getDiscordToken();
    const appId = getDiscordAppId();
    const guildId = getDiscordGuildId();

    const rest = new REST({ version: "10" }).setToken(discordToken);
    try {
        await rest.put(Routes.applicationGuildCommands(appId, guildId), {
            body: commands,
        });
        logInfo("Successfully registered slash commands");
    } catch (e) {
        logError("Failed to register slash commands", e);
    } finally {
        process.exit();
    }
}

async function deleteCommands() {
    const env: Environment = getEnvironment();
    logInfo(`Deleting commands for environment ${env}`);
    const discordToken = getDiscordToken();
    const appId = getDiscordAppId();
    const guildId = getDiscordGuildId();
    const rest = new REST({ version: "10" }).setToken(discordToken);
    const data: any = await rest.get(
        Routes.applicationGuildCommands(appId, guildId)
    );
    try {
        for (const command of data) {
            await rest.delete(
                `${Routes.applicationGuildCommands(appId, guildId)}/${
                    command.id
                }`
            );
        }
        logInfo("Successfully cleared slash commands");
    } catch (e) {
        logError("Failed to clear slash commands", e);
        process.exit();
    }
}

/**
 * Build the list of slash and subcommands with permissions and all the values read in from config above
 * @returns list of slash commands
 */
function buildSlashCommandBuilder(): RESTPostAPIApplicationCommandsJSONBody[] {
    const commandList = airdropCommandList
        .concat(airdropAdminCommandList)
        .concat(wildeventsCommandList)
        .concat(wildfileCommandList)
        .concat(wildfileAdminCommandList)
        .concat(fanVisibilityCommandList);
    const commandsJson: RESTPostAPIApplicationCommandsJSONBody[] = [];
    // Loop through top level commands and fill in slash command info
    for (const topLevelCommands of commandList) {
        const scb = new SlashCommandBuilder();
        scb.setName(topLevelCommands.name).setDescription(
            topLevelCommands.description
        );
        // If there are permissions, add them in at the slash command level
        if (topLevelCommands.requiredPermissions) {
            scb.setDefaultMemberPermissions(
                topLevelCommands.requiredPermissions
            );
        }

        // Handle all subcommands and then add the slash command to the list
        handleSubcommands(topLevelCommands, scb);
        commandsJson.push(scb.toJSON());
    }

    return commandsJson;
}

/**
 * Logic to add all fields for the subcommands based on the config object
 * @param topLevelCommands - slash command object from the config object
 * @param scBuilder - the slash command object we are building
 */
function handleSubcommands(
    topLevelCommands: any,
    scBuilder: SlashCommandBuilder
) {
    // Loop through all the subcommands of each slash command and configure
    for (const command of topLevelCommands.children) {
        const sc = new SlashCommandSubcommandBuilder();
        sc.setName(command.name).setDescription(command.description);
        // Handle each option type case
        if (command.options) {
            for (const option of command.options) {
                if (option.optionType === "string") {
                    const stringOption = new SlashCommandStringOption();
                    setDynamicOptionProps(stringOption, option);
                    sc.addStringOption(stringOption);
                } else if (option.optionType === "user") {
                    const userOption = new SlashCommandUserOption();
                    setDynamicOptionProps(userOption, option);
                    sc.addUserOption(userOption);
                } else if (option.optionType === "number") {
                    const numberOption = new SlashCommandNumberOption();
                    setDynamicOptionProps(numberOption, option);
                    sc.addNumberOption(numberOption);
                } else if (option.optionType === CHANNEL) {
                    const channelOption = new SlashCommandChannelOption();
                    // specifying optionChannelTypes for a CHANNEL command option allows for showing only certain types of channels as options to pick
                    if (option.optionChannelTypes) {
                        for (const type of option.optionChannelTypes) {
                            channelOption.addChannelTypes(type);
                        }
                    } else {
                        // defaults to public/private threads and text channels as options for channel to choose
                        channelOption.addChannelTypes(
                            ChannelType.PublicThread,
                            ChannelType.PrivateThread,
                            ChannelType.GuildText
                        );
                    }
                    setDynamicOptionProps(channelOption, option);
                    sc.addChannelOption(channelOption);
                } else if (option.optionType === ROLE) {
                    const roleOption = new SlashCommandRoleOption();
                    setDynamicOptionProps(roleOption, option);
                    sc.addRoleOption(roleOption);
                }
            }
        }

        scBuilder.addSubcommand(sc);
    }
}

/**
 * Reusable helper to set dynamic option properties
 * @param dynamicOption - option that is either a string, number or user option
 * @param command - object with properties to fill in the option
 */
function setDynamicOptionProps(
    dynamicOption:
        | SlashCommandStringOption
        | SlashCommandUserOption
        | SlashCommandNumberOption
        | SlashCommandChannelOption
        | SlashCommandRoleOption,
    command: any
) {
    dynamicOption.setName(command.optionName);
    dynamicOption.setDescription(command.optionDescription);
    dynamicOption.setRequired(!!command.optionRequired);
    if (
        dynamicOption instanceof SlashCommandStringOption &&
        !!command.optionChoices
    ) {
        dynamicOption.addChoices(...command.optionChoicesEntries);
    }
}
