import { IDiscordEvent, PfpMetadata } from "@repo/interfaces";

/**
 * Join type to determine channel entrance or exit
 */
export enum QueueMessageJoinType {
    ENTRANCE = "Entrance",
    EXIT = "Exit",
}

/**
 * Redis queue message types
 */
export enum EventType {
    PLAYTEST_CREATED = "playtestCreated",
    CHANNEL_ENTRANCE = "channelEntrance",
    CHANNEL_EXIT = "channelExit",
    FAN_REACTION = "fanReaction",
}

export interface QueueMessageBase {
    eventType: EventType;
    discordId: string;
    timestamp: number;
}

/**
 * Queue message sent to the game server
 * @dev - inherits directly from QueueMessageBase, separate naming for clarity
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueueMessageChannelExit extends QueueMessageBase {}

/**
 * User/ fan activity object sent to the game server
 */
export interface QueueMessageFanReaction extends QueueMessageBase {
    reaction?: string;
}

/**
 * Enriched user activity object sent to the game server
 */
export interface QueueMessageChannelEntrance extends QueueMessageChannelExit {
    discordTag: string;
    discordAvatarUrl: string;
    walletAddress?: string; // user entering can be non-linked wallet addresses
    pfp?: PfpMetadata | object;
}

/**
 * Message received from Redis queue via game server of the airdrop recipient eligible for a token
 */
export interface ReceiveMessageDiscordAirdropRecipient {
    discordId: string;
    sessionCode: string;
    timestamp: number;
}

/**
 * Message sent to the game server upon confirmation of the eligible airdrop recipient incl. on-chain txn hash for the token transferred
 */
export interface QueueMessageAirdropRecipientConfirmation
    extends ReceiveMessageDiscordAirdropRecipient {
    txnHash: string; // sent when airdrop txn has been submitted on-chain
}

/**
 * Event object sent to the game server
 */
export interface QueueMessageEventCreation extends IDiscordEvent {
    eventType: EventType;
}
