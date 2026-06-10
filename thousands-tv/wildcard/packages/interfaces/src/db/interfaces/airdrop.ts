import { Types } from "mongoose";

export interface IAirdrop {
    createdBy: string; // discord tag of the airdrop admin who started the airdrop
    concludedBy?: string; // discord tag of the airdrop admin who concluded the airdrop
    active: boolean; // whether this airdrop is active
    roleRequiredId: string; // the role required to participate in this airdrop
    smartContractAddress: string; // smart contract address of the airdrop giveaway (must be ERC1155)
    tokenId: string; // tokenId of the airdrop giveaway
    tokenMetadata: TokenMetadata; // metadata of the airdop token
    broadcastChannelId: string; // channel id of channel airdrop was broadcasted to
    broadcastMessageId?: string; // message id of the message broadcast to the airdrops channel
    claimAirdropThreadIds?: string[]; // list of thread ids where users who have the eligible role can claim the airdrop
    airdropEligibleUsers?: AirdropEligibleUser[]; // list of discord users that are eligible for the airdrop
    concludesAt?: Date; // timestamp when the airdrop should automatically conclude

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface AirdropEligibleUser {
    discordTag: string; // discord tag of the eligible user (just used for readability)
    discordId: string; // discord user who is eligible for the airdrop
    hasClaimed: boolean; // whether they've claimed it yet
    address?: string; // address they sent the token to
    txnHash?: string; // txn hash where the bot airdropped the user the token
}

export interface TokenMetadata {
    image: string;
    name: string;
    description: string;
    external_link: string;
    animation_url: string;
    traits: TokenTrait[];
}

export interface TokenTrait {
    trait_type: string;
    value: string;
    display_type: string;
    max_value: string;
    trait_count: number;
    order: number;
}
