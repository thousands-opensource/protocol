// @repo/interfaces/index.ts (or a dedicated IReaction.ts file)

export interface IReaction {
    /**
     * Optional reference to an "events" collection (ObjectId as a string),
     * if this reaction is associated with a specific event.
     */
    eventId?: string;

    /**
     * The MongoDB _id (as a string) of the original chat message being reacted to.
     * This references the ChatMessage doc in the 'chatMessages' collection.
     */
    targetMessageId: string;

    /**
     * The text content of the message.
     */
    content: string;

    /**
     * The user ID of the person who posted the original message.
     */
    originalMessageUserId: string;

    /**
     * The user ID of the person who made the reaction.
     */
    reactorUserId: string;

    /**
     * The emoji or reaction symbol (e.g., "🔥", "👍", etc.).
     */
    emoji: string;

    /**
     * When this reaction was created. If not provided, the Mongoose schema
     * can default to `Date.now()`.
     */
    reactionTimestamp?: Date;
}
