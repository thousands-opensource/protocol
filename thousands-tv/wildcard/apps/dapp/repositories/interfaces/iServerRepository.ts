import { ServerDoc } from "@repo/schemas";
import { IEvent, ISeries, IServer, IStage } from "@repo/interfaces";
import { ClientSession, Types, UpdateWriteOpResult } from "mongoose";

export default interface IServerRepository {
    getServer(serverId: string): Promise<ServerDoc | null>;

    getServerFromCode(serverCode: string): Promise<ServerDoc | null>;

    addEvent(serverId: string, event: IEvent): Promise<boolean>;

    addStage(serverId: string, stage: IStage): Promise<boolean>;

    addSeries(
        serverId: string,
        series: ISeries,
        session?: ClientSession
    ): Promise<boolean>;

    updateServerSeries(
        serverId: string | Types.ObjectId,
        seriesId: string | Types.ObjectId,
        updates: ISeries, // updates to make to the series
        session?: ClientSession
    ): Promise<UpdateWriteOpResult>;

    updateServerEvent(
        serverId: string | Types.ObjectId,
        eventId: string | Types.ObjectId,
        updates: IEvent, // updates to make to the event
        session?: ClientSession
    ): Promise<UpdateWriteOpResult>;

    updateServerStage(
        serverId: string | Types.ObjectId,
        stageId: string | Types.ObjectId,
        updates: IStage, // updates to make to the stage
        session?: ClientSession
    ): Promise<UpdateWriteOpResult>;
}
