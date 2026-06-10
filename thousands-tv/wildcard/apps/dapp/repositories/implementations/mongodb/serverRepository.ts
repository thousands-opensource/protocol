import IServerRepository from "@/repositories/interfaces/iServerRepository";
import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { IEvent, ISeries, IStage } from "@repo/interfaces";
import { ServerDoc, serverModel, findOneServerByQuery } from "@repo/schemas";
import "reflect-metadata";
import { ClientSession, Types } from "mongoose";

@injectable()
export default class serverRepository implements IServerRepository {
    async getServer(serverId: string): Promise<ServerDoc | null> {
        try {
            await connectToDb();
            const serverIdIsValid = new Types.ObjectId(serverId);
            return await serverModel.findById(serverIdIsValid);
        } catch (e: any) {
            console.log(
                `serverRepository.getServer serverId: ${serverId} error: `,
                e
            );
            return null;
        }
    }
    async getServerFromCode(serverCode: string): Promise<ServerDoc | null> {
        try {
            await connectToDb();

            if (!serverCode || serverCode === "") {
                console.log(
                    `serverRepository.getServerFromCode serverCode: ${serverCode}`
                );
                return null;
            }

            return await findOneServerByQuery({
                serverCode,
            });
        } catch (e: any) {
            console.log(
                `serverRepository.getServerFromCode serverCode: ${serverCode} error: `,
                e
            );
            return null;
        }
    }

    async addEvent(serverId: string, event: IEvent): Promise<boolean> {
        try {
            await connectToDb();

            const update = {
                $push: {
                    events: event,
                },
            };
            await serverModel.findOneAndUpdate({ _id: serverId }, update);
        } catch (e: any) {
            console.log(`serverRepository.addEvent unknown error: `, e);
            return false;
        }

        return true;
    }

    async addStage(serverId: string, stage: IStage): Promise<boolean> {
        try {
            await connectToDb();

            //This IStage set of fields is truncated by the serverSchema to a smaller set of fields
            const update = {
                $push: {
                    stages: stage,
                },
            };
            await serverModel.findOneAndUpdate({ _id: serverId }, update);
        } catch (e: any) {
            console.log(`serverRepository.addStage unknown error: `, e);
            return false;
        }

        return true;
    }

    async addSeries(
        serverId: string,
        series: ISeries,
        session?: ClientSession
    ): Promise<boolean> {
        try {
            await connectToDb();

            const update = {
                $push: {
                    series,
                },
            };
            await serverModel.findOneAndUpdate({ _id: serverId }, update, {
                session,
            });
        } catch (e: any) {
            console.log(`serverRepository.addSeries unknown error: `, e);
            return false;
        }

        return true;
    }

    // Function to update a specific series in a server
    async updateServerSeries(
        serverId: string | Types.ObjectId,
        seriesId: string | Types.ObjectId,
        updates: ISeries, // updates to make to series
        session?: ClientSession
    ) {
        // Convert string IDs to ObjectIds if needed
        const serverObjId =
            typeof serverId === "string"
                ? new Types.ObjectId(serverId)
                : serverId;
        const seriesObjId =
            typeof seriesId === "string"
                ? new Types.ObjectId(seriesId)
                : seriesId;

        const result = await serverModel.updateOne(
            {
                _id: serverObjId,
                "series._id": seriesObjId, // Find the specific series in the array
            },
            {
                $set: {
                    "series.$.seriesName": updates.seriesName,
                    "series.$.seriesDescription": updates.seriesDescription,
                    "series.$.startDate": updates.startDate,
                    "series.$.endDate": updates.endDate,
                    "series.$.imageUrl": updates.imageUrl,
                    "series.$.backgroundImageUrl": updates.backgroundImageUrl,
                    "series.$.seriesPointConfiguration":
                        updates.seriesPointConfiguration,
                },
            },
            { session }
        );

        if (result.matchedCount === 0) {
            throw new Error("Server or series not found");
        }

        if (result.modifiedCount === 0) {
            throw new Error("No modifications were made");
        }

        return result;
    }
    // Function to update a specific event in a server
    async updateServerEvent(
        serverId: string | Types.ObjectId,
        eventId: string | Types.ObjectId,
        updates: IEvent, // updates to make to event
        session?: ClientSession
    ) {
        try {
            // Convert string IDs to ObjectIds if needed
            const serverObjId =
                typeof serverId === "string"
                    ? new Types.ObjectId(serverId)
                    : serverId;
            const eventObjId =
                typeof eventId === "string"
                    ? new Types.ObjectId(eventId)
                    : eventId;

            const result = await serverModel.updateOne(
                {
                    _id: serverObjId,
                    "events._id": eventObjId, // Find the specific series in the array
                },
                {
                    $set: {
                        "events.$.eventName": updates.eventName,
                        "events.$.startDate": updates.startDate,
                        "events.$.endDate": updates.endDate,
                        "events.$.imageUrl": updates.imageUrl,
                    },
                },
                { session }
            );

            if (result.matchedCount === 0) {
                throw new Error("Server or series not found");
            }

            if (result.modifiedCount === 0) {
                throw new Error("No modifications were made");
            }

            return result;
        } catch (e: any) {
            const errorMsg = `serverRepository.updateServerEvent eventId: ${eventId} error: ${e} `;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    async updateServerStage(
        serverId: string | Types.ObjectId,
        stageId: string | Types.ObjectId,
        updates: IStage, // updates to make to stage
        session?: ClientSession
    ) {
        try {
            // Convert string IDs to ObjectIds if needed
            const serverObjId =
                typeof serverId === "string"
                    ? new Types.ObjectId(serverId)
                    : serverId;
            const stageObjId =
                typeof stageId === "string"
                    ? new Types.ObjectId(stageId)
                    : stageId;

            const result = await serverModel.updateOne(
                {
                    _id: serverObjId,
                    "stages._id": stageObjId, // Find the specific series in the array
                },
                {
                    $set: {
                        "stages.$.serverId": updates.serverId,
                        "stages.$.seriesId": updates.seriesId,
                        "stages.$.eventId": updates.eventId,
                        "stages.$.beamableEventId": updates.beamableEventId,
                        "stages.$.name": updates.name,
                        "stages.$.description": updates.description,
                        "stages.$.startDate": updates.startDate,
                        "stages.$.users": updates.users,
                        "stages.$.channels": updates.channels,
                        "stages.$.imageUrl": updates.imageUrl,
                        "stages.$.status": updates.status,
                        "stages.$.endDate": updates.endDate,
                        "stages.$.eventType": updates.eventType,
                        "stages.$.cameraOperator": updates.cameraOperator,
                    },
                },
                { session }
            );

            if (result.matchedCount === 0) {
                throw new Error("Server or series not found");
            }

            if (result.modifiedCount === 0) {
                throw new Error("No modifications were made");
            }

            return result;
        } catch (e: any) {
            const errorMsg = `serverRepository.updateServerStage stageId: ${stageId} error: ${e} `;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
}
