import { Types } from "mongoose";
import { LinkedFarcaster, PfpMetadata, UserAnalytics } from "./user";
import { LinkedSocial } from "./socials";

export interface ILegacyUser {
	discordId: string;
	discordTag: string;
	discordAvatar?: string;
	linkWalletGuid?: string;
	linkWalletGuidExpiresAt?: Date;
	walletAddress?: string;
	mintWildfileTxn?: string; // txn where we minted a Wildfile on behalf of the user
	mintWildfileTxnTime?: Date; // time of mint event
	mintWildfileType?: string; // type of mint function used for wildfile (i.e. public mint, allowlist mint, wildpass mint)
	mintWildfileWildpassTokenId?: number; // for wildfiles minted using wildpass, gets the token id of the wildpass used
	additionalWallets?: string[]; // additional wallet addresses the user wants to link to their account
	wildpassAllowlistWalletAddress?: string; // address registered for the Wildpass allowlist (no signature required)
	userAnalytics?: UserAnalytics; // user related analytics including IP address
	showLinkedSocials?: boolean; // whether or not the user wants to show their linked socials
	initialWildfileId?: number;

	twitter?: LinkedSocial;

	twitch?: LinkedSocial;
	farcaster?: LinkedFarcaster;
	recaptchaScore?: number;
	recaptchaScoreV2?: number;
	latestFeatureRelease?: number;
	favoritePfps?: PfpMetadata[];
	pfp?: PfpMetadata;
	avatarThemeColor?: string;

	// mongo fields
	createdAt?: Date;
	updatedAt?: Date;
	_id?: Types.ObjectId;
	__v?: number;
}
