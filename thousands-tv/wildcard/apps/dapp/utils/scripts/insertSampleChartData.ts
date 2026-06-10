import dotenv from "dotenv";
import { connectToDb } from "@repo/schemas";
import { predictionChartDataModel } from "@repo/schemas";
import { Types } from "mongoose";

dotenv.config();

async function insertSampleChartData() {
    try {
        await connectToDb(
            process.env.MONGODB_NAME!,
            process.env.MONGODB_USERNAME!,
            process.env.MONGODB_PASSWORD!,
            process.env.MONGODB_CLUSTER_NAME!
        );

        const sampleRallyPredictionId = new Types.ObjectId();
        console.log(`Using rally prediction ID: ${sampleRallyPredictionId}`);

        // Use current time and go backwards to create recent data
        const now = new Date();
        const sampleData = [];

        for (let i = 0; i < 50; i++) {
            // Create data points every 2 minutes, going back 100 minutes (within the 180-minute window)
            const timestamp = new Date(now.getTime() - (49 - i) * 60000 * 2);
            const price = 0.5 + Math.sin(i * 0.2) * 0.3 + (Math.random() - 0.5) * 0.1;

            sampleData.push({
                rallyPredictionId: sampleRallyPredictionId,
                timestamp,
                price: Math.max(0.1, Math.min(0.9, price))
            });
        }

        await predictionChartDataModel.insertMany(sampleData);
        console.log(`Inserted ${sampleData.length} sample chart data points`);
        console.log(`Rally Prediction ID: ${sampleRallyPredictionId}`);

        process.exit(0);
    } catch (error) {
        console.error('Error inserting sample data:', error);
        process.exit(1);
    }
}

insertSampleChartData();
