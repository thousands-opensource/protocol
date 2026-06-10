import moduleAlias from "module-alias";
moduleAlias.addAliases({
    "@src": `${__dirname}/`,
});
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { logError } from "@src/logger";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { establishMongoDBConnection } from "./db/connection";
import {
    getAlchemyApiKey,
    getDiscordToken,
    getPort,
} from "./util/environmentUtil";
import { redisClient } from "@src/redis/index";
import {
    executeAirdropAdminCommand,
    executeAirdropCommand,
    executeFanCommand,
    executeWildeventsCommand,
    executeWildfileAdminCommand,
    executeWildfileCommand,
    handleButtonInteraction,
    handleModalSubmit,
} from "./commands/commandHandler";
import { handleRoleChange } from "./util/roleUtil";
import { loadGuildMembers } from "./util/discordUtil";
import { logInfo } from "./logger";
import { reconcileAirdropsOnStartup } from "@src/airdrop";
import { setupIntervals } from "@src/intervals/intervals";
import { concludeAirdrop } from "./commands/airdrop-admin/concludeAirdrop";
import { findAirdropsByQuery } from "@repo/schemas";
import { Alchemy, Network } from "alchemy-sdk";
import { initDiscordEventEventListeners } from "@src/commands/discord-events/discordEventEventListener";
import { reconcileDiscordEventsOnStartup } from "@src/commands/discord-events/reconcile";
import { createBlockchainTxnLocksIfNecessary } from "@src/contracts/transactionLock";
import {
    AIRDROP,
    AIRDROP_ADMIN,
    FAN,
    WILDEVENTS,
    WILDFILE,
    WILDFILE_ADMIN,
} from "./constants";
import { pollQueueAirdropRecipients } from "./fanAttendance/intervals";
import { handleReconcileSwagSets } from "./reconcileSwagSets";
import txnBundleRouter from "@src/api/txnBundle";
import { connectToDb } from "@repo/schemas";

const alchemyKey = getAlchemyApiKey();

if (!alchemyKey) {
    logError(
        "Alchemy API Key env var not found. Please set the ALCHEMY_API_KEY environment variable"
    );
}

// Create an Alchemy client
const alchemyPolygonSettings = {
    apiKey: alchemyKey,
    network: Network.MATIC_MAINNET,
};

const alchemyEthSettings = {
    apiKey: alchemyKey,
    network: Network.ETH_MAINNET,
};

export const alchemyPolygon = new Alchemy(alchemyPolygonSettings);
export const alchemyEth = new Alchemy(alchemyEthSettings);

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use("/api/txn_bundle", txnBundleRouter);

const PORT = getPort();

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildScheduledEvents,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
/**
 * Handler for interactions like chat commands, modal submissions, and button events
 */
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // handle modal submit
        if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
            return;
        }

        // handle button submit
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
            return;
        }

        // if it's not a chat input command, we don't deal with it
        if (!interaction.isChatInputCommand()) {
            logInfo(`Unknown interaction: ${interaction}`);
            return;
        }

        switch (interaction.commandName) {
            case AIRDROP:
                return await executeAirdropCommand(interaction);
            case AIRDROP_ADMIN:
                return await executeAirdropAdminCommand(interaction);
            case WILDFILE:
                return await executeWildfileCommand(interaction);
            case WILDFILE_ADMIN:
                return await executeWildfileAdminCommand(interaction);
            case WILDEVENTS:
                return await executeWildeventsCommand(interaction);
            case FAN:
                return await executeFanCommand(interaction);
            default:
                await interaction.reply(
                    `Unknown command name ${interaction.commandName}`
                );
                return;
        }
    } catch (e) {
        logError("Error while handling interaction", e);
    }
});

/**
 * Called when a user has been updated in the guild (like when a role is added or removed, or a nickname has changed)
 * @param oldMember - member object before the update (previous member version)
 * @param newMember - member object after the update (current member version)
 */
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
        // handle role change to see if a role was added that corresponds to an airdrop
        await handleRoleChange(oldMember, newMember);
    } catch (e) {
        logError("Failed to process guild member update", e);
    }
});

client.on("roleDelete", async (role) => {
    try {
        logInfo(
            `Detected role deletion for ${role.name}, checking if any active airdrops need to be closed...`
        );
        // check for active airdrops for this role
        const airdropDocs = await findAirdropsByQuery({
            active: true,
            roleRequiredId: role.id,
        });
        logInfo(`${airdropDocs.length} airdrop(s) require closing`);
        for (const airdropDoc of airdropDocs) {
            await concludeAirdrop(airdropDoc, client.user.tag, role);
        }
        logInfo(`Finished closing airdrop(s)`);
    } catch (e) {
        logError(`Failed to handle role deletion`, e);
    }
});

// When the client is ready, run this code (only once)
client.once("ready", async () => {
    try {
        if (
            redisClient.status !== "connecting" &&
            redisClient.status !== "ready"
        ) {
            await redisClient.connect();
        }

        // poll the redis queue for new airdrop recipients
        await pollQueueAirdropRecipients();

        // Establish MongoDB Connection
        await establishMongoDBConnection();
        //Also establish MongoDB connection for shared schema package - eventually get rid of the one above
        await connectToDb(
            process.env.MONGODB_NAME,
            process.env.MONGODB_USERNAME,
            process.env.MONGODB_PASSWORD,
            process.env.MONGODB_CLUSTER_NAME
        );

        // setup the blockchain transaction locks
        await createBlockchainTxnLocksIfNecessary();

        // make sure all guild members are loaded. If they aren't loaded into the cache, we can miss role changes
        await loadGuildMembers();

        // set up all swag sets
        await handleReconcileSwagSets();

        // setup our intervals
        setupIntervals();

        // broadcast register wallet message (no longer needed. Was for Wildpass allowlist registration)
        // broadcastRegisterWalletMessage();

        // logging and monitoring
        logInfo(`Discord bot ready: ${client.user.tag}`);

        // reconcile any user who may have received an airdrop role while the bot was offline
        await reconcileAirdropsOnStartup();

        // reconcile discord events on startup
        await reconcileDiscordEventsOnStartup();

        // initialize discord event event listeners
        initDiscordEventEventListeners();
    } catch (e) {
        logError("Fatal bot error on startup", e);
        // Terminate the node server
        process.exit(1);
    }
});

// Login to Discord with your client's token
client.login(getDiscordToken());

/**
 *  Register the SIGINT and SIGTERM event listeners - recommended by nodejs docs
 *  @url - https://blog.heroku.com/best-practices-nodejs-errors#os-signal-events
 */
app.listen(PORT, () => {
    logInfo(`wildcard-airdrop-bot listening on port ${PORT}`);

    process.on("SIGINT", async () => {
        console.log(
            "Caught interrupt signal (SIGINT). Gracefully shutting down..."
        );
        // Gracefully disconnect and shutdown
        redisClient.disconnect();
        process.exit(0);
    });

    process.on("SIGTERM", async () => {
        console.log(
            "Caught termination signal (SIGTERM). Gracefully shutting down..."
        );
        redisClient.disconnect();
        process.exit(0);
    });
});
