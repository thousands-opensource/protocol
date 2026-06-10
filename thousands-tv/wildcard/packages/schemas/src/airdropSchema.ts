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
    IAirdrop,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const AIRDROPS_TABLE_NAME = "airdrops";

const airdropsSchema = new Schema<IAirdrop>({
    createdBy: MONGO_REQUIRED_STRING, // discord tag of the airdrop admin who started the airdrop
    concludedBy: String, // discord tag of the airdrop admin who concluded the airdrop
    active: Boolean, // whether this airdrop is active
    roleRequiredId: MONGO_REQUIRED_STRING, // the role required to participate in this airdrop
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
    broadcastChannelId: String, // channel id of channel airdrop was broadcasted to
    broadcastMessageId: String, // message id of the message broadcast to the airdrops channel
    claimAirdropThreadIds: [String], // list of thread ids where users who have the eligible role can claim the airdrop
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
    concludesAt: Date, // timestamp when the airdrop should automatically conclude
});

airdropsSchema.set(TIMESTAMPS, true);

// optimize index queries for airdrop schema
airdropsSchema.index({ claimAirdropThreadIds: 1 });
airdropsSchema.index({ active: 1, concludesAt: 1 });

const airdropsModel =
    (models[AIRDROPS_TABLE_NAME] as Model<IAirdrop, {}, {}, {}, any>) ||
    model<IAirdrop>(AIRDROPS_TABLE_NAME, airdropsSchema);

// mongo type for an airdrop doc fetched from mongo
export type AirdropDoc = Document<Types.ObjectId, {}, IAirdrop> &
    IAirdrop &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Returns an airdrop document based on the provided query.
 * @param query - The MongoDB query used to fetch the airdrop.
 * @returns The found AirdropDoc or null if none is found.
 */
export async function findOneAirdropByQuery(query: FilterQuery<IAirdrop>) {
    return await airdropsModel.findOne(query);
}

/**
 * Returns all airdrop documents based on the provided query, sorted by the most recent.
 * @param query - The MongoDB query used to fetch the airdrops.
 * @returns An array of AirdropDocs or an empty array if none are found.
 */
export async function findAirdropsByQuery(query: FilterQuery<IAirdrop>) {
    return await airdropsModel.find(query).sort({ _id: -1 });
}

/**
 * Creates a new airdrop document in the database.
 * @param airdrop - The airdrop object to create.
 * @returns The created AirdropDoc.
 */
export async function createAirdropDB(airdrop: IAirdrop) {
    return await airdropsModel.create(airdrop);
}

/**
 * Updates a specific user's information in the airdropEligibleUsers array of an airdrop document.
 * @param airdropId - The ID of the airdrop document to update.
 * @param discordId - The Discord ID of the user to update within the airdropEligibleUsers array.
 * @param airdropEligibleUser - The updated airdropEligibleUser object to set in the array.
 * @returns The result of the update operation.
 */
export async function updateAirdropEligibleUserDB(
    airdropId: Types.ObjectId,
    discordId: string,
    airdropEligibleUser: AirdropEligibleUser
) {
    const query = {
        _id: airdropId,
        "airdropEligibleUsers.discordId": discordId,
    };
    // the positional $ operator acts as a placeholder for the first match of the update query document
    return await airdropsModel.updateOne(query, {
        $set: { "airdropEligibleUsers.$": airdropEligibleUser },
    });
}

/**
 * Updates a single airdrop document in the database.
 * @param airdropId - The ID of the airdrop document to update.
 * @param updateObj - The object defining the update to apply.
 * @returns The updated AirdropDoc.
 */
export async function updateOneAirdropDB(
    airdropId: Types.ObjectId,
    updateObj: UpdateWithAggregationPipeline | UpdateQuery<IAirdrop>
) {
    const query = { _id: airdropId };
    return await airdropsModel.findOneAndUpdate(query, updateObj, {
        returnDocument: "after",
    });
}
