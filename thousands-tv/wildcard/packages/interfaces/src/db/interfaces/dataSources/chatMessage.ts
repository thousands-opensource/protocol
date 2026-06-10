export interface IChatMessage {
    /**
     * Optional reference to the "events" collection (ObjectId as a string).
     * If you are using Mongoose with strict typing, you can also use `Types.ObjectId` here.
     */
    eventId?: string;

    /**
     * The user ID of the person who posted the chat message.
     */
    userId: string;

    /**
     * The text content of the message.
     */
    content: string;

    /**
     * The timestamp of when this chat message was created/sent.
     * You can default this in Mongoose schema to `Date.now()`.
     */
    timestamp?: Date;
}
