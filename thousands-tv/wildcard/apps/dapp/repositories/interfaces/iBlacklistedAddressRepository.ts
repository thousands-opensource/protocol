import { BlacklistedAddressDoc, IBlacklistedAddress } from "@repo/schemas";

export default interface IBlacklistedAddressRepository {
    createBlacklistedAddress(address: string): Promise<BlacklistedAddressDoc | null>;

    getBlacklistedAddress(address: string): Promise<BlacklistedAddressDoc | null>;

    removeBlacklistedAddress(address: string): Promise<boolean>;

    getAllBlacklistedAddresses(): Promise<BlacklistedAddressDoc[]>;

    isBlacklisted(addresses: string[]): Promise<boolean>;
}