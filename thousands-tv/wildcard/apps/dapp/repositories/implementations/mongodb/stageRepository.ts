import IStageRepository, {
    EventWithValidation,
    StageFields,
} from "@/repositories/interfaces/iStageRepository";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { IStage, IUser, EventCreationContent } from "@repo/interfaces";
import {
    usersModel,
    StageDoc,
    stagesModel,
    findOneEventByQuery,
    doesUserExistInEvent,
    updateOneEvent,
    updateEntireStage,
    findStagesByQuery,
    serverModel,
} from "@repo/schemas";
import "reflect-metadata";
import { ClientSession, Types } from "mongoose";

@injectable()
export default class StageRepository implements IStageRepository {
    async createStage(stage: IStage): Promise<StageDoc | null> {
        try {
            await connectToDb();
            return await stagesModel.create(stage);
        } catch (e: any) {
            console.log(
                `stageRepository.createStage stage: ${stage} error: `,
                e
            );
            return null;
        }
    }

    //TO DO: Change to getEventsForSeries
    async getEventsForSeason(seriesId: string): Promise<StageDoc[]> {
        try {
            await connectToDb();

            const seriesIdIsValid = new Types.ObjectId(seriesId);

            return await stagesModel
                .find({
                    seriesId: seriesIdIsValid,
                })
                .sort({ startDate: 1 });
        } catch (e: any) {
            console.log(
                `stageRepository.getEventsForSeason seriesId: ${seriesId} error: `,
                e
            );
            return [];
        }
    }

    async getStage(stageId: string): Promise<StageDoc | null> {
        try {
            await connectToDb();
            const event: StageDoc | null = await findOneEventByQuery({
                _id: stageId,
            });
            if (!event) {
                return null;
            }

            return event;
        } catch (e: any) {
            console.log(
                `stageRepository.getEvent stageId: ${stageId} error: `,
                e
            );
            return null;
        }
    }

    getStageFieldsFromEventCreationContent(
        content: EventCreationContent
    ): StageFields {
        const imageUrl = content.imageUrl;
        var imageUrlToSave = "";
        //Check to see if the image URL is a full path or just a hosted file
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            imageUrlToSave = imageUrl;
        } else if (!imageUrl.includes("/images")) {
            imageUrlToSave = `/images/${imageUrl}`;
        } else {
            imageUrlToSave = imageUrl;
        }
        const startDateStr = content.start_date || new Date().toString();
        const startDate = new Date(startDateStr);
        const durationMinutes = content.durationMinutes;
        const stageFields: StageFields = {
            streamName: content.name,
            durationMinutes: durationMinutes,
            startDateStr: startDateStr,
            startDate: startDate,
            endDate: new Date(
                startDate.getTime() + durationMinutes * 60 * 1000
            ), //Add duration minutes to the startDate to get endDate
            serverCode: content.serverCode,
            imageUrl: imageUrl,
            imageUrlToSave: imageUrlToSave,
            seriesId: content.seriesId,
            streamDescription:
                this.getRuleValueFromEventCretaionContent(
                    "description",
                    content
                ) || "Playtest",
            currentSegment: 0,
            gameMode: content.gameMode,
            numberOfSkyboxes: content.numberOfSkyboxes,
        };

        return stageFields;
    }

    async getEventFromVendorEventId(
        vendorEventId: string
    ): Promise<StageDoc | null> {
        try {
            await connectToDb();
            const event: StageDoc | null = await findOneEventByQuery({
                beamableEventId: vendorEventId,
            });
            if (!event) {
                return null;
            }

            return event;
        } catch (e: any) {
            console.log(
                `stageRepository.getEventFromVendorEventId vendorEventId: ${vendorEventId} error: `,
                e
            );
            return null;
        }
    }

    async getStagesFromServerId(
        serverId: string,
        sort?: Record<string, 1 | -1>
    ): Promise<StageDoc[]> {
        try {
            await connectToDb();
            const stages = await findStagesByQuery(
                {
                    serverId: serverId,
                },
                sort
            );
            return stages;
        } catch (e: any) {
            console.log(
                `stageRepository.getStagesFromServerId serverId: ${serverId} error: `,
                e
            );
            return [];
        }
    }

    async updateEvent(
        beamableEventId: string,
        userId: string
    ): Promise<EventWithValidation> {
        try {
            if (!beamableEventId || !userId) {
                return { event: null, validationMessage: "Invalid event body" };
            }

            const isUserRegistered = await doesUserExistInEvent({
                beamableEventId,
                users: userId,
            });

            if (isUserRegistered) {
                return {
                    event: null,
                    validationMessage:
                        "User is already registered to the match",
                };
            }

            await connectToDb();
            const user: IUser | null = await usersModel.findOne({
                _id: userId,
            });
            const beamableProviderAccount = getBeamableAccountByUserDB(user);
            if (!beamableProviderAccount) {
                return {
                    event: null,
                    validationMessage: "User does not have beamable account",
                };
            }

            const query = { beamableEventId };
            const update = { $addToSet: { users: userId } };
            const newEvent = await updateOneEvent(query, update);
            return { event: newEvent, validationMessage: "" };
        } catch (e: any) {
            console.log(
                `stageRepository.updateEvent beamableEventId: ${beamableEventId} userId: ${userId} error: `,
                e
            );
            return {
                event: null,
                validationMessage: "Unknown error updating event",
            };
        }
    }

    async updateEventSetStatus(
        eventId: string,
        status: string
    ): Promise<EventWithValidation> {
        try {
            if (!eventId || !status) {
                return { event: null, validationMessage: "Invalid event body" };
            }

            await connectToDb();

            const query = { _id: eventId };
            const update = { $set: { status: status } };
            const updatedStage = await updateOneEvent(query, update);

            if (updatedStage) {
                // Update stage in server's stages array
                const serverQuery = {
                    "stages._id": new Types.ObjectId(eventId),
                };
                const serverUpdate = {
                    $set: { "stages.$.status": status },
                };
                await serverModel.updateOne(serverQuery, serverUpdate);
            }

            return { event: updatedStage, validationMessage: "" };
        } catch (e: any) {
            console.log(
                `stageRepository.updateEventSetStatus eventId: ${eventId} status: ${status} error: `,
                e
            );
            return {
                event: null,
                validationMessage: "Unknown error updating event status",
            };
        }
    }

    async updateEventSetVendorEventId(
        eventId: string,
        vendorEventId: string
    ): Promise<EventWithValidation> {
        try {
            if (!eventId || !vendorEventId) {
                return { event: null, validationMessage: "Invalid event body" };
            }

            await connectToDb();

            const query = { _id: eventId };
            const update = { $set: { beamableEventId: vendorEventId } };
            const newEvent = await updateOneEvent(query, update);
            return { event: newEvent, validationMessage: "" };
        } catch (e: any) {
            console.log(
                `stageRepository.updateEventSetVendorEventId eventId: ${eventId} vendorEventId: ${vendorEventId} error: `,
                e
            );
            return {
                event: null,
                validationMessage: "Unknown error updating event",
            };
        }
    }
    async updateEntireStage(
        stage: IStage,
        session?: ClientSession
    ): Promise<EventWithValidation> {
        try {
            await connectToDb();

            const newEvent = await updateEntireStage(stage, session);
            return { event: newEvent, validationMessage: "" };
        } catch (e: any) {
            console.log(
                `stageRepository.updateEntireStage stageId: ${stage._id} error: `,
                e
            );
            return {
                event: null,
                validationMessage: "Unknown error updating stage",
            };
        }
    }

    private getRuleValueFromEventCretaionContent = (
        ruleName: string,
        eventCreationContent: EventCreationContent
    ): string => {
        for (const phase of eventCreationContent.phases) {
            for (const rule of phase.rules) {
                if (rule.rule === ruleName) {
                    return rule.value;
                }
            }
        }

        return "";
    };

    async getStageByBeamableEventId(
        beamableEventId: string
    ): Promise<StageDoc | null> {
        try {
            await connectToDb();
            return await stagesModel.findOne({ beamableEventId });
        } catch (e: any) {
            console.log(
                `stageRepository.getStageByBeamableEventId beamableEventId: ${beamableEventId} error: `,
                e
            );
            return null;
        }
    }

    async updateEventIncrementCurrentSegement(
        stageId: string
    ): Promise<StageDoc | null> {
        try {
            if (!stageId) {
                return null;
            }

            await connectToDb();

            const query = { _id: stageId };
            const update = { $inc: { currentSegment: 1 } };
            const updatedEvent = await updateOneEvent(query, update);
            return updatedEvent;
        } catch (e: any) {
            console.log(
                `stageRepository.updateEventCurrentSegement stageId: ${stageId} error: `,
                e
            );
            return null;
        }
    }
}
