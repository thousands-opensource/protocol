import {
    WILDEVENTS,
    GET_REGISTERED_EVENT_TYPES,
    FETCH_RECENT_WILDEVENTS,
    WILDEVENT_TYPE,
    NUM_WILDEVENTS,
} from "../constants";

/**
 * List of commands for /wildevents
 */
export const wildeventsCommandList: any[] = [
    {
        name: WILDEVENTS,
        description: "Commands to interact with Wildevents",
        children: [
            {
                name: GET_REGISTERED_EVENT_TYPES,
                description: "Retrieve info about all registered Wildevents",
            },
            {
                name: FETCH_RECENT_WILDEVENTS,
                description: "Fetch recent Wildevents",
                options: [
                    {
                        optionType: "string",
                        optionName: WILDEVENT_TYPE,
                        optionDescription: "Wildevent type",
                        optionRequired: true,
                    },
                    {
                        optionType: "number",
                        optionName: NUM_WILDEVENTS,
                        optionDescription: "Number of Wildevents to fetch",
                        optionRequired: true,
                    },
                ],
            },
        ],
    },
];
