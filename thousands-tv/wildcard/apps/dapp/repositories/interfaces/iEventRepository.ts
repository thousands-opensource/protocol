import { EventDoc } from "@repo/schemas";
import { IEvent } from "@repo/interfaces";
import { ClientSession } from "mongoose";

export default interface IEventRepository {
    createEvent(event: IEvent): Promise<EventDoc | null>;

    getEvent(eventId: string): Promise<EventDoc | null>;

    updateEntireEvent(
        event: IEvent,
        session?: ClientSession
    ): Promise<EventDoc | null>;
}
