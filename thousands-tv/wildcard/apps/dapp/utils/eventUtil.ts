import {
    MILLISECONDS_PER_DAY,
    MILLISECONDS_PER_HOUR,
    MILLISECONDS_PER_MINUTE,
} from "@/features/Event/constants";
import { EventStatus } from "@/features/Event/types";
import {
    IStage,
    EventCreationContent,
    EventCreationPayload,
    Rule,
    GAME_MODE,
} from "@repo/interfaces";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/// BEAMABLE UTILS
export enum BEAMABLE_RULE_NAMES {
    EVENT_TYPE_RULE = "eventType",
    CAMERA_OPERATOR_RULE = "cameraoperator",
    DESCRIPTION_RULE = "description",
    CAMERA_OPERATOR_PARTICIPANT_TOKEN_RULE = "cameraOperatorParticipantToken",
    STREAM_ID_RULE = "streamId",
    EVENT_ID_RULE = "eventId",
    INITIAL_FANFARE = "initial_fanfare",
}

export const getRuleValue = (
    ruleName: BEAMABLE_RULE_NAMES,
    eventPayload: EventCreationPayload
) => {
    for (const phase of eventPayload.content.phases) {
        for (const rule of phase.rules) {
            if (rule.rule === ruleName) {
                return rule.value;
            }
        }
    }
};

export const updateRuleValue = (
    ruleName: BEAMABLE_RULE_NAMES,
    value: string,
    rules: Rule[]
) => {
    for (const rule of rules) {
        if (rule.rule === ruleName) {
            rule.value = value;
        }
    }
};

/**
 * Calculates the time difference in milliseconds between a given start date and the current date.
 */
const calculateTimeDifference = (
    startDate: Date,
    now: Date = new Date()
): number => {
    return startDate.getTime() - now.getTime();
};

/**
 * Formats the upcoming status based on the time difference provided.
 */
const formatUpcomingStatus = (diffTime: number): string => {
    const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY);
    const diffHours = Math.ceil(diffTime / MILLISECONDS_PER_HOUR);
    const diffMinutes = Math.ceil(diffTime / MILLISECONDS_PER_MINUTE);

    if (diffDays > 1) {
        return `in ${diffDays} days`;
    } else if (diffHours > 1) {
        return `in ${diffHours} hours`;
    } else {
        return `in ${diffMinutes} minutes`;
    }
};

/**
 * Returns the status text based on the event status and start date.
 */
export const getStatusText = (status: EventStatus, startDate: Date): string => {
    switch (status) {
        case EventStatus.LIVE:
            return "LIVE";
        case EventStatus.UPCOMING:
            const diffTime = calculateTimeDifference(startDate);
            return formatUpcomingStatus(diffTime);
        case EventStatus.COMPLETED:
            return "(completed)";
        default:
            return "";
    }
};

/**
 * Returns a random event image from a predefined list of images.
 */
export const getRandomEventImage = (): string => {
    const images = [
        "/images/thousands-game-event.png",
        "/images/Events/lushland-arena.jpg",
        "/images/Events/frostburn-arena.jpg", // Replace with your second image path
    ];
    return images[Math.floor(Math.random() * images.length)];
};

/**
 * Converts a date string from 'DD/MM/YYYY' format to 'Month Day, Year' format.
 */
export const formatDateString = (dateStr: string): string => {
    //const [month, day, year] = dateStr.split("/");
    //const date = new Date(`${year}-${month}-${day}`);
    //return date.toLocaleDateString("en-US", {
    //    year: "numeric",
    //    month: "long",
    //    day: "numeric",
    //});

    const startDateStr = new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return startDateStr;
};

/**
 * Determines the status of an event based on its current status and start date.
 */
export const determineEventStatus = (event: IStage): EventStatus => {
    if (event.status === EventStatus.LIVE) {
        return EventStatus.LIVE;
    } else if (event.status === EventStatus.UPCOMING) {
        return EventStatus.UPCOMING;
    } else {
        return EventStatus.COMPLETED;
    }

    /*
    const now = new Date();
    const startDate = new Date(event.startDate);

    if (now < startDate) {
        return EventStatus.UPCOMING;
    } else {
        return EventStatus.COMPLETED;
    }
    */
};

/**
 * Finds the default event from a list of events. The default event is determined as follows:
 * 1. If there is a live event, it is returned.
 * 2. If there are upcoming events, the one with the earliest start date is returned that's in the future of now().
 * 3. If there are no live or upcoming events, null is returned. (no upcoming events)
 */
export const findDefaultEvent = (events: IStage[]): IStage | null => {
    const now = new Date();
    const liveEvent = events.find((event) => event.status === EventStatus.LIVE);
    if (liveEvent) return liveEvent;

    const upcomingEvents = events.filter((event) => {
        const startDate = new Date(event.startDate);
        return startDate > now;
    });
    return upcomingEvents.length > 0
        ? upcomingEvents.reduce((a, b) =>
              new Date(a.startDate) < new Date(b.startDate) ? a : b
          )
        : null;
};

/**
 * Generates a new unique access code using UUID v4.
 * @returns - a new unique access code.
 */
export const generateAccessCode = (): string => {
    return uuidv4();
};

/**
 * Returns the appropriate status text based on the ticket's state.
 *
 * @param {boolean} isClaimed - Indicates if the ticket is claimed.
 * @param {boolean} isEventCompleted - Indicates if the event is completed.
 * @param {boolean} isSelected - Indicates if the ticket is selected.
 * @returns {string} The status text to be displayed.
 */
export const claimedTicketTextStatusJSX = (
    isClaimed: boolean,
    isEventCompleted: boolean,
    isSelected: boolean,
    isEventLive: boolean
): string => {
    if (isClaimed) {
        return "Claimed";
    } else if (isEventCompleted) {
        return "Event Completed";
    } else if (!isEventLive) {
        return "Not Live Yet";
    } else if (isSelected) {
        return "Selected";
    } else {
        return "Select Ticket";
    }
};

export const getInitialEventFormValuesFromPayload = (
    event: EventCreationPayload | null | undefined
) => {
    const initialValues: EventCreationContent = {
        serverCode: event ? event.content.serverCode : "",
        name: event ? event.content.name : "",
        symbol: event ? event.content.symbol : "",
        start_date: event ? event.content.start_date : "",
        seriesId: event ? event.content.seriesId : "",
        phases:
            event && event.content.phases
                ? event.content.phases
                : [
                      {
                          name: "",
                          duration_minutes: "",
                          durationSeconds: 0,
                          durationMillis: 0,
                          rules: [],
                      },
                  ],
        partition_size: event ? event.content.partition_size : "5",
        permissions: event
            ? event.content.permissions
            : {
                  write_self: true,
              },
        score_rewards: event ? event.content.score_rewards : [],
        rank_rewards: event ? event.content.rank_rewards : [],
        group_rewards: event
            ? event.content.group_rewards
            : {
                  scoreRewards: [],
              },
        type: event ? event.content.type : "scheduled",
        recurring: event ? event.content.recurring : null,
        cohortSettings: event
            ? event.content.cohortSettings
            : {
                  cohorts: [],
              },
        imageUrl: event
            ? event.content.imageUrl
            : "/images/thousands-game-event.png",
        durationMinutes: event ? event.content.durationMinutes : 120,
        billboardImageUrl: "defaultarenabillboards.png",
        gameMode: event ? event.content.gameMode : GAME_MODE.NONE,
        numberOfSkyboxes: event ? event.content.numberOfSkyboxes : 0,
    };

    return initialValues;
};

export const fetchEventDetails = async (
    vendorEventId: string
): Promise<EventCreationPayload | null> => {
    try {
        const response = await axios.get(
            `/api/beamable/event/get?objectId=${vendorEventId}`
        );
        return response.data;
    } catch (e) {
        console.error("Error fetching event details:", e);
        return null;
    }
};
