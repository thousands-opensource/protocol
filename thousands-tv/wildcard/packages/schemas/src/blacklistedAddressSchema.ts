import {
    Schema,
    model,
    Model,
    models,
    Document,
    FilterQuery,
    Types,
} from "mongoose";

export const BLACKLISTED_ADDRESSES = "blacklistedAddresses";
export const TIMESTAMPS = "timestamps";

export interface IBlacklistedAddress {
    address: string;
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
}

const blacklistedAddressSchema = new Schema<IBlacklistedAddress>({
    address: {
        type: String,
        required: true,
        unique: true,
    },
});

blacklistedAddressSchema.set(TIMESTAMPS, true);
blacklistedAddressSchema.index({ address: 1 });

export const blacklistedAddressesModel =
    (models[BLACKLISTED_ADDRESSES] as Model<IBlacklistedAddress, {}, {}, {}, any>) ||
    model<IBlacklistedAddress>(BLACKLISTED_ADDRESSES, blacklistedAddressSchema);

export type BlacklistedAddressDoc = Document<unknown, any, IBlacklistedAddress> &
    IBlacklistedAddress &
    Required<{ _id: Types.ObjectId }>;