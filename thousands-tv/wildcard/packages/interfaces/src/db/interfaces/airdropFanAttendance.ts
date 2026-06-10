import { AirdropEligibleUser, TokenMetadata } from "./airdrop";
import { Types } from "mongoose";

export interface IAirdropFanAttendance {
    createdBy: string; // discord tag of the airdrop admin who started the airdrop
    active: boolean; // whether this airdrop is active
    smartContractAddress: string; // smart contract address of the airdrop giveaway (must be ERC1155)
    tokenId: string; // tokenId of the airdrop giveaway
    tokenMetadata: TokenMetadata; // metadata of the airdop token
    eventChanelId: string; // channel id of the game event
    chainId: number; // chain id of the airdrop
    broadcastChannelId: string; // channel id of channel airdrop was broadcasted to
    broadcastMessageId?: string; // message id of the message broadcast to the airdrops channel
    airdropEligibleUsers?: AirdropEligibleUser[]; // list of discord users that are eligible for the airdrop

    // fanVis feature extension
    sessionCode?: string; // game server session code for linking airdrop/event to a game session

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
