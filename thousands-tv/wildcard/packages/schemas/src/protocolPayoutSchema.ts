import {
    Schema,
    model,
    Model,
    models,
    Types,
} from "mongoose";
import {
    IProtocolPayout,
    MONGO_REQUIRED_STRING,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_BOOLEAN,
    TIMESTAMPS,
} from "@repo/interfaces";

export const PROTOCOL_PAYOUT_TABLE_NAME = "protocol-payouts";

const protocolPayoutSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    twitchChannelName: MONGO_REQUIRED_STRING,
    hoursWatched: MONGO_REQUIRED_NUMBER,
    payoutAmount: MONGO_REQUIRED_NUMBER,
    transactionHash: {
        type: String,
        required: false
    },
    distributionId: {
        type: String,
        required: false
    },
    valueUSDC: MONGO_REQUIRED_NUMBER,
    type: MONGO_REQUIRED_STRING,
    isPaid: MONGO_REQUIRED_BOOLEAN,
});

protocolPayoutSchema.set(TIMESTAMPS, true);

protocolPayoutSchema.index({ userId: 1 });
protocolPayoutSchema.index({ twitchChannelName: 1 });

export const ProtocolPayoutModel: Model<IProtocolPayout> =
    models[PROTOCOL_PAYOUT_TABLE_NAME] ||
    model<IProtocolPayout>(PROTOCOL_PAYOUT_TABLE_NAME, protocolPayoutSchema);

export async function insertProtocolPayout(
    payout: Partial<IProtocolPayout>
) {
    return await ProtocolPayoutModel.create(payout);
}

export async function findProtocolPayoutsByUserId(
    userId: Types.ObjectId
) {
    return await ProtocolPayoutModel.find({ userId });
}
