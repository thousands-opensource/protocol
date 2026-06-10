import { injectable } from "inversify";
import INftsToProcessRepository from "@/repositories/interfaces/INftsToProcess";
import connectToDb from "@/db/connectToDb";
import { INftsToProcess } from "@repo/interfaces";
import { nftsToProcessModel } from "@repo/schemas";

@injectable()
export default class NftsToProcessRepository
    implements INftsToProcessRepository
{
    async getActiveNFTsToProcess(): Promise<INftsToProcess[]> {
        try {
            await connectToDb();
            return await nftsToProcessModel
                .find({ active: { $ne: false } })
                .exec();
        } catch (error) {
            console.error("Failed to fetch NFTs to process:", error);
            return [];
        }
    }
}
