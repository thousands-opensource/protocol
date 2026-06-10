import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    MONGO_PROFILE_PICTURE,
    MONGO_LINKED_SOCIAL,
    TIMESTAMPS,
    MONGO_LINKED_FARCASTER,
    LEGACY_USERS,
    ILegacyUser,
} from "@repo/interfaces";

const legacyUsersSchema = new Schema<ILegacyUser>({
    discordId: String,
    discordTag: String,
    discordAvatar: String,
    linkWalletGuid: String,
    walletAddress: String,
    wildpassAllowlistWalletAddress: String,
    linkWalletGuidExpiresAt: Date,
    mintWildfileTxn: String,
    mintWildfileTxnTime: Date,
    mintWildfileType: String,
    mintWildfileWildpassTokenId: Number,
    additionalWallets: [String],
    twitter: {
        type: MONGO_LINKED_SOCIAL,
        required: false, // this prevents the field from being added to the user doc even if it was not specified during creation
    },
    twitch: {
        type: MONGO_LINKED_SOCIAL,
        required: false, // this prevents the field from being added to the user doc even if it was not specified during creation
    },
    farcaster: { type: MONGO_LINKED_FARCASTER, required: false },
    showLinkedSocials: Boolean,
    initialWildfileId: Number,
    userAnalytics: {
        // user related analytics
        ipAddress: String, //ipv4 or ipv6 address
    },
    recaptchaScore: Number,
    recaptchaScoreV2: Number,
    latestFeatureRelease: Number,
    favoritePfps: { type: [MONGO_PROFILE_PICTURE], required: false },
    pfp: { type: MONGO_PROFILE_PICTURE, required: false },
    avatarThemeColor: String, // on-chain wildpass trait colors
});

legacyUsersSchema.set(TIMESTAMPS, true);

// Define and export the old users model
const UsersLegacyModel =
    (models[LEGACY_USERS] as Model<ILegacyUser, {}, {}, {}, any>) ||
    model<ILegacyUser>(LEGACY_USERS, legacyUsersSchema);

export type LegacyUserDoc = Document<unknown, any, ILegacyUser> &
    ILegacyUser &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Gets a user from the old users collection by Discord ID.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<IUser | null>} - A promise that resolves to the user document if found, otherwise null.
 * @throws {Error} - Throws an error if the operation fails.
 */
export async function getOldUserByDiscordId(discordId: string) {
    const query = await UsersLegacyModel.findOne({ discordId }).exec();
    return query;
}
