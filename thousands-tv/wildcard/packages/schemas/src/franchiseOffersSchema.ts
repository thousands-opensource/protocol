import {
    FRANCHISE_OFFERS_TABLE_NAME,
    IFranchiseOffer,
    MONGO_REQUIRED_NUMBER,
    TIMESTAMPS,
    USERS,
} from "@repo/interfaces";
import { Document, Schema, model, Model, models, Types } from "mongoose";

const franchiseOffersSchema = new Schema<IFranchiseOffer>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    epoch: MONGO_REQUIRED_NUMBER,
    offerAmount: MONGO_REQUIRED_NUMBER,
});

franchiseOffersSchema.set(TIMESTAMPS, true);

export const franchiseOffersModel =
    (models[FRANCHISE_OFFERS_TABLE_NAME] as Model<
        IFranchiseOffer,
        {},
        {},
        {},
        any
    >) ||
    model<IFranchiseOffer>(
        FRANCHISE_OFFERS_TABLE_NAME,
        franchiseOffersSchema
    );

export type FranchiseOfferDoc = Document<
    unknown,
    any,
    IFranchiseOffer
> &
    IFranchiseOffer &
    Required<{ _id: Types.ObjectId }>;
