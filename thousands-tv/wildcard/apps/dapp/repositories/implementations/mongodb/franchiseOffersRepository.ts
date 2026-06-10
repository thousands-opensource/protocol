import { injectable } from "inversify";
import IFranchiseOffersRepository from "@/repositories/interfaces/IFranchiseOffersRepository";
import { FranchiseOfferDoc, franchiseOffersModel } from "@repo/schemas";
import connectToDb from "@/db/connectToDb";

@injectable()
export default class FranchiseOffersRepository
    implements IFranchiseOffersRepository
{
    async addFranchiseOffers(
        offers: Partial<FranchiseOfferDoc>[]
    ): Promise<FranchiseOfferDoc[]> {
        await connectToDb();
        if (!offers.length) {
            return [];
        }
        const docs = await franchiseOffersModel.insertMany(offers);
        return docs as FranchiseOfferDoc[];
    }

    async getFranchiseOffersForUserId(
        userId: string
    ): Promise<FranchiseOfferDoc[]> {
        await connectToDb();
        if (!userId) {
            return [];
        }
        const docs = await franchiseOffersModel
            .find({ userId })
            .sort({ createdAt: -1 });
        return docs as FranchiseOfferDoc[];
    }
}
