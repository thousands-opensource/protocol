import {
    AccountProviderType,
    IExternalStream,
    MONGO_REQUIRED_DATE,
    TIMESTAMPS,
    USERS,
} from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
} from "mongoose";

const EXTERNAL_STREAMS_NAME = "external-streams";

// mongo schema
const externalStreamSchema = new Schema<IExternalStream>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    platformId: { type: String, enum: AccountProviderType, required: true },
    platformUserName: { type: String },
    startDate: MONGO_REQUIRED_DATE,
    endDate: { type: Date },
    amountEarned: { type: Number },
});

externalStreamSchema.set(TIMESTAMPS, true);

const externalStreamModel =
    (models[EXTERNAL_STREAMS_NAME] as Model<
        IExternalStream,
        {},
        {},
        {},
        any
    >) || model<IExternalStream>(EXTERNAL_STREAMS_NAME, externalStreamSchema);

export type ExternalStreamDoc = Document<unknown, any, IExternalStream> &
    IExternalStream &
    Required<{ _id: Types.ObjectId }>;

export async function fetchExternalStreams(
    query: FilterQuery<IExternalStream>
): Promise<IExternalStream[]> {
    return await externalStreamModel.find(query).sort({ _id: 1 });
}
