import { getMongoConnectionURL } from "@/utils/environmentUtilWCA";
import mongoose, { ConnectOptions } from "mongoose";

/**
 * Establishes a connection to MongoDB. Called once, when the bot starts up.
 */
const mongoUrl = getMongoConnectionURL();
let connection: mongoose.Connection | null = null;

async function establishMongoDBConnection() {
    try {
        if (!connection || mongoose.connection.readyState === 0) {
            mongoose.set("strictQuery", false);

            await mongoose.connect(mongoUrl, {
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            } as ConnectOptions);

            connection = mongoose.connection;

            console.log("MongoDB connection established successfully");
        }

        return connection;
    } catch (e) {
        console.error(
            `establishMongoDBConnection: Failed to establish connection to mongo`,
            e
        );
        return null;
    }
}

export default establishMongoDBConnection;
