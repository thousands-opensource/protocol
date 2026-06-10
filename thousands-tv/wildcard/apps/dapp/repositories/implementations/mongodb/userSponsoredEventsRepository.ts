import { injectable } from "inversify";
import { Types } from "mongoose";
import IUserSponsoredEventRepository from "@/repositories/interfaces/IUserSponsoredEventRepository";
import {
    userSponsoredEventModel,
    UserSponsoredEventDoc,
} from "@repo/schemas";
import connectToDb from "@/db/connectToDb";

@injectable()
export default class UserSponsoredEventsRepository
    implements IUserSponsoredEventRepository
{
    async addUserSponsoredEvent(
        userSponsoredEvent: Partial<UserSponsoredEventDoc>
    ): Promise<UserSponsoredEventDoc | null> {
        await connectToDb();
        try {
            const doc = new userSponsoredEventModel(userSponsoredEvent);
            return await doc.save();
        } catch (error) {
            console.error("Failed to create user sponsored event", error);
            return null;
        }
    }

    async getSponsoredEventsForUserId(
        userId: string
    ): Promise<UserSponsoredEventDoc[]> {
        await connectToDb();
        const normalizedUserId = new Types.ObjectId(userId);
        return (await userSponsoredEventModel
            .find({ userId: normalizedUserId })
            .populate("sponsoredEventId")
            .sort({ createdAt: -1 })
            .exec()) as UserSponsoredEventDoc[];
    }

    async getSponsoredEventsByUserId(
        userId: string
    ): Promise<UserSponsoredEventDoc[]> {
        return this.getSponsoredEventsForUserId(userId);
    }
}
