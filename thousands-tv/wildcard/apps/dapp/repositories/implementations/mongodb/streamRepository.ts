import { injectable } from "inversify";
import "reflect-metadata";
import connectToDb from "@/db/connectToDb";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import { StreamDoc, streamModel } from "@repo/schemas";
import { IStream } from "@repo/interfaces";
import { ClientSession } from "mongoose";

@injectable()
export default class StreamRepository implements IStreamRepository {
    async findStreamById(streamId: string): Promise<StreamDoc | null> {
        try {
            await connectToDb();
            return await streamModel.findById(streamId);
        } catch (e: any) {
            console.log(
                `StreamRepository.findStreamById streamId: ${streamId} error: `,
                e
            );
            return null;
        }
    }

    async findStreamByStageId(stageId: string): Promise<IStream | null> {
        try {
            await connectToDb();
            return await streamModel.findOne({ stageId: stageId });
        } catch (e: any) {
            console.log(
                `StreamRepository.findStreamByStageId stageId: ${stageId} error: `,
                e
            );
            return null;
        }
    }

    async createStream(stream: IStream): Promise<IStream | null> {
        try {
            await connectToDb();
            return await streamModel.create(stream);
        } catch (e: any) {
            console.log(
                `StreamRepository.createStream stream: ${stream} error: `,
                e
            );
            return null;
        }
    }

    async updateEntireStream(
        stream: IStream,
        session?: ClientSession
    ): Promise<IStream | null> {
        try {
            await connectToDb();
            const { _id, ...updatedStream } = stream;
            return await streamModel.findByIdAndUpdate(_id, updatedStream, {
                returnDocument: "after",
                upsert: true,
                session,
            });
        } catch (e: any) {
            console.log(
                `StreamRepository.updateEntireStream stream: ${stream} error: `,
                e
            );
            return null;
        }
    }

    async updateStreamSetStatus(
        streamId: string,
        status: string
    ): Promise<IStream | null> {
        try {
            await connectToDb();
            return await streamModel.findOneAndUpdate(
                { _id: streamId },
                { $set: { status: status } },
                { upsert: true }
            );
        } catch (e: any) {
            console.log(
                `StreamRepository.updateStreamSetStatus streamId: ${streamId} status: ${status} error: `,
                e
            );
            return null;
        }
    }

    async updateStreamSetVendorEventId(
        streamId: string,
        vendorEventId: string
    ): Promise<IStream | null> {
        try {
            await connectToDb();
            return await streamModel.findOneAndUpdate(
                { _id: streamId },
                { $set: { vendorEventId: vendorEventId } },
                { upsert: true }
            );
        } catch (e: any) {
            console.log(
                `StreamRepository.updateStreamSetVendorEventId streamId: ${streamId} vendorEventId: ${vendorEventId} error: `,
                e
            );
            return null;
        }
    }
}
