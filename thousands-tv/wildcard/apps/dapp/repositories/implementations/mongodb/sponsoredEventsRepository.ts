import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { ISponsoredEvent } from "@repo/interfaces";
import { SponsoredEventDoc, sponsoredEventModel } from "@repo/schemas";
import { Types } from "mongoose";
import ISponsoredEventRepository from "@/repositories/interfaces/ISponsoredEventRepository";

@injectable()
export default class sponsoredEventsRepository
    implements ISponsoredEventRepository
{
    async addSponsoredEvent(
        sponsoredEvent: ISponsoredEvent
    ): Promise<SponsoredEventDoc | null> {
        try {
            await connectToDb();
            return await sponsoredEventModel.create(sponsoredEvent);
        } catch (error) {
            console.error(
                "sponsoredEventsRepository.addSponsoredEvent error:",
                error
            );
            return null;
        }
    }

    async editSponsoredEvent(
        sponsoredEventId: string,
        updates: Partial<ISponsoredEvent>
    ): Promise<SponsoredEventDoc | null> {
        try {
            await connectToDb();
            const sponsoredEventObjectId = new Types.ObjectId(
                sponsoredEventId
            );
            return await sponsoredEventModel.findByIdAndUpdate(
                sponsoredEventObjectId,
                updates,
                {
                    returnDocument: "after",
                }
            );
        } catch (error) {
            console.error(
                "sponsoredEventsRepository.editSponsoredEvent error:",
                error
            );
            return null;
        }
    }

    async getSponsoredEvent(
        sponsoredEventId: string
    ): Promise<SponsoredEventDoc | null> {
        try {
            await connectToDb();
            const sponsoredEventObjectId = new Types.ObjectId(
                sponsoredEventId
            );
            return await sponsoredEventModel.findById(sponsoredEventObjectId);
        } catch (error) {
            console.error(
                "sponsoredEventsRepository.getSponsoredEvent error:",
                error
            );
            return null;
        }
    }

    async getSponsoredEvents(): Promise<SponsoredEventDoc[]> {
        try {
            await connectToDb();
            return await sponsoredEventModel.find({}).exec();
        } catch (error) {
            console.error(
                "sponsoredEventsRepository.getSponsoredEvents error:",
                error
            );
            return [];
        }
    }
}
