export enum EffectType {
    AudienceBillboard,
    Competitor,
    Lighting,
    OneOff,
    Banner,
    Persistent
}

export enum BacklogEventType {
    ChannelEntrance,
    ChannelExit,
    IndividualFanReaction,
    FanfareEffect
}

export type FanfareEffect = {
    type: string,
    name: string,
    value: string,
    sectionId: number,
    sectionName: string,
    magnitude: number,
    delay: number,
    duration: number,
    notify: boolean
};

export type BackLogEvent = {
    type: string,
    payload: string
}

export default interface IFanVisibilityService {
    sendFanVisibilityEvent(vendorEventId: string, eventType: string, fanfareEffect: FanfareEffect): Promise<Boolean>;
}