import MeleeOnTheMeteorBadge from "@/public/images/WildfileAssets/Badges/melee-on-the-meteor.webp";
import RoadToEx1Badge from "@/public/images/WildfileAssets/Badges/road-to-ex1.webp";
import CommunityGatheringsBadge from "@/public/images/WildfileAssets/Badges/community-gatherings.webp";
import PreAlphaPartnersActivationsBadge from "@/public/images/WildfileAssets/Badges/partner-activation.webp";
import MoodsOfBolgarBadge from "@/public/images/WildfileAssets/Badges/moods-of-bolgar.webp";
import UltimateFanBadge from "@/public/images/WildfileAssets/Badges/ultimate-fan.webp";
import SpawnOfSpordBadge from "@/public/images/WildfileAssets/Badges/spawn-of-spord.webp";
import WildpassBadgeFallback from "@/public/images/WildfileAssets/Badges/fallback.webp";
import {
    MELEE_ON_THE_METEOR,
    COMMUNITY_GATHERINGS,
    ROAD_TO_EX1,
    PRE_ALPHA_PARTNERS_ACTIVATIONS,
    MOODS_OF_BOLGAR,
    ULTIMATE_FAN,
    SPAWN_OF_SPORD,
} from "@/constants/swagpins";

/**
 * Get badge image path by swagSetTitle (of the current showcases)
 * @param swagSetTitle -  swagSetTitle
 * @returns - badge image path
 */
export const getBadgeImagePathBySwagSetTitle = (swagSetTitle: string) => {
    switch (swagSetTitle) {
        case MELEE_ON_THE_METEOR:
            return MeleeOnTheMeteorBadge;
        case COMMUNITY_GATHERINGS:
            return CommunityGatheringsBadge;
        case ROAD_TO_EX1:
            return RoadToEx1Badge;
        case PRE_ALPHA_PARTNERS_ACTIVATIONS:
            return PreAlphaPartnersActivationsBadge;
        case ULTIMATE_FAN:
            return UltimateFanBadge;
        case MOODS_OF_BOLGAR:
            return MoodsOfBolgarBadge;
        case SPAWN_OF_SPORD:
            return SpawnOfSpordBadge;
        default:
            return WildpassBadgeFallback;
    }
};
