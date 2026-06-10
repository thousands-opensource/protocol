import { ChannelEntity } from "@pubnub/react-chat-components";
import { Channel } from "@repo/interfaces";

export const REAL_TIME_STREAM_ROUTE = "/realtimestream";

export const BADGE_MULTIPILIER: { [badgeId: string]: number } = {
    "melee-on-the-meteor": 0.5,
    "community-gatherings": 0.5,
    "road-to-ex1": 0.5,
    "partner-activation": 0.5,
    "ultimate-fan": 0.5,
    "moods-of-bolgar": 0.5,
    "spawn-of-spord": 0.5,
    "wildpass-holder": 0.5,
    "full-spectrum-wildpass-holder": 0.5,
    "og-minter": 0.5,
};

export const BADGE_MULTIPILIER_TYPE = ["swagSet", "wildpass", "og"];

export const CHANNELS: Channel[] = [
    { name: "Wildcard World 1", src: "wca-1" },
    { name: "Wildcard World 2", src: "wca-2" },
    { name: "Wildcard World 3", src: "wca-3" },
];

export const DEFAULT_CHANNEL: ChannelEntity = {
    id: "",
    name: "Default",
} as ChannelEntity;
