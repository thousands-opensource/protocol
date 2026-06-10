import {
    COMMUNITY,
    COMMUNITY_GATHERINGS_TITLE,
    MELEE_ON_THE_METEOR_TITLE,
    MOODS_OF_BOLGAR_TITLE,
    OG,
    PRE_ALPHA_PARTNERS_ACTIVATIONS_TITLE,
    ROAD_TO_EX1_TITLE,
    SPAWN_OF_SPORD_TITLE,
    SWAGSET,
    ULTIMATE_FAN_TITLE,
    WILDPASS,
} from "@src/constants";
import {
    CommunityBadgeId,
    OGBadgeId,
    SwagSetCollection,
    WildpassHolder,
} from "./interface";
import { IBadge } from "@repo/interfaces";

/**
 * Get an array of swag set badge meta information
 * @returns array of badge object
 */
export function getSwagSetBadgeMetaInfo(): IBadge[] {
    return [
        {
            id: SwagSetCollection.MOTM,
            type: SWAGSET,
            swagSetTitle: MELEE_ON_THE_METEOR_TITLE,
            name: "Melee on the Meteor",
            description:
                "Earn and retain this badge by maintaining a complete ‘Melee on the Meteor’ swag pin collection!",
            userIds: [],
        },
        {
            id: SwagSetCollection.COMMUNITY_GATHERINGS,
            type: SWAGSET,
            swagSetTitle: COMMUNITY_GATHERINGS_TITLE,
            name: "Community Gatherings",
            description:
                "Earn and retain this badge by maintaining a complete ‘Community Gatherings’ swag pin collection!",
            userIds: [],
        },
        {
            id: SwagSetCollection.ROAD_TO_EX1,
            type: SWAGSET,
            swagSetTitle: ROAD_TO_EX1_TITLE,
            name: "Road to EX1",
            description:
                "Earn and retain this badge by maintaining a complete ‘Road to EX1’ swag pin collection!",
            userIds: [],
        },
        {
            id: SwagSetCollection.PARTNER_ACTIVATION,
            type: SWAGSET,
            swagSetTitle: PRE_ALPHA_PARTNERS_ACTIVATIONS_TITLE,
            name: "Partner Activation",
            description:
                "Earn and retain this badge by maintaining a complete ‘Partner Activation’ swag pin collection!",
            userIds: [],
        },
        {
            id: SwagSetCollection.ULTIMATE_FAN,
            type: SWAGSET,
            swagSetTitle: ULTIMATE_FAN_TITLE,
            name: "Ultimate Fan",
            description:
                "Earn and retain this badge by maintaining a complete ‘Ultimate Fan’ swag pin collection!",
            userIds: [],
        },
        {
            id: SwagSetCollection.MOODS_OF_BOLGAR,
            type: SWAGSET,
            swagSetTitle: MOODS_OF_BOLGAR_TITLE,
            name: "Moods of Bolgar",
            description:
                "Earn and retain this badge by maintaining a complete ‘Moods of Bolgar’ swag pin collection!",
            userIds: [],
        },
        {
            id: SwagSetCollection.SPAWN_OF_SPORD,
            type: SWAGSET,
            swagSetTitle: SPAWN_OF_SPORD_TITLE,
            name: "Spawn of Spord",
            description:
                "Earn and retain this badge by maintaining a complete ‘Spawn of Spord’ swag pin collection!",
            userIds: [],
        },
    ];
}

/**
 * Get an array of swag set badge meta information
 * @returns array of badge object
 */
export function getCommunityBadgeMetaInfo(): IBadge[] {
    return [
        {
            id: CommunityBadgeId.ATTENDEE,
            type: COMMUNITY,
            name: "Attendee",
            description:
                "Earn this badge by showing up to a Community Event, held in our Discord!",
            userIds: [],
        },
        {
            id: CommunityBadgeId.PLAYTESTER,
            type: COMMUNITY,
            name: "Playtest",
            description:
                "Earn this badge by joining a Playtest event in our Discord server on the #arena-stage!",
            userIds: [],
        },
        {
            id: CommunityBadgeId.KUDO_RECEIVER,
            type: COMMUNITY,
            name: "Kudos",
            description:
                "Earn this badge by being recognized by a Community Manager with #kudos. Kudos are given for being an active member in the Discord and helping to shape our community into the best it can be!",
            userIds: [],
        },
    ];
}

/**
 * Get an array of wildpass badge meta information
 * @returns array of badge object
 */
export function getWildpassBadgeMetaInfo(): IBadge[] {
    return [
        {
            id: WildpassHolder.WILDPASS_HOLDER,
            type: WILDPASS,
            name: "Wildpass Holder",
            description:
                "Earn and retain this badge by maintaining a Wildpass!",
            userIds: [],
        },
        {
            id: WildpassHolder.FULL_SPECTRUM_WILDPASS_HOLDER,
            type: WILDPASS,
            name: "Wildpass Full Spectrum",
            description:
                "Earn and retain this badge by maintaining a full spectrum set of Wildpasses!",
            userIds: [],
        },
    ];
}

/**
 * Get an array of wildpass badge meta information
 * @returns array of badge object
 */
export function getOGBadgeMetaInfo(): IBadge[] {
    return [
        {
            id: OGBadgeId.OG_MINTER,
            type: OG,
            name: "Wildpass OG Minter",
            description:
                "Anyone who was an OG Wildpass minter will receive this badge!",
            userIds: [],
        },
    ];
}
