import { IBoostsSegment, IUserEventBoostSummary } from "@repo/interfaces";

export default interface IBoostRepository {
    getBoosts(stageId: string, segment: number): Promise<IBoostsSegment | null>;

    getBoostsSegments(stageId: string): Promise<IBoostsSegment[] | null>;

    createBoostsSegment(
        stageId: string,
        vendorEventId: string,
        segment: number,
        boostsCount: number,
        userPool: string[]
    ): Promise<IBoostsSegment>;

    getUserBoostSegmentSummaryByEvent(userId: string): Promise<IUserEventBoostSummary[]>;
}
