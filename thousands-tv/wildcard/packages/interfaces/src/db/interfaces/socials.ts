import { PostedWildevent } from "../dbShared";

export type SocialMediaPlatform = "twitter" | "twitch" | "farcaster";

export interface LinkedSocial {
	id: string;
	username: string;
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	wildevent?: PostedWildevent;
}

export interface LinkSocialBody {
	address?: `0x${string}`;
	platform: SocialMediaPlatform;
	linkedSocial: LinkedSocial;
}

export interface OAuthStateParam {
	platform: SocialMediaPlatform;
	wildfileId: string;
	state: string;
}

export interface OAuth2AccessTokenResponse {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: Date;
}

export interface OAuth2UserResponse {
	id: string;
	username: string;
}
