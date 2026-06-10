import { Types } from "mongoose";
export enum EventPointTypeEnum {
    LINK_TWITTER = "linkTwitter",
    FOLLOW_WILDCARD = "followWildcard",
}
export type EventPointType =
    | EventPointTypeEnum.LINK_TWITTER
    | EventPointTypeEnum.FOLLOW_WILDCARD;

export const defaultEventPointsDefinition = {
    linkTwitter: 40,
    followWildcard: 50,
};

export const POINTS = "points";
export interface IPoints {
    userId: string;
    nftPoints: NftPoints[];
    eventPoints: EventPoints[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface EventPoints {
    points: number;
    eventId: string;
    organizationId?: number;
}

export interface NftPoints {
    address: string;
    points: number;
    blockNumber: number;
}

export interface Point {
    label: string;
    point: number;
}
