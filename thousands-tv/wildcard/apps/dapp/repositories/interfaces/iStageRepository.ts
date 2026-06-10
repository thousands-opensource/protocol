import { StageDoc } from "@repo/schemas";
import { IStage, EventCreationContent } from "@repo/interfaces";
import { ClientSession } from "mongoose";

export type EventWithValidation = {
    event: StageDoc | null;
    validationMessage: string;
};

export type StageFields = {
    streamName: string;
    durationMinutes: number;
    startDateStr: string;
    startDate: Date;
    endDate: Date;
    serverCode: string;
    imageUrl: string;
    imageUrlToSave: string;
    streamDescription: string;
    seriesId: string;
    currentSegment: number;
    gameMode: string;
    numberOfSkyboxes: number;
};

export default interface IStageRepository {
    createStage(stage: IStage): Promise<StageDoc | null>;

    getEventsForSeason(seriesId: string): Promise<StageDoc[]>;

    getStage(stageId: string): Promise<StageDoc | null>;

    getStageFieldsFromEventCreationContent(
        content: EventCreationContent
    ): StageFields;

    getEventFromVendorEventId(vendorEventId: string): Promise<StageDoc | null>;

    getStagesFromServerId(
        serverId: string,
        sort?: Record<string, 1 | -1>
    ): Promise<StageDoc[]>;

    updateEvent(
        beamableEventId: string,
        userId: string
    ): Promise<EventWithValidation>;

    updateEventSetStatus(
        eventId: string,
        status: string
    ): Promise<EventWithValidation | null>;

    updateEventSetVendorEventId(
        eventId: string,
        vendorEventId: string
    ): Promise<EventWithValidation | null>;

    updateEntireStage(
        stage: IStage,
        session?: ClientSession
    ): Promise<EventWithValidation | null>;

    getStageByBeamableEventId(
        beamableEventId: string
    ): Promise<StageDoc | null>;

    updateEventIncrementCurrentSegement(
        stageId: string
    ): Promise<StageDoc | null>;
}
