import axios from "axios";
import { getAdminAccessToken } from "@/backend/common";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { injectable } from "inversify";
import "reflect-metadata";
import IEventService, {
    GetAllPlayersForEventResponse,
    GetEventDetailsResponse,
    GetEventsForPlayerResponse,
    SetPlayerScoreForEventResponse,
} from "@/services/interfaces/iEventService";
import { beamableMicroserviceApiCall } from "@/utils/backend/timelessApiUtil";
import { FanfareEffect } from "@/services/interfaces/iFanVisibilityService";
import { v4 as uuidv4 } from "uuid";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

@injectable()
export default class BeamableEventService implements IEventService {
    async getAllPlayersForEvent(gamerTag: string, vendorEventId: string) {
        //We have to prefix the eventId with "event_" and postfix it with ".1" to be able to get the leaderboard partition
        const leaderBoardPartitionId = "event_" + vendorEventId + ".1";

        const accessToken = await getAdminAccessToken();

        const url = `${BEAM_API_URL}/object/leaderboards/${leaderBoardPartitionId}/view`;
        const response = await axios.get(`${url}`, {
            headers: {
                accept: "application/json",
                "X-DE-SCOPE": BEAM_SCOPE,
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data as GetAllPlayersForEventResponse;
    }

    async getEventsForPlayer(gamerTag: string) {
        const accessToken = await getAdminAccessToken();

        const url = `${BEAM_API_URL}/object/event-players/${gamerTag}`;

        const response = await axios.get(url, {
            headers: {
                accept: "application/json",
                "X-DE-SCOPE": BEAM_SCOPE,
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        console.log(response.data);

        return response.data as GetEventsForPlayerResponse;
    }

    async setPlayerScoreForEvent(
        gamerTag: string,
        vendorEventId: string,
        score: number,
        increment: boolean
    ) {
        const accessToken = await getAdminAccessToken();

        const url = `${BEAM_API_URL}/object/event-players/${vendorEventId}/score`;
        const response = await axios.put(
            `${url}`,
            { vendorEventId, score, increment },
            {
                headers: {
                    accept: "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (response.status !== 200) {
            return {
                success: false,
                errormessage: "Failed to update score",
            };
        }

        return {
            success: true,
            errormessage: "",
        } as SetPlayerScoreForEventResponse;
    }

    async getEventDetails(vendorEventId: string) {
        const accessToken = await getAdminAccessToken();

        const url = `${BEAM_API_URL}/object/events/${vendorEventId}`;
        const response = await axios.get(`${url}`, {
            headers: {
                accept: "application/json",
                "X-DE-SCOPE": BEAM_SCOPE,
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data as GetEventDetailsResponse;
    }

    async getStreamIdFromVendorEventId(vendorEventId: string) {
        let vendorEvent: GetEventDetailsResponse = await this.getEventDetails(
            vendorEventId
        );

        if (vendorEvent == null) {
            return "";
        }

        if (
            vendorEvent.content?.phases?.length < 1 ||
            vendorEvent.content?.phases[0]?.rules == null
        ) {
            return "";
        }

        let streamId: string = "";
        for (
            let ruleIndex = 0;
            ruleIndex < vendorEvent.content.phases[0].rules.length;
            ruleIndex++
        ) {
            if (
                vendorEvent.content.phases[0].rules[ruleIndex].rule ==
                "streamId"
            ) {
                streamId = vendorEvent.content.phases[0].rules[ruleIndex].value;
                break;
            }
        }

        return streamId;
    }

    async endEvent(vendorEventId: string, endDateUtc: Date) {
        try {
            const beamableEndEventResponse = await beamableMicroserviceApiCall(
                "/EndEvent",
                {
                    eventId: vendorEventId, //This is the eventId for the vendor's system, but we refer to it as vendorEventId in our system
                    endTime: endDateUtc.toJSON(),
                }
            );
        } catch (beamableError: any) {
            console.error("Error ending event on Beamable:", beamableError);
            return false;
        }

        return true;
    }

    async addEventMatch(
        vendorEventId: string,
        matchId: string,
        cameraOperator: string,
        competitorGameTags: string[]
    ) {
        try {
            const requestPayload = {
                request: {
                    EventId: vendorEventId, //This is the eventId for the vendor's system, but we refer to it as vendorEventId in our system
                    MatchId: matchId,
                    CameraOperator: cameraOperator,
                    Competitors: competitorGameTags,
                },
            };

            const beamableEndEventResponse = await beamableMicroserviceApiCall(
                "/AddEventMatch",
                requestPayload
            );
        } catch (beamableError: any) {
            console.error(
                "Error adding an event match on Beamable:",
                beamableError
            );
            return false;
        }

        return true;
    }

    async setStat(gamerTag: string, statName: string, statValue: string) {
        try {
            const gamerTagNumber: number = Number(gamerTag);

            const requestPayload = {
                gamerTag: gamerTagNumber,
                statName,
                statValue,
            };

            const beamableSetStatResponse = await beamableMicroserviceApiCall(
                "/SetStat",
                requestPayload
            );
        } catch (beamableError: any) {
            console.error(
                `Error setting stat ${statName} : ${statValue} for gamerTag: ${gamerTag} on Beamable:`,
                beamableError
            );
            return false;
        }

        return true;
    }

    async setUserAsCompetitor(gamerTag: string) {
        try {
            const gamerTagNumber: number = Number(gamerTag);

            const requestPayload = {
                gamerTag: gamerTagNumber,
                isCompetitor: true
            };

            const beamableSetUserAsCompetitorResponse = await beamableMicroserviceApiCall(
                "/SetIsCompetitor",
                requestPayload
            );
        } catch (beamableError: any) {
            console.error(
                `Error setting user as competitor for gamerTag: ${gamerTag} on Beamable:`,
                beamableError
            );
            return false;
        }

        return true;
    }

    async setUserName(gamerTag: string, userName: string) {
        if (!gamerTag || gamerTag === "") {
            console.log("setUserName: missing or empty gamerTag!");
            return false;
        }
        if (!userName || userName === "") {
            console.log("setUserName: missing or empty userName!");
            return false;
        }

        try {
            const gamerTagNumber: number = Number(gamerTag);
            const requestPayload = {
                gamerTag: gamerTagNumber,
                userName: userName
            };

            console.log("requestPayload: ", requestPayload);

            const beamableResponse = await beamableMicroserviceApiCall(
                "/SetUsername",
                requestPayload
            );
            console.log("Setting beamable username");
        } catch (beamableError: any) {
            console.error("Error updating Beamable username:", beamableError);
            return false;
        }

        return true;
    }

    async cancelEventMatch(vendorEventId: string, matchId: string) {
        try {
            const beamableEndEventResponse = await beamableMicroserviceApiCall(
                "/CancelEventMatch",
                {
                    request: {
                        eventId: vendorEventId, //This is the eventId for the vendor's system, but we refer to it as vendorEventId in our system
                        matchId,
                    },
                }
            );
        } catch (beamableError: any) {
            console.error(
                `Error canceling event "${vendorEventId}" match "${matchId}" on Beamable:`,
                beamableError
            );
            return false;
        }

        return true;
    }

    async scheduleEvent(
        name: string,
        symbol: string,
        startDate: string,
        phaseName: string,
        rules: { [rule: string]: string },
        durationMinutes: number
    ) {
        let response;
        try {
            response = await beamableMicroserviceApiCall("/ScheduleEvent", {
                request: {
                    Name: name,
                    Symbol: symbol,
                    StartDate: startDate,
                    PhaseName: phaseName,
                    Rules: rules,
                    DurationMinutes: durationMinutes,
                },
            });
        } catch (beamableError: any) {
            console.error(
                `Error scheduling event "${name}" on Beamable:`,
                beamableError
            );
            return { success: false, error: beamableError, response };
        }

        return { success: true, response };
    }

    async sendBoost(vendorEventId: string, fanId: string, fanfareEffects: FanfareEffect[]) {
        let response;
        try {
            const request = {
                "request": {
                    "EventId": vendorEventId,
                    "MatchId": "1",
                    "Boost": {
                        "Uid": uuidv4(),
                        "Participants": [
                            fanId
                        ],
                        "Effects": fanfareEffects,
                        "Duration": 0,
                        "MetaData": {},
                        "SectionName": ""
                    }
                }
            };

            console.log("REQUEST: ", JSON.stringify(request));

            response = await beamableMicroserviceApiCall("/SendBoost", request);
        } catch (beamableError: any) {
            console.error(
                `Error sending boost!`,
                beamableError
            );
            return { success: false, error: beamableError, response };
        }

        return { success: true, error: null, response };
    }
}
