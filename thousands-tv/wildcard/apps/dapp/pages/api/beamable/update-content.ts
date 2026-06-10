import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken } from "@/backend/common";
import connectToDb from "@/db/connectToDb";
import IStageRepository from "../../../repositories/interfaces/iStageRepository";
import IStreamRepository from "../../../repositories/interfaces/iStreamRepository";
import { diContainer } from "../../../inversify.config";
import { BEAMABLE_RULE_NAMES, getRuleValue } from "@/utils/eventUtil";
import { EventCreationPayload, IEvent, IStage } from "@repo/interfaces";
import { BEAM_API_URL, BEAM_SCOPE } from "@/utils/beamableUtil";
import mongoose, { ClientSession, Types } from "mongoose";
import IEventRepository from "@/repositories/interfaces/iEventRepository";
import IServerRepository from "@/repositories/interfaces/iServerRepository";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    const body: EventCreationPayload = req.body;
    console.log("update-content body: ", body);

    try {
        const accessToken = await getAdminAccessToken();

        //Get required repositories from the DI Container
        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");
        const streamRepository: IStreamRepository =
            diContainer.get("IStreamRepository");
        const eventRepository: IEventRepository =
            diContainer.get("IEventRepository");
        const serverRepository: IServerRepository =
            diContainer.get("IServerRepository");

        await connectToDb();
        const stageFields =
            stageRepository.getStageFieldsFromEventCreationContent(
                body?.content
            );

        // make sure server exists
        const server = await serverRepository.getServerFromCode(
            stageFields.serverCode
        );
        const serverId = server?._id.toString();
        if (serverId == null || serverId === undefined) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error creating event",
                message: `Unable to find serverId from serverCode: ${stageFields.serverCode}`,
            });
            return;
        }

        // get stream corresponding to event too be updated
        const streamId = getRuleValue(BEAMABLE_RULE_NAMES.STREAM_ID_RULE, body);
        if (!streamId) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error updating event stream",
                message: `Could not find event stream to update.`,
            });
            return;
        }

        // make sure stream exists
        const originalStreamDoc = await streamRepository.findStreamById(
            streamId
        );
        // Mongo returns a full mongoose document with internal properties such as _doc
        // we need to convert to a plain object in order to use the spread operator on the object correctly
        const originalStream = originalStreamDoc?.toObject();
        if (!originalStream) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error updating event stream",
                message: `Could not find event  stream with id ${streamId} to update.`,
            });
            return;
        }

        // find stage to be updated
        const stageId =
            originalStream?.stageId.toString() ||
            getRuleValue(BEAMABLE_RULE_NAMES.EVENT_ID_RULE, body);
        if (!stageId) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error updating event",
                message: `Could not find event to update.`,
            });
            return;
        }

        const originalStageDoc = await stageRepository.getStage(stageId);
        // Mongo returns a full mongoose document with internal properties such as _doc
        // we need to convert to a plain object in order to use the spread operator on the object correctly
        const originalStage = originalStageDoc?.toObject();
        if (!originalStage) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error updating stage",
                message: `Could not find stage with id ${stageId} to update.`,
            });
            return;
        }

        const updatedStage: IStage = {
            ...originalStage,
            description: stageFields.streamDescription,
            startDate: stageFields.startDate,
            endDate: stageFields.endDate,
            eventType:
                getRuleValue(BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE, body) ?? "",
            cameraOperator: getRuleValue(
                BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_RULE,
                body
            ),
            channels: originalStage.channels.map((channel) => {
                return { ...channel, name: stageFields.streamName };
            }),
            seriesId: new Types.ObjectId(stageFields.seriesId),
            imageUrl: stageFields.imageUrlToSave,
            gameMode: stageFields.gameMode,
            numberOfSkyboxes: stageFields.numberOfSkyboxes,
        };

        // Update  stage
        const newStage = await stageRepository.updateEntireStage(
            updatedStage,
            session
        );

        // update stream
        const newStream = await streamRepository.updateEntireStream(
            {
                ...originalStream,
                name: stageFields.streamName,
                description: stageFields.streamDescription,
            },
            session
        );

        // update the event
        const eventId = originalStage.eventId?.toString() ?? "";
        const originalEventDoc = await eventRepository.getEvent(eventId);
        // Mongo returns a full mongoose document with internal properties such as _doc
        // we need to convert to a plain object in order to use the spread operator on the object correctly
        const originalEvent = originalEventDoc?.toObject();

        if (!originalEvent) {
            await session.abortTransaction();
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error updating event",
                message: `Could not find event with id ${originalStage.eventId} to update.`,
            });
            return;
        }
        const updatedEvent: IEvent = {
            ...originalEvent,
            seriesId: new Types.ObjectId(stageFields.seriesId),
            imageUrl: stageFields.imageUrlToSave,
            startDate: stageFields.startDate,
            endDate: stageFields.endDate,
            eventName: stageFields.streamName,
        };

        const newEvent = await eventRepository.updateEntireEvent(
            updatedEvent,
            session
        );

        // update the event in the mongo db server doc
        const serverEventUpdateResponse =
            await serverRepository.updateServerEvent(
                serverId,
                eventId,
                updatedEvent,
                session
            );

        // update the stage in the mongo db server doc
        const serverStageUpdateResponse =
            await serverRepository.updateServerStage(
                serverId,
                stageId,
                updatedStage,
                session
            );

        // check if there were any errors with the mongo updates se we know to abort the mongo transaction
        const checkForMongoUpdateErrors = () => {
            if (!newStage) {
                return `Error updating stage with id ${stageId}`;
            }
            if (!newStream) {
                return `Error updating stream with id ${originalStream._id.toString()}`;
            }
            if (!newEvent) {
                return `Error updating event with id ${eventId}`;
            }
            if (
                !serverEventUpdateResponse ||
                serverEventUpdateResponse.modifiedCount !== 1
            ) {
                return `Unknown error while trying to update an event in the server data table`;
            }
            if (
                !serverStageUpdateResponse ||
                serverStageUpdateResponse.modifiedCount !== 1
            ) {
                return "Unknown error while trying to update a stage in the server data table";
            }
            return "";
        };
        const mongoUpdateError = checkForMongoUpdateErrors();
        if (mongoUpdateError) {
            await session.abortTransaction();
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error updating event",
                message: mongoUpdateError,
            });
            return;
        }

        // update the event/stage in beamable
        const response = await axios.post(
            `${BEAM_API_URL}/basic/events/applyContent`,
            body,
            {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        if (response.status !== 200) {
            res.status(500).json({
                status: response.data.status,
                service: response.data.service,
                error: response.data.error,
                message: response.data.message,
            });
            return;
        }

        await session.commitTransaction();
        res.json({ success: true });
    } catch (error: any) {
        await session.abortTransaction();
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error applying content",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default handler;
