import { INftAccess } from "@repo/interfaces";
import { NftAccessDoc } from "@repo/schemas";

export default interface INftAccessRepository {
    createNftAccess(
        nftAccess: INftAccess
    ): Promise<{ nftAccess: NftAccessDoc | null; error?: string }>;

    getNftAccess(id: string): Promise<NftAccessDoc | null>;

    getNftAccessByToken(
        chain: string,
        collectionAddress: string,
        tokenId: string
    ): Promise<NftAccessDoc | null>;

    getNftAccessByEvent(eventId: string): Promise<NftAccessDoc[] | null>;

    getNftAccessByUser(userId: string): Promise<NftAccessDoc[] | null>;

    hasNftBeenUsed(
        chain: string,
        collectionAddress: string,
        tokenId: string,
        eventId: string
    ): Promise<boolean>;

    countNftAccessByUser(userId: string): Promise<number>;

    countNftAccessByEvent(eventId: string): Promise<number>;
}