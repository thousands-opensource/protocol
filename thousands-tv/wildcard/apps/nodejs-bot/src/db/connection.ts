import mongoose from "mongoose";
import { EventEmitter } from "events";
import { logError, logInfo } from "@src/logger";

/**
 * Establishes a connection to Mongo DB. Called once, when the bot starts up
 */
export async function establishMongoDBConnection() {
    try {
        const mongoDbName = process.env.MONGODB_NAME;
        if (!mongoDbName) {
            throw new Error(
                "Environment variable MONGODB_NAME needs to be set to establish MongoDB connection"
            );
        }

        const mongoDbUsername = process.env.MONGODB_USERNAME;
        if (!mongoDbUsername) {
            throw new Error(
                "Environment variable MONGODB_USERNAME needs to be set to establish MongoDB connection"
            );
        }

        const mongoDbPassword = process.env.MONGODB_PASSWORD;
        if (!mongoDbPassword) {
            throw new Error(
                "Environment variable MONGODB_PASSWORD needs to be set to establish MongoDB connection"
            );
        }

        const mongoDbClusterName = process.env.MONGODB_CLUSTER_NAME;
        if (!mongoDbClusterName) {
            throw new Error(
                "Environment variable MONGODB_CLUSTER_NAME needs to be set to establish MongoDB connection"
            );
        }

        // setup the connection
        const mongoUrl = `mongodb+srv://${mongoDbUsername}:${mongoDbPassword}@${mongoDbClusterName}.mongodb.net/${mongoDbName}?retryWrites=true&w=majority`;
        mongoose.set("strictQuery", false);
        await mongoose.connect(mongoUrl, {
            keepAlive: true,
        });

        logInfo(
            `MongoDB Connection Established to database: ${mongoDbName}, on cluster ${mongoDbClusterName}`
        );
    } catch (e) {
        logError("Failed to establish connection to mongo", e);
    }
}
