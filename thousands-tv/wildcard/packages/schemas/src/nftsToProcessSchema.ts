import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
} from "mongoose";
import {
    INftsToProcess,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    NFTS_TO_PROCESS_COLLECTION,
    TIMESTAMPS,
} from "@repo/interfaces";

const nftsToProcessSchema = new Schema<INftsToProcess>({
    chainId: MONGO_REQUIRED_STRING,
    nftName: MONGO_REQUIRED_STRING,
    address: MONGO_REQUIRED_STRING,
    tokenId: MONGO_REQUIRED_STRING,
    scanMethod: MONGO_REQUIRED_STRING,
    startingBlockNumber: MONGO_REQUIRED_NUMBER,
    active: { type: Boolean, default: true },
    expectedTokenCount: MONGO_REQUIRED_NUMBER
  },
  {
    collection: NFTS_TO_PROCESS_COLLECTION, // 👈 explicit collection name
  }
);

nftsToProcessSchema.set(TIMESTAMPS, true);

export const nftsToProcessModel =
    (models[NFTS_TO_PROCESS_COLLECTION] as Model<
        INftsToProcess,
        {},
        {},
        {},
        any
    >) || model<INftsToProcess>(NFTS_TO_PROCESS_COLLECTION, nftsToProcessSchema);

export type NftsToProcessDoc = Document<unknown, any, INftsToProcess> &
    INftsToProcess &
    Required<{ _id: Types.ObjectId }>;
