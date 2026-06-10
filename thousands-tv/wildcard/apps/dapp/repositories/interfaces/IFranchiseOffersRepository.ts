import { FranchiseOfferDoc } from "@repo/schemas";

export default interface IFranchiseOffersRepository {
    addFranchiseOffers(
        offers: Partial<FranchiseOfferDoc>[]
    ): Promise<FranchiseOfferDoc[]>;
    getFranchiseOffersForUserId(
        userId: string
    ): Promise<FranchiseOfferDoc[]>;
}
