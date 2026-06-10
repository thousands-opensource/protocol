import { IStream } from "@repo/interfaces";
import { StreamDoc } from "@repo/schemas";
import { ClientSession, FilterQuery } from "mongoose";

export default interface IStreamRepository {
    findStreamById(streamId: string): Promise<StreamDoc | null>;

    findStreamByStageId(stageId: string): Promise<IStream | null>;

    createStream(stream: IStream): Promise<IStream | null>;

    updateEntireStream(
        stream: IStream,
        session?: ClientSession
    ): Promise<IStream | null>;

    updateStreamSetStatus(
        streamId: string,
        status: string
    ): Promise<IStream | null>;

    updateStreamSetVendorEventId(
        streamId: string,
        vendorEventId: string
    ): Promise<IStream | null>;
}
