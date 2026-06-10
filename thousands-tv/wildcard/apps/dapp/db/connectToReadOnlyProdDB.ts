import mongoose, { ConnectOptions } from "mongoose";

/**
 * Mongo Optimization: Establish mongo connection if one doesn't exist use.
 */
async function connectToReadOnlyProdDB() {
    const mongoDbName = process.env.READ_ONLY_PROD_MONGODB_NAME;
    const mongoDbClusterName = process.env.READ_ONLY_PROD_MONGODB_CLUSTER_NAME;
    const mongoDbUsername = process.env.READ_ONLY_PROD_MONGODB_USERNAME;
    const mongoDbPassword = process.env.READ_ONLY_PROD_MONGODB_PASSWORD;

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
            "Environment variable READ_ONLY_PROD_MONGODB_USERNAME/READ_ONLY_PROD_MONGODB_PASSWORD needs to be set to establish MongoDB connection"
        );
    }

    // Here is where we create a new connection.
    let mongoUrl = `mongodb+srv://${mongoDbUsername}:${mongoDbPassword}@${mongoDbClusterName}.mongodb.net/${mongoDbName}?authSource=admin&ssl=true`;

    const prodConnection = mongoose.createConnection(mongoUrl);

    await prodConnection.asPromise();
    return prodConnection;
}

export default connectToReadOnlyProdDB;
