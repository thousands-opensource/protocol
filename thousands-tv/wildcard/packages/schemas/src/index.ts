import mongoose from "mongoose";
export * from "./airdropFanAttendanceSchema";
export * from "./airdropSchema";
export * from "./badgeSchema";
export * from "./blacklistedAddressSchema";
export * from "./claimedSwagSetSchema";
export * from "./collectibleSchema";
export * from "./discordBroadcastMessageSchema";
export * from "./discordEventSchema";
export * from "./eventSchema";
export * from "./stageSchema";
export * from "./seriesSchema";
export * from "./sponsoredEventSchema";
export * from "./userSponsoredEventSchema";
export * from "./recognitionProgramSchema";
export * from "./claimedTicketSchema";
export * from "./stageIdleEventsSchema";
export * from "./freeTicketSchema";
export * from "./gasExpenditureSchema";
export * from "./kudosEventSchema";
export * from "./leaderboardSchema";
export * from "./legacyUserSchema";
export * from "./lockSchema";
export * from "./manualAidropSchema";
export * from "./mintFrameUsersSchema";
export * from "./nftAccessSchema";
export * from "./notificationSchema";
export * from "./pointsSchema";
export * from "./pointsDefinitionSchema";
export * from "./rippedTicketSchema";
export * from "./serverSchema";
export * from "./streamSchema";
export * from "./swagSetSchema";
export * from "./thousandsLinkCodeSchema";
export * from "./transactionQueueSchema";
export * from "./userAnalyticsSchema";
export * from "./userSchema";
export * from "./accessCodeSchema";
export * from "./ticketQueueSchema";
export * from "./activityLogSchema";
export * from "./userStatsSchema";
export * from "./creditTransactionSchema";
export * from "./creditBalanceSchema";
export * from "./thousandsPointsTransactionSchema";
export * from "./playerEarningsTransactionSchema";
export * from "./playerEarningsSchema";
export * from "./franchiseTransactionsSchema";
export * from "./franchiseOffersSchema";
export * from "./tournamentsSchema";
export * from "./chatMessagesSegments";
export * from "./chatReactionsSegments";
export * from "./boostBalanceSchema";
export * from "./boostsSegmentsSchema";
export * from "./identitySchema";
export * from "./tokenDistributionLogSchema";
export * from "./skyboxSchema";
export * from "./giftEventSchema";
export * from "./externalStreamSchema";
export * from "./streamerStatsSchema";
export * from "./protocolPayoutSchema";
export * from "./rallyPredictionSchema";
export * from "./userRallyPredictionSchema";
export * from "./userInsightScoreSchema";
export * from "./predictionChartDataSchema";
export * from "./predictionChartDataSchema";
export * from "./metricSchema";
export * from "./matchResultSchema";
export * from "./matchResultSchema2";
export * from "./proSchema";
export * from "./proActionSchema";
export * from "./prosTestSchema";
export * from "./tournamentPayoutScheduleSchema";
export * from "./tournamentOptionsSchema";
export * from "./nftsToProcessSchema";

export async function connectToDb(
    mongoDbName: string,
    mongoDbUsername: string,
    mongoDbPassword: string,
    mongoDbClusterName: string
) {
    try {
        if (!mongoDbName) {
            throw new Error(
                "Environment variable MONGODB_NAME needs to be set to establish MongoDB connection"
            );
        }

        if (!mongoDbUsername) {
            throw new Error(
                "Environment variable MONGODB_USERNAME needs to be set to establish MongoDB connection"
            );
        }

        if (!mongoDbPassword) {
            throw new Error(
                "Environment variable MONGODB_PASSWORD needs to be set to establish MongoDB connection"
            );
        }

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

        // setup error handling
        mongoose.connection.on("error", (err) => {
            console.log("MongoDB connection error", err);
        });

        console.log(
            `MongoDB Connection Established to database: ${mongoDbName}, on cluster ${mongoDbClusterName}`
        );
    } catch (e) {
        console.error("Failed to establish connection to mongo", e);
    }
}
