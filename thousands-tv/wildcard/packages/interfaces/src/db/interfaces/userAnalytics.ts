import { Types } from "mongoose";

export interface IUserAnalytics {
	// user related analytics
	discordId?: string; // discordId of the user
	ipAddress: string; // list of timestamps of user's last login activity

	// mongo fields
	createdAt?: Date;
	updatedAt?: Date;
	_id?: Types.ObjectId;
	__v?: number;
}

export enum IdentifierType {
	discordTag = "discordTag",
	walletAddress = "walletAddress",
	id = "id",
}

export interface LoggingIdentifier {
	type: IdentifierType;
	identifier: string;
}
