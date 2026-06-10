import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { Types } from "mongoose";
import IBlacklistedAddressRepository from "@/repositories/interfaces/iBlacklistedAddressRepository";
import { BlacklistedAddressDoc, blacklistedAddressesModel, IBlacklistedAddress } from "@repo/schemas";

@injectable()
export default class BlacklistedAddressRepository implements IBlacklistedAddressRepository {
    async createBlacklistedAddress(address: string): Promise<BlacklistedAddressDoc | null> {
        try {
            await connectToDb();
            return await blacklistedAddressesModel.create({ address });
        } catch (e: any) {
            console.error(
                `BlacklistedAddressRepository.createBlacklistedAddress address: ${address} error: `,
                e
            );
            return null;
        }
    }

    async getBlacklistedAddress(address: string): Promise<BlacklistedAddressDoc | null> {
        try {
            await connectToDb();
            return await blacklistedAddressesModel.findOne({ address });
        } catch (e: any) {
            console.error(
                `BlacklistedAddressRepository.getBlacklistedAddress address: ${address} error: `,
                e
            );
            return null;
        }
    }

    async removeBlacklistedAddress(address: string): Promise<boolean> {
        try {
            await connectToDb();
            await blacklistedAddressesModel
                .findOneAndDelete<BlacklistedAddressDoc>({ address })
                .exec();

                return true
        } catch (e: any) {
            console.error(
                `BlacklistedAddressRepository.removeBlacklistedAddress address: ${address} error: `,
                e
            );
            return false;
        }
    }

    async getAllBlacklistedAddresses(): Promise<BlacklistedAddressDoc[]> {
        try {
            await connectToDb();
            return await blacklistedAddressesModel.find().sort({ createdAt: -1 });
        } catch (e: any) {
            console.error(
                `BlacklistedAddressRepository.getAllBlacklistedAddresses error: `,
                e
            );
            return [];
        }
    }

    async isBlacklisted(addresses: string[]): Promise<boolean> {
        try {
            await connectToDb();
            const matchingAddress = await blacklistedAddressesModel.findOne({
                address: { $in: addresses }
            });
            return !!matchingAddress;
        } catch (e: any) {
            console.error(
                `BlacklistedAddressRepository.isBlacklisted addresses: ${addresses} error: `,
                e
            );
            // Return true on error to be safe
            return true;
        }
    }
}