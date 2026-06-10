import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    UpdateWithAggregationPipeline,
    UpdateQuery,
} from "mongoose";
import {
    AirdropEligibleUser,
    IAirdropFanAttendance,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const AIRDROP_FAN_ATTENDANCES_TABLE_NAME = "airdrop-fan-attendances";

const airdropsFanAttendancesSchema = new Schema<IAirdropFanAttendance>({
    createdBy: MONGO_REQUIRED_STRING, // discord tag of the airdrop admin who started the airdrop
    active: Boolean, // whether this airdrop is active
    smartContractAddress: MONGO_REQUIRED_STRING, // smart contract address of the airdrop giveaway (must be ERC1155)
    tokenId: MONGO_REQUIRED_STRING, // tokenId of the airdrop giveaway
    tokenMetadata: {
        image: String,
        name: String,
        description: String,
        external_link: String,
        animation_url: String,
        traits: [
            {
                trait_type: String,
                value: String,
                display_type: String,
                max_value: String,
                trait_count: Number,
                order: Number,
            },
        ],
    },
    eventChanelId: String, // channel id of the stage gaming event
    chainId: Number, // chain id of the airdrop
    broadcastChannelId: String, // channel id of channel airdrop was broadcasted to
    broadcastMessageId: String, // message id of the message broadcast to the airdrops channel
    airdropEligibleUsers: [
        // list of discord users that are eligible for the airdrop
        {
            discordTag: String, // discord tag of the eligible user (just used for readability)
            discordId: String, // discord user who is eligible for the airdrop
            hasClaimed: Boolean, // whether they've claimed it yet
            address: String, // address they sent the token to
            txnHash: String, // txn hash where the bot airdropped the user the token
        },
    ],
    sessionCode: String, // session code for the airdrop
});

airdropsFanAttendancesSchema.set(TIMESTAMPS, true);

const airdropsFanAttendanceModel =
    (models[AIRDROP_FAN_ATTENDANCES_TABLE_NAME] as Model<
        IAirdropFanAttendance,
        {},
        {},
        {},
        any
    >) ||
    model<IAirdropFanAttendance>(
        AIRDROP_FAN_ATTENDANCES_TABLE_NAME,
        airdropsFanAttendancesSchema
    );

// mongo type for an airdrop doc fetched from mongo
export type AirdropFanAttendanceDoc = Document<
    Types.ObjectId,
    any,
    IAirdropFanAttendance
> &
    IAirdropFanAttendance &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Creates a new airdropFanAttendance document in the database.
 * @param airdropFanAttendance - The airdropFanAttendance object to create.
 * @returns The created airdropFanAttendance document.
 */
export async function createAirdropFanAttendanceDB(
    airdropFanAttendance: IAirdropFanAttendance
) {
    return await airdropsFanAttendanceModel.create(airdropFanAttendance);
}

/**
 * Finds and returns a single airdropFanAttendance document based on the provided query.
 * @param query - The MongoDB query object used to find the airdropFanAttendance document.
 * @returns The found AirdropFanAttendanceDoc, or null if no document matches the query.
 */
export async function findOneAirdropFanAttendanceByQuery(
    query: FilterQuery<IAirdropFanAttendance>
) {
    return await airdropsFanAttendanceModel.findOne(query);
}

/**
 * Updates a specific user's information in the airdropEligibleUsers array of an airdropFanAttendance document.
 * @param airdropFanAttendanceId - The ID of the airdropFanAttendance document to update.
 * @param discordId - The Discord ID of the user to update within the airdropEligibleUsers array.
 * @param airdropFanAttendanceEligibleUser - The updated airdropEligibleUser object to set in the array.
 * @returns The result of the update operation.
 */
export async function updateAirdropFanAttendanceEligibleUserDB(
    airdropFanAttendanceId: Types.ObjectId,
    discordId: string,
    airdropFanAttendanceEligibleUser: AirdropEligibleUser
) {
    const query = {
        _id: airdropFanAttendanceId,
        "airdropEligibleUsers.discordId": discordId,
    };
    // the positional $ operator acts as a placeholder for the first match of the update query document
    return await airdropsFanAttendanceModel.updateOne(query, {
        $set: { "airdropEligibleUsers.$": airdropFanAttendanceEligibleUser },
    });
}

/**
 * Updates a single airdropFanAttendance document in the database.
 * @param airdropFanAttendanceId - The ID of the airdropFanAttendance document to update.
 * @param updateObj - The object defining the update to apply.
 * @returns The updated airdropFanAttendance document.
 */
export async function updateOneAirdropFanAttendanceDB(
    airdropFanAttendanceId: Types.ObjectId,
    updateObj:
        | UpdateWithAggregationPipeline
        | UpdateQuery<IAirdropFanAttendance>
) {
    const query = { _id: airdropFanAttendanceId };
    return await airdropsFanAttendanceModel.findOneAndUpdate(query, updateObj, {
        returnDocument: "after",
    });
}
