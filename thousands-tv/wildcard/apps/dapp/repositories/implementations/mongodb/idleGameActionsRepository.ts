import { findManyEventIdleEventsByQuery } from "@repo/schemas";
import IIdleGameActionsRepository from "@/repositories/interfaces/iIdleGameActionsRepository";
import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { IStageIdleEvent } from "@repo/interfaces";

@injectable()
export default class IdleGameActionsRepository
    implements IIdleGameActionsRepository
{
    async getEventIdleEvents(
        eventId: string
    ): Promise<IStageIdleEvent[] | null> {
        await connectToDb();

        return await findManyEventIdleEventsByQuery({ eventId }, {});
    }
}
