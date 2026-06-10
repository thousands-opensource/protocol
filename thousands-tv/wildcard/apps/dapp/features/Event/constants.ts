import { BoostButtonAttrs } from "@/features/Event/types";
import { TicketTierType } from "@repo/interfaces";

// Example events data (for UI purposes)
export const events = [
    { id: 1, name: "Pre-Alpha Series / 01", status: "completed" },
    { id: 2, name: "Pre-Alpha Series / 02", status: "live" },
    { id: 3, name: "Pre-Alpha Series / 03", status: "upcoming" },
    { id: 4, name: "Pre-Alpha Series / 04", status: "future" },
    { id: 5, name: "Pre-Alpha Series / 05", status: "future" },
    { id: 6, name: "Pre-Alpha Series / 06", status: "future" },
    { id: 7, name: "Pre-Alpha Series / 07", status: "future" },
    { id: 8, name: "Pre-Alpha Series / 08", status: "future" },
];

// UI representation of ticket types
export interface TicketType {
    eventId?: string;
    tier?: TicketTierType; // tier ticket type
    id: number;
    name: string;
    color: string;
    imageSrc: string;
    quantity: number;
    isClaimed?: boolean;
    isSelectable?: boolean; // front end to determine if the ticket is selectable
    creditMultiplier?: number;
}

export const EVENTS_PRIMARY_COLOR = "whiteAlpha.100";
export const EVENT_IMAGE_WIDTH = "100%";

export const MILLISECONDS_PER_MINUTE = 1000 * 60;
export const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
export const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;

// Ticket tiers that require an access code to claim
export const TIERS_REQUIRING_ACCESS_CODE: TicketTierType[] = [
    TicketTierType.VIP,
    TicketTierType.GENERAL_ADMISSION,
];

export function doesTierRequireAccessCode(
    tier: TicketTierType | undefined
): boolean {
    if (!tier) {
        return false;
    }
    return TIERS_REQUIRING_ACCESS_CODE.includes(tier);
}

// Refresh interval for ticket queue
const TICKET_QUEUE_REFRESH_INTERVAL_SECONDS = 30;
export const TICKET_QUEUE_REFRESH_INTERVAL_MS =
    1000 * TICKET_QUEUE_REFRESH_INTERVAL_SECONDS;

// ***************************
// COLOR CONSTANTS
// ***************************
export const CHAT_ACTION_RED = "#AD302C";
export const CHAT_ACTION_PURPLE = "#44167F";

// ***************************
// Boost/Multiplier Button Attributes
// ***************************

// Order of mappings reflects the order of the buttons
export const BoostButtonAttributesMap: Record<number, BoostButtonAttrs> = {
    1.1: {
        background: "linear-gradient(to bottom, #2DA9CF, #1A63F2)",
        borderColor: "#2DA9CF",
    },
    1.5: {
        background: "linear-gradient(to bottom, #86D54F, #00A5C0)",
        borderColor: "#86D54F",
    },
    2: {
        background: "linear-gradient(to bottom, #EF4A4A, #A42CAC)",
        borderColor: "#EF4A4A",
    },
};
