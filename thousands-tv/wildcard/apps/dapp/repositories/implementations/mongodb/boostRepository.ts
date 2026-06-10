import connectToDb from "@/db/connectToDb";
import { generateBoostsSegment } from "@/pages/api/pledgeAI/tests/chatBoosts";
import IBoostRepository from "@/repositories/interfaces/iBoostRepository";
import { IBoostsSegment, IUserEventBoostSummary } from "@repo/interfaces";
import { boostsSegmentsModel } from "@repo/schemas";
import { injectable } from "inversify";

@injectable()
export default class BoostRepository implements IBoostRepository {
    async getBoosts(
        stageId: string,
        segment: number
    ): Promise<IBoostsSegment | null> {
        try {
            await connectToDb();
            return await boostsSegmentsModel.findOne({
                stageId,
                segment,
            });
        } catch (e: any) {
            console.error(
                "BoostRepository.getBoost - Failed to fetch boost segment",
                e
            );
            return null;
        }
    }

    async getBoostsSegments(
        stageId: string
    ): Promise<IBoostsSegment[] | null> {
        try {
            await connectToDb();
            return await boostsSegmentsModel.find({
                stageId,
            });
        } catch (e: any) {
            console.error(
                "BoostRepository.getBoostsSegments - Failed to fetch boost segments",
                e
            );
            return null;
        }
    }

    async createBoostsSegment(
        stageId: string,
        vendorEventId: string,
        segment: number,
        boostsCount: number = 500,
        userPool: string[]
    ): Promise<IBoostsSegment> {
        try {
            await connectToDb();

            const boostSegment = generateBoostsSegment(boostsCount, segment, {
                stageId,
                vendorEventId,
                userPool,
            });
            const createdSegment = await boostsSegmentsModel.create(
                boostSegment
            );
            return createdSegment;
        } catch (e: any) {
            console.error(
                "BoostRepository.createBoostsSegment - Failed to create boost segment",
                e
            );
            throw new Error(e.message);
        }
    }

        async getUserBoostSegmentSummaryByEvent(userId: string): Promise<IUserEventBoostSummary[]> {
        try {
            await connectToDb();
            const result = await boostsSegmentsModel.aggregate([
                { $unwind: "$boosts" },
                {
                    $match: {
                        "boosts.userId": userId,
                        "boosts.boostPrice": { $exists: true, $ne: null },
                    }
                },
                {
                    $addFields: {
                        stageObjectId: { $toObjectId: "$stageId" }
                    }
                },
                {
                    $lookup: {
                        from: "stages",
                        localField: "stageObjectId",
                        foreignField: "_id",
                        as: "stageInfo"
                    }
                },
                { $unwind: "$stageInfo" },
                {
                    $addFields: {
                        "stageInfo.eventObjectId": { $toObjectId: "$stageInfo.eventId" }
                    }
                },
                {
                    $lookup: {
                        from: "events",
                        localField: "stageInfo.eventObjectId",
                        foreignField: "_id",
                        as: "eventInfo"
                    }
                },
                { $unwind: "$eventInfo" },
                {
                    $group: {
                        _id: {
                            eventName: "$eventInfo.eventName",
                            round: "$segment"
                        },
                        creditsSpent: { $sum: "$boosts.boostPrice" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.eventName",
                        rounds: {
                            $push: {
                                round: "$_id.round",
                                creditsSpent: "$creditsSpent"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        eventName: "$_id",
                        rounds: 1
                    }
                }
            ]);
    
            return result;
        } catch (e: any) {
            console.error(
                "BoostRepository.getUserBoostSegmentSummary - Failed to fetch boost segments",
                e
            );
            throw new Error(e.message);
        }
    }
  
}
