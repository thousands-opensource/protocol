import { Boost, IBoostsSegment } from "@repo/interfaces";
import { getRandomObjectId } from "../util/util";
import IBoostRepository from "@/repositories/interfaces/iBoostRepository";

/**
 * Generate an array of random boost objects.
 *
 * @param count - Number of boost objects to generate.
 * @param options - Optional configuration:
 *   - stageId: string (defaults to a random ObjectId)
 *   - vendorEventId: string (defaults to a fixed string)
 *   - userPool: string[] (an array of user IDs; if empty, new IDs are generated)
 *
 * @returns An array of Boost objects.
 */
export function generateRandomBoosts(
    count: number,
    options?: {
        stageId?: string;
        vendorEventId?: string;
        userPool?: string[];
    }
): Boost[] {
    const {
        stageId = getRandomObjectId(),
        vendorEventId = "events.WildcardPlaytest.1738356060000",
        userPool = [],
    } = options || {};

    const boosts: Boost[] = [];

    for (let i = 0; i < count; i++) {
        const userId =
            userPool.length > 0
                ? userPool[Math.floor(Math.random() * userPool.length)]
                : getRandomObjectId();

        // Generate a random boost amount (between 0 and 10).
        const boostAmount = Math.floor(Math.random() * 11);
        const boostPrice = Math.floor(Math.random() * 100);

        boosts.push({
            stageId,
            vendorEventId,
            userId,
            boostType: "ChatBoost",
            boostAmount,
            boostPrice,
            transactionId: getRandomObjectId(),
            identityId: getRandomObjectId(),
            timestamp: new Date(),
        });
    }
    return boosts;
}

/**
 * Generate a full boosts segment.
 *
 * @param count - Number of boost objects to generate.
 * @param segment - The segment number.
 * @param options - Additional options passed to generateRandomBoosts.
 * @returns An IBoostsSegment object.
 */
export function generateBoostsSegment(
    count: number,
    segment: number,
    options?: {
        stageId?: string;
        vendorEventId?: string;
        userPool?: string[];
    }
): IBoostsSegment {
    return {
        stageId: options?.stageId || getRandomObjectId(),
        segment,
        boosts: generateRandomBoosts(count, options),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Create a boost segment - write to the DB.
 */
export async function testCreateBoostsSegment(
    boostRepository: IBoostRepository,
    stageId: string,
    vendorEventId: string,
    segment: number,
    userPool: string[]
) {
    try {
        const boostAmount = 500;
        const createdSegment = await boostRepository.createBoostsSegment(
            stageId,
            vendorEventId,
            segment,
            boostAmount,
            userPool
        );
        console.log("Created boost segment:", createdSegment);
    } catch (error) {
        console.error("Error creating boost segment:", error);
    }
}
