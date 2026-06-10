import { IAccessCode, ITicketQueue, TicketTierType } from "@repo/interfaces";
import { ClientSession } from "mongoose";

export interface ITicketQueueRepository {
    createOrUpdateTicketQueue(
        userId: string,
        seriesId: string,
        queuePoints: number
    ): Promise<ITicketQueue | null>;

    getTicketQueue(
        userId: string,
        seriesId: string
    ): Promise<ITicketQueue | null>;

    getTopQueuedUsers(seriesId: string, limit: number): Promise<ITicketQueue[]>;

    removeFromQueue(userId: string, seriesId: string): Promise<boolean>;

    updateQueuePoints(
        userId: string,
        seriesId: string,
        pointsToAdd: number
    ): Promise<ITicketQueue | null>;

    awardVouchersToEligibleUsers(
        seriesId: string,
        maxQuantity: number,
        tier: TicketTierType
    ): Promise<ITicketQueue[] | null>;

    createVoucherAccessCode(
        seriesId: string,
        maxQuantity: number,
        tier: TicketTierType,
        eligibleUsers: string[],
        session: ClientSession | null
    ): Promise<IAccessCode | null>;
}
