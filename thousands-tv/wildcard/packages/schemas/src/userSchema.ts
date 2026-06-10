import {
    Schema,
    model,
    Model,
    models,
    Document,
    FilterQuery,
    Types,
    UpdateQuery,
    UpdateWithAggregationPipeline,
    ProjectionType,
    ProjectionFields,
    QueryOptions,
    PipelineStage,
    ClientSession,
} from "mongoose";
import {
    AccountProviderType,
    AccountStatus,
    IUser,
    MONGO_REQUIRED_BOOLEAN,
    UserRole,
    LEGACY_USERS,
    USERS,
    TIMESTAMPS,
    KycStatus,
} from "@repo/interfaces";

const mongoPfpData = {
    tokenId: String,
    contractAddress: String,
    chainId: Number,
    name: String,
    imageUrl: String,
    accountProviderType: String,
};

const mongoAccountProvider = {
    id: String,
    name: String,
    image: String,
    email: String,
};

const mongoBeamableAccountProvider = {
    ...mongoAccountProvider,
    isVerified: Boolean,
};

const usersSchema = new Schema<IUser>({
    preferredProvider: {
        type: String,
        enum: Object.values(AccountProviderType),
        required: true,
    },
    walletProvider: {
        address: { type: String, default: "" },
        additionalWallets: [String],
        wildfile: {
            tokenId: Number,
            initialWildfileId: Number,
            mintTxn: String,
            mintTxnTime: Date,
            mintType: String,
            mintWildpassTokenId: Number,
            wildpassAllowlistWalletAddress: String,
        },
        favoritePfps: [mongoPfpData],
        pfp: mongoPfpData,
    },
    discordProvider: mongoAccountProvider,
    googleProvider: mongoAccountProvider,
    beamableProvider: mongoBeamableAccountProvider,
    twitchProvider: mongoAccountProvider,
    kickProvider: mongoAccountProvider,
    twitterProvider: mongoAccountProvider,
    accumulatedPersonalCredits: Number,
    competitorStripeId: String,
    autoAcceptOffers: {
        type: Boolean,
        default: null,
    },
    bannedOn: {
        type: Date,
        default: null,
    },
    payoutMethod: {
        type: String,
        enum: ["USD", "USDC"],
        required: false,
    },
    thousandsXp: Number,
    draftPicksEarned: Number,
    draftPicksConsumed: Number,

    isSuspended: Boolean,
    suspendedUntil: Date,

    roles: {
        type: [String],
        enum: Object.values(UserRole),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.ACTIVE,
    },
    preferences: {
        displayName: String,
        activePfpImageUrl: {
            type: String,
            enum: Object.values(AccountProviderType),
        },
        avatarThemeColor: String,
        showLinkedSocials: MONGO_REQUIRED_BOOLEAN,
        sendNotifications: MONGO_REQUIRED_BOOLEAN,
        primarylNotificationEmail: String,
        defaultProfileImageUrl: String,
    },
    latestFeatureRelease: Number,
    authenticator: {
        appEnabled: Boolean,
        appSecretKey: String,
        appMethod: String,
        mfaStepCompleted: Boolean,
        mfaStepCompletedAt: Date,
    },
    analytics: {
        ipAddress: String,
        lastPasswordResetOn: Date,
        lastLogin: Date,
        lastLoginIp: String,
        lastLoginUserAgent: String,
    },
    originalUserId: {
        type: Schema.Types.ObjectId,
        ref: LEGACY_USERS,
    },
    kyc: {
        sessionId: String,
        status: {
            type: String,
            enum: Object.values(KycStatus),
            default: KycStatus.NOTSTARTED,
        },
        depositAddress: String,
    },
    stripeConnectedAccountEnabled: {
        type: Boolean,
        default: false,
    },
});

usersSchema.set(TIMESTAMPS, true);
usersSchema.index({ "walletProvider.address": 1 });
usersSchema.index({ "walletProvider.additionalWallets": 1 });

// Define and export the users model
export const usersModel =
    (models[USERS] as Model<IUser, {}, {}, {}, any>) ||
    model<IUser>(USERS, usersSchema);

export type UserDoc = Document<unknown, any, IUser> &
    IUser &
    Required<{ _id: Types.ObjectId }>;

/**
 * Aggregates user data in the database based on the provided pipeline.
 * @param pipeline - The MongoDB aggregation pipeline used to update users.
 * @returns A promise that resolves to the updated user document.
 */
export async function aggregateUserDB(pipeline: PipelineStage[]) {
    return usersModel.aggregate(pipeline);
}

/**
 * Counts the number of user documents that match the provided query.
 * @param query - The MongoDB query used to fetch users.
 * @returns A promise that resolves to the number of matching documents.
 */
export async function countUsersDocument(query: FilterQuery<IUser>) {
    return await usersModel.countDocuments(query);
}

/**
 * Creates a new user in the database with the given attributes.
 * @param userAttributes - Attributes for the new user.
 * @returns A promise that resolves to the created user document or null if creation failed.
 */
export async function createUserWithAttributes(
    userAttributes: Partial<IUser>
): Promise<UserDoc | null> {
    try {
        const newUser = new usersModel(userAttributes);
        return await newUser.save();
    } catch (error) {
        console.error("Failed to create user:", error);
        return null;
    }
}

/**
 * Finds a single user document based on the provided query.
 * @param query - The MongoDB query used to fetch the user.
 * @returns A promise that resolves to the found user document or null if not found.
 */
export async function findOneUserByQuery(
    query: FilterQuery<IUser>
): Promise<UserDoc | null> {
    return await usersModel.findOne(query).sort({ _id: -1 });
}

/**
 * Finds a single user document based on the provided query, with authorized fields omitted.
 * @param query - The MongoDB query used to fetch the user.
 * @returns A promise that resolves to the found user document or null if none found.
 */
export async function findOneUserByQueryAuthorized(
    query: FilterQuery<IUser>
): Promise<UserDoc | null> {
    // omit userAnalytics (this user object gets sent back to frontend)
    const projection: ProjectionType<IUser> = {
        userAnalytics: 0,
        __v: 0,
        "wildfile.twitter.accessToken": 0,
        "wildfile.twitter.refreshToken": 0,
        "wildfile.twitter.accessTokenExpiresAt": 0,
        "wildfile.twitch.accessToken": 0,
        "wildfile.twitch.refreshToken": 0,
        "wildfile.twitch.accessTokenExpiresAt": 0,
    };

    return await usersModel.findOne(query, projection);
}

/**
 * Finds a single user document based on the provided query, with public fields only.
 * @param query - The MongoDB query used to fetch the user.
 * @returns A promise that resolves to the found user document or null if none found.
 */
export async function findOneUserByQueryPublic(
    query: FilterQuery<IUser>
): Promise<UserDoc | null> {
    let projection: ProjectionType<IUser> = {
        "walletProvider.address": 1,
        "discordProvider.name": 1,
        "pfp.selected": 1, // Assuming pfp (profile picture) is handled directly now
        "preferences.avatarThemeColor": 1,
    };
    // only return the linkWalletGuid if it's part of the query
    if (query["walletProvider.linkWalletGuid"]) {
        projection["walletProvider.linkWalletGuid"] = 1;
    }

    return await usersModel.findOne(query, projection);
}

/**
 * Finds all user documents based on the provided query, sorted by the most recent.
 * @param query - The MongoDB query used to fetch users.
 * @param projectionFields - Fields to include or exclude in the returned documents.
 * @param queryOption - Additional options for the query.
 * @returns A promise that resolves to an array of user documents or an empty array if none found.
 */
export async function findUsersByQuery(
    query: FilterQuery<IUser>,
    projectionFields?: ProjectionFields<IUser>,
    queryOption?: QueryOptions<IUser>
) {
    return await usersModel
        .find(query, projectionFields, queryOption)
        .sort({ _id: -1 });
}

/**
 * Finds a user document by their provider account ID.
 * @param providerAccountId - The account ID from the OAuth provider.
 * @param providerType - The type of the account provider (e.g., 'google', 'discord').
 * @returns A promise that resolves to the user document or null if not found.
 */
export async function findUserByProviderId(
    providerId: string,
    providerType: string
) {
    const providerField = `${providerType.toLowerCase()}Provider.id`;

    const query = {
        [providerField]: providerId,
    };

    const user = await usersModel.findOne(query);
    return user;
}

/**
 * Finds a user document by their linked wallet address.
 * @param walletAddress - The wallet address to search for.
 * @returns A promise that resolves to the user object if found, or null if not found.
 * @throws Throws an error if there is an issue with the database query.
 */
export async function findUserByWalletAddress(walletAddress: string) {
    try {
        const user = await usersModel.findOne({
            linkedAccounts: {
                $elemMatch: {
                    walletAddress: walletAddress,
                    accountProviderType: "wallet", // Assuming "wallet" is the accountProviderType for linked wallet accounts
                },
            },
        });
        return user;
    } catch (error) {
        console.error("Error finding user by wallet address:", error);
        throw error;
    }
}

/**
 * Updates a single user document in the database based on the provided query.
 * @param query - The MongoDB query used to find the user to update.
 * @param update - The object defining the update to apply.
 * @param options - Additional options, including a MongoDB session for atomic transactions (optional).
 * @returns A promise that resolves to the updated user document.
 */
export async function updateOneUserDB(
    query: FilterQuery<IUser>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IUser>,
    options?: { session?: ClientSession }
) {
    return await usersModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
        ...options,
    });
}

/**
 * Updates multiple user documents in the database based on the provided update list.
 * @param updateList - A list of queries and update objects to be applied in bulk.
 * @returns A promise that resolves when the bulk update operation is complete.
 */
export async function updateUserBulkDB(updateList: any) {
    await usersModel.bulkWrite(updateList);
}

/**
 * Updates the active profile picture provider for a user.
 * @param userId - The ID of the user to update.
 * @param providerType - The type of the account provider to set as active.
 * @returns A promise that resolves to the updated user document or null if the update failed.
 */
export async function updateActivePfpProviderDB(
    userId: Types.ObjectId,
    providerType: AccountProviderType
): Promise<UserDoc | null> {
    return await usersModel.findOneAndUpdate(
        { _id: userId },
        { "preferences.activePfpImageUrl": providerType },
        { new: true } // Return the updated document
    );
}
