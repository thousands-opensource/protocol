import { IClaimedTicket } from "@repo/interfaces";
import { ClaimedTicketDoc } from "@repo/schemas";

export default interface IClaimedTicketRepository {
    createClaimedTicket(
        claimedTicket: IClaimedTicket
    ): Promise<{ claimedTicket: ClaimedTicketDoc | null; error?: string }>;

    getClaimedTickets(): Promise<ClaimedTicketDoc[] | null>;

    getClaimedTicket(ticketId: string): Promise<ClaimedTicketDoc | null>;

    updateClaimedTicket(
        ticketId: string,
        updateParams: Partial<IClaimedTicket>
    ): Promise<ClaimedTicketDoc | null>;

    getClaimedTicketByUserAndEvent(
        userId: string,
        eventId: string
    ): Promise<ClaimedTicketDoc | null>;

    countClaimedTicketsByEvent(eventId: string): Promise<number>;

    getClaimedTicketsByStage(
        stageId: string
    ): Promise<ClaimedTicketDoc[] | null>;
}
