# Wildcard Airdrop Bot

### Setup

-   Create a discord bot to use locally for testing
    -   Follow `https://discord.com/developers/docs/getting-started#creating-an-app` up to and through `Installing your app`
-   Make sure your bot is in your discord channel
-   Copy `.env.sample` to `.env`
-   Set the environment variables in that file
    -   you'll need to set the discord token, discord application id (bot id), and guild id (server id)
-   Register the slash commands used by the bot: `npm run registerCommandsLocal`
    -   Note: You only need to run this once... unless you modify the slash command definitions of the bot, then you need to rerun it
    -   Note: for test env, run `npm run registerCommandsTest` after setting the relevant test env variables (see `registerCommands.ts`)
        -   similarly, use `npm run registerCommandsProd` for productions after setting the relevant prod env variables
-   Run the bot: `npm run dev`

---

### Redis CLI Setup
- The FanVis feature uses a Redis connection to interact with the Game Server. In order for the bot to be up for local development, the bot requires Redis: run `redis-server`
- Installation steps: https://redis.io/docs/install/install-redis/install-redis-on-mac-os/
