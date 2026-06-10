import { injectable } from "inversify";
import {
    AccessCodeIntent,
    AccessCodeType,
    IAccessCode,
    ITicketQueue,
    TicketTierType,
} from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import { ClientSession, Types } from "mongoose";
import { accessCodeModel, ticketQueueModel } from "@repo/schemas";
import { ITicketQueueRepository } from "@/repositories/interfaces/iTicketQueueRepository";
import { v4 as uuidv4 } from "uuid";

@injectable()
export class TicketQueueRepository implements ITicketQueueRepository {
    async createOrUpdateTicketQueue(
        userId: string,
        seriesId: string,
        queuePoints: number
    ): Promise<ITicketQueue | null> {
        const filter = {
            userId: new Types.ObjectId(userId),
            seriesId: new Types.ObjectId(seriesId),
        };
        const update = {
            $setOnInsert: { createdAt: new Date() },
            $set: { queuePoints, updatedAt: new Date() },
        };
        const options = { upsert: true, new: true };

        return await ticketQueueModel.findOneAndUpdate(filter, update, options);
    }

    async getTicketQueue(
        userId: string,
        seriesId: string
    ): Promise<ITicketQueue | null> {
        return await ticketQueueModel.findOne({
            userId: new Types.ObjectId(userId),
            seriesId: new Types.ObjectId(seriesId),
        });
    }

    async getTopQueuedUsers(
        seriesId: string,
        limit: number
    ): Promise<ITicketQueue[]> {
        return await ticketQueueModel
            .find({
                seriesId: new Types.ObjectId(seriesId),
            })
            .sort({ queuePoints: -1 })
            .limit(limit);
    }

    async removeFromQueue(userId: string, seriesId: string): Promise<boolean> {
        const result = await ticketQueueModel.deleteOne({
            userId: new Types.ObjectId(userId),
            seriesId: new Types.ObjectId(seriesId),
        });
        return result.deletedCount > 0;
    }

    async updateQueuePoints(
        userId: string,
        seriesId: string,
        pointsToAdd: number
    ): Promise<ITicketQueue | null> {
        return await ticketQueueModel.findOneAndUpdate(
            {
                userId: new Types.ObjectId(userId),
                seriesId: new Types.ObjectId(seriesId),
            },
            { $inc: { queuePoints: pointsToAdd }, updatedAt: new Date() },
            { new: true }
        );
    }

    async awardVouchersToEligibleUsers(
        seriesId: string,
        numberOfVouchersToAward: number,
        tier: TicketTierType
    ): Promise<ITicketQueue[] | null> {
        let session: ClientSession | null = null;
        try {
            await connectToDb();
            session = await ticketQueueModel.startSession();

            const result = await session.withTransaction(async () => {
                // Get top users by queue points and updatedAt (ascending)
                const topUsers = await ticketQueueModel
                    .find({
                        seriesId: new Types.ObjectId(seriesId),
                    })
                    .sort({ queuePoints: -1, updatedAt: 1 })
                    .limit(numberOfVouchersToAward)
                    .session(session);

                if (topUsers.length === 0) {
                    console.log("No eligible users found for vouchers");
                    return null;
                }

                const eligibleUserIds = topUsers.map((user) =>
                    user.userId.toString()
                );

                // Create a new voucher access code
                const voucherCode = await this.createVoucherAccessCode(
                    seriesId,
                    topUsers.length,
                    tier,
                    eligibleUserIds,
                    session
                );

                if (!voucherCode) {
                    throw new Error("Failed to create voucher access code");
                }

                // Update each user's ticket queue entry: reset points to 0 and update timestamp
                const updatedUsers = await Promise.all(
                    topUsers.map((user) =>
                        ticketQueueModel.findByIdAndUpdate(
                            user._id,
                            {
                                $set: {
                                    queuePoints: 0,
                                    updatedAt: new Date(),
                                },
                            },
                            { session, new: true }
                        )
                    )
                );

                console.log(
                    `Awarded vouchers to ${updatedUsers.length} users for season ${seriesId}`
                );

                return updatedUsers.filter(
                    (user): user is ITicketQueue => user !== null
                );
            });

            return result as ITicketQueue[] | null;
        } catch (error) {
            console.error("Error awarding vouchers to eligible users:", error);
            throw error;
        } finally {
            if (session) {
                await session.endSession();
            }
        }
    }

    async createVoucherAccessCode(
        seriesId: string,
        maxQuantity: number,
        tier: TicketTierType,
        eligibleUsers: string[],
        session: ClientSession | null
    ): Promise<IAccessCode | null> {
        const newVoucher: IAccessCode = {
            organizationId: null,
            accessCode: this.generateAccessCode(),
            isClaimed: false,
            claimedUsers: eligibleUsers.map((userId) => ({
                claimedBy: new Types.ObjectId(userId),
            })),
            seriesId: new Types.ObjectId(seriesId),
            codeType: AccessCodeType.VOUCHER,
            maxQuantity,
            tier,
            intent: AccessCodeIntent.TICKET,
        };

        const createdVoucher = await accessCodeModel.create([newVoucher], {
            session,
        });

        if (!createdVoucher || createdVoucher.length === 0) {
            throw new Error("Failed to create voucher access code");
        }

        console.log(`Voucher access code created for season ${seriesId}`);
        return createdVoucher[0];
    }

    /**
     * Generates a new unique access code using UUID v4.
     * @returns - a new unique access code.
     */
    private generateAccessCode = (): string => {
        return uuidv4();
    };
}
