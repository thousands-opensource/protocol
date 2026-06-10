import { NextApiRequest, NextApiResponse } from "next";
import { getAirDropGifts } from "@/utils/environmentUtilWCA";
import connectToDb from "@/db/connectToDb";
import { createStream } from "@/utils/backend/ivsUtil";
import IStageRepository from "../../../repositories/interfaces/iStageRepository";
import { diContainer } from "../../../inversify.config";
import { Types } from "mongoose";
import { BEAMABLE_RULE_NAMES, getRuleValue } from "@/utils/eventUtil";
import IEventService from "@/services/interfaces/iEventService";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import { authorize } from "../middleware/authorization";
import IServerRepository from "../../../repositories/interfaces/iServerRepository";
import IEventRepository from "../../../repositories/interfaces/iEventRepository";
import { IEvent, EventCreationPayload, ChatApp } from "@repo/interfaces";
import { EventStatus } from "../../../features/Event/types";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const body: EventCreationPayload = req.body;

    console.log("Body: ", body);

    try {
        await connectToDb();

        //Get our IStageRepository from the DI Container
        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");
        const streamRepository: IStreamRepository =
            diContainer.get("IStreamRepository");
        const serverRepository: IServerRepository =
            diContainer.get("IServerRepository");
        const eventRepository: IEventRepository =
            diContainer.get("IEventRepository");

        const stageFields =
            stageRepository.getStageFieldsFromEventCreationContent(
                body?.content
            );

        const server = await serverRepository.getServerFromCode(
            stageFields.serverCode
        );
        const serverId = server?._id.toString();
        if (serverId == null) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error creating event",
                message: `Unable to find serverId from serverCode: ${stageFields.serverCode}`,
            });
            return;
        }

        if (
            server == null ||
            server?.series == null ||
            server?.series.length < 1 ||
            server?.series[0]._id == null
        ) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error creating event",
                message: "Unable to find seriesId in server",
            });
            return;
        }

        const seriesIdObjectId = new Types.ObjectId(stageFields.seriesId);

        //Create event with same name as Stage for now
        const newEvent: IEvent = {
            seriesId: seriesIdObjectId,
            eventName: stageFields.streamName,
            imageUrl: stageFields.imageUrlToSave,
            startDate: stageFields.startDate,
            endDate: stageFields.endDate,
        };
        const event = await eventRepository.createEvent(newEvent);
        if (event == null) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error creating event",
                message:
                    "Unable to create event using eventRepository.createEvent",
            });
            return;
        }

        //Add event to server
        serverRepository.addEvent(serverId, event);

        //Get eventType
        const eventType =
            getRuleValue(BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE, body) ?? "";

        //Create stage
        const stage = await stageRepository.createStage({
            serverId: new Types.ObjectId(serverId),
            seriesId: seriesIdObjectId,
            eventId: event._id,
            beamableEventId: null,
            name: "Main Stage",
            description: stageFields.streamDescription,
            startDate: stageFields.startDate,
            endDate: stageFields.endDate,
            eventType: eventType,
            cameraOperator: getRuleValue(
                BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_RULE,
                body
            ),
            users: [],
            identities: [],
            channels: [{ name: stageFields.streamName, src: "stage" }],
            status: EventStatus.UPCOMING,
            imageUrl: stageFields.imageUrlToSave,
            currentSegment: 0,
            gameMode: stageFields.gameMode,
            numberOfSkyboxes: stageFields.numberOfSkyboxes,
        });

        if (!stage) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error creating event",
                message: "Unknown error while trying to create an event",
            });
            return;
        }

        console.log("apply-content: Stage to add: ", stage);

        //Add stage to server
        serverRepository.addStage(serverId, stage);

        const stageId = stage._id.toString();
        const stream = await createStream(
            serverId,
            stageId,
            stageFields.streamName,
            stageFields.streamDescription,
            ChatApp.NONE
        );
        const streamId = stream.stream?._id.toString();
        if (stream == null || !streamId) {
            return;
        }

        body.content.phases[0].rules.push({
            rule: BEAMABLE_RULE_NAMES.STREAM_ID_RULE,
            value: streamId,
        });

        body.content.phases[0].rules.push({
            rule: BEAMABLE_RULE_NAMES.EVENT_ID_RULE,
            value: stageId,
        });

        body.content.phases[0].rules.push({
            rule: BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_PARTICIPANT_TOKEN_RULE,
            value: stream?.stream?.cameraOperatorParticipantToken || "",
        });

        const billboardImageUrl = body.content.billboardImageUrl;
        console.log("billboardImageUrl: ", billboardImageUrl);

        body.content.phases[0].rules.push({
            rule: BEAMABLE_RULE_NAMES.INITIAL_FANFARE,
            value: `[{"Type": "Banner","Name": "Billboard","Value": "https://test.wildfile.wildcardgame.com/images/arenabillboards/${billboardImageUrl}","SectionId": 0,"SectionName": "","Magnitude": 0,"Delay": 3,"Duration": 60,"Notify": false}]`,
        });

        const giftsString = getAirDropGifts();

        body.content.phases[0].rules.push({
            rule: "gifts",
            value: giftsString,
        });

        const eventService: IEventService = diContainer.get("IEventService");

        let rules: { [key: string]: string } = {};
        for (const rule of body.content.phases[0].rules) {
            rules[rule.rule] = rule.value;
        }
        const phaseName = body.content.phases[0].name;
        const symbol = body.content.symbol;

        const { success, response, error } = await eventService.scheduleEvent(
            stageFields.streamName,
            symbol,
            stageFields.startDateStr,
            phaseName,
            rules,
            stageFields.durationMinutes
        );
        if (!success) {
            // handle error
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error creating event",
                message: `Error while trying to create an event via Timeless MicroServices: ${error}`,
            });
            return;
        } else {
            // update docs  in mongodb with vendorEventId
            await stageRepository.updateEventSetVendorEventId(
                stageId.toString(),
                response
            );
            await streamRepository.updateStreamSetVendorEventId(
                streamId,
                response
            );
        }

        res.json({ success: true });
    } catch (error: any) {
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

export default authorize(handler);
