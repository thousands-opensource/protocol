import { updateOnePointsDB } from "@repo/schemas";
import { IStageIdleEvent } from "@repo/interfaces";
export default interface IIdleGameAction {
    getEventIdleEvents(eventId: string): Promise<IStageIdleEvent[] | null>;
}
