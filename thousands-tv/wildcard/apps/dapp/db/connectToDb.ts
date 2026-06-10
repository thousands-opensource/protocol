import mongoose, { ConnectOptions } from "mongoose";

/**
 * Mongo Optimization: Establish mongo connection if one doesn't exist use.
 */
async function connectToDb() {
    // Check if there is an active connection.
    if (mongoose.connections[0].readyState) return;

    try {
        const mongoDbName = process.env.MONGODB_NAME;
        const mongoDbClusterName = process.env.MONGODB_CLUSTER_NAME;
        const mongoDbUsername = process.env.MONGODB_USERNAME;
        const mongoDbPassword = process.env.MONGODB_PASSWORD;

        if (!mongoDbName) {
            throw new Error(
                "Environment variable MONGODB_NAME needs to be set to establish MongoDB connection"
            );
        }
        if (!mongoDbClusterName) {
            throw new Error(
                "Environment variable MONGODB_CLUSTER_NAME needs to be set to establish MongoDB connection"
            );
        }
        if (!mongoDbUsername || !mongoDbPassword) {
            throw new Error(
                "Environment variable MONGODB_USERNAME or MONGODB_PASSWORD needs to be set to establish MongoDB connection"
            );
        }
        const opts = {
            useNewUrlParser: true,
        };

        // Here is where we create a new connection.

        const mongoUrl = `mongodb+srv://${mongoDbUsername}:${mongoDbPassword}@${mongoDbClusterName}.mongodb.net/${mongoDbName}?retryWrites=true&w=majority`;
        await mongoose.connect(mongoUrl, opts as ConnectOptions);
        console.log(
            `MongoDB Connection Established to database: ${mongoDbName}`
        );

        return mongoose;
    } catch (e) {
        console.error("Failed to establish connection to mongo", e);
    }
}

export default connectToDb;
