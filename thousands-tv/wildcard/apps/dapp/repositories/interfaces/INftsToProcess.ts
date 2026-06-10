import { INftsToProcess } from "@repo/interfaces";

export default interface INftsToProcessRepository {
    getActiveNFTsToProcess(): Promise<INftsToProcess[]>;
}
