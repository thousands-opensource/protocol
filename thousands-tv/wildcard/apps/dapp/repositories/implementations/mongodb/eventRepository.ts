import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { IEvent } from "@repo/interfaces";
import { ClientSession, Types } from "mongoose";
import IEventRepository from "@/repositories/interfaces/iEventRepository";
import { EventDoc, eventsModel } from "@repo/schemas";

@injectable()
export default class eventRepository implements IEventRepository {
    async createEvent(event: IEvent): Promise<EventDoc | null> {
        try {
            await connectToDb();
            return await eventsModel.create(event);
        } catch (e: any) {
            console.log(
                `eventRepository.createEvent event: ${event} error: `,
                e
            );
            return null;
        }
    }
    async getEvent(eventId: string): Promise<EventDoc | null> {
        try {
            await connectToDb();
            const eventIdIsValid = new Types.ObjectId(eventId);
            return await eventsModel.findById(eventIdIsValid);
        } catch (e: any) {
            console.log(
                `eventRepository.getEvent eventId: ${eventId} error: `,
                e
            );
            return null;
        }
    }

    async updateEntireEvent(
        event: IEvent,
        session?: ClientSession
    ): Promise<EventDoc | null> {
        try {
            await connectToDb();
            const { _id, ...updatedEvent } = event;
            return await eventsModel.findByIdAndUpdate(_id, updatedEvent, {
                returnDocument: "after",
                upsert: true,
                session,
            });
        } catch (e: any) {
            console.log(
                `EventRepository.updateEntireEvent event: ${event} error: `,
                e
            );
            return null;
        }
    }
}
