import { ISponsoredEvent } from "@repo/interfaces";
import { SponsoredEventDoc } from "@repo/schemas";

export default interface ISponsoredEventRepository {
    addSponsoredEvent(
        sponsoredEvent: ISponsoredEvent
    ): Promise<SponsoredEventDoc | null>;

    editSponsoredEvent(
        sponsoredEventId: string,
        updates: Partial<ISponsoredEvent>
    ): Promise<SponsoredEventDoc | null>;

    getSponsoredEvent(
        sponsoredEventId: string
    ): Promise<SponsoredEventDoc | null>;

    getSponsoredEvents(): Promise<SponsoredEventDoc[]>;
}
