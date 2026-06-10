import { Types } from "mongoose";
import { IProtocolPayout } from "@repo/interfaces";
import { ProtocolPayoutModel, insertProtocolPayout, findProtocolPayoutsByUserId } from "@repo/schemas";

class ProtocolPayoutRepository {
    async createPayout(payout: Partial<IProtocolPayout>): Promise<IProtocolPayout> {
        return await insertProtocolPayout(payout);
    }

    async findByUserId(userId: Types.ObjectId): Promise<IProtocolPayout[]> {
        return await findProtocolPayoutsByUserId(userId);
    }
}

export default new ProtocolPayoutRepository();
