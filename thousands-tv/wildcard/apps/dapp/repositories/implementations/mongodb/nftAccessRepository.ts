import { injectable } from "inversify";
import { Types } from "mongoose";
import connectToDb from "@/db/connectToDb";
import { INftAccess, MONGO_DB_DUPLICATE_KEY_CODE } from "@repo/interfaces";
import { NftAccessDoc, nftAccessModel } from "@repo/schemas";
import INftAccessRepository from "@/repositories/interfaces/iNftAccessRepository";

@injectable()
export default class NftAccessRepository implements INftAccessRepository {
    async createNftAccess(
        nftAccess: INftAccess
    ): Promise<{ nftAccess: NftAccessDoc | null; error?: string }> {
        try {
            await connectToDb();
            const createdNftAccess = await nftAccessModel.create(nftAccess);
            return { nftAccess: createdNftAccess };
        } catch (e: any) {
            if (e.code === MONGO_DB_DUPLICATE_KEY_CODE) { 
                return { 
                    nftAccess: null, 
                    error: "This NFT has already been used for this event" 
                };
            }
            console.error("NftAccessRepository.createNftAccess error:", e);
            return { nftAccess: null, error: e.message };
        }
    }

    async getNftAccess(id: string): Promise<NftAccessDoc | null> {
        try {
            await connectToDb();
            return await nftAccessModel.findById(new Types.ObjectId(id));
        } catch (e: any) {
            console.error(`NftAccessRepository.getNftAccess id: ${id} error:`, e);
            return null;
        }
    }

    async getNftAccessByToken(
        chain: string,
        collectionAddress: string,
        tokenId: string
    ): Promise<NftAccessDoc | null> {
        try {
            await connectToDb();
            return await nftAccessModel.findOne({
                chain,
                collectionAddress: collectionAddress.toLowerCase(),
                tokenId
            });
        } catch (e: any) {
            console.error(
                `NftAccessRepository.getNftAccessByToken chain: ${chain}, collection: ${collectionAddress}, tokenId: ${tokenId} error:`,
                e
            );
            return null;
        }
    }

    async getNftAccessByEvent(eventId: string): Promise<NftAccessDoc[] | null> {
        try {
            await connectToDb();
            return await nftAccessModel.find({ eventId });
        } catch (e: any) {
            console.error(`NftAccessRepository.getNftAccessByEvent eventId: ${eventId} error:`, e);
            return null;
        }
    }

    async getNftAccessByUser(userId: string): Promise<NftAccessDoc[] | null> {
        try {
            await connectToDb();
            return await nftAccessModel.find({
                userId: new Types.ObjectId(userId)
            });
        } catch (e: any) {
            console.error(`NftAccessRepository.getNftAccessByUser userId: ${userId} error:`, e);
            return null;
        }
    }

    async hasNftBeenUsed(
        chain: string,
        collectionAddress: string,
        tokenId: string,
        eventId: string
    ): Promise<boolean> {
        try {
            await connectToDb();
            const exists = await nftAccessModel.exists({
                chain,
                collectionAddress,
                tokenId,
                eventId
            });
            return !!exists;
        } catch (e: any) {
            console.error(
                `NftAccessRepository.hasNftBeenUsed chain: ${chain}, collection: ${collectionAddress}, tokenId: ${tokenId}, eventId: ${eventId} error:`,
                e
            );
            return false;
        }
    }

    async countNftAccessByUser(userId: string): Promise<number> {
        try {
            await connectToDb();
            return await nftAccessModel.countDocuments({
                userId: new Types.ObjectId(userId)
            });
        } catch (e: any) {
            console.error(`NftAccessRepository.countNftAccessByUser userId: ${userId} error:`, e);
            return 0;
        }
    }

    async countNftAccessByEvent(eventId: string): Promise<number> {
        try {
            await connectToDb();
            return await nftAccessModel.countDocuments({ eventId });
        } catch (e: any) {
            console.error(`NftAccessRepository.countNftAccessByEvent eventId: ${eventId} error:`, e);
            return 0;
        }
    }
}