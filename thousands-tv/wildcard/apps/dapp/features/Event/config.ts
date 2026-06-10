import { TicketTierType } from "@repo/interfaces";
import { TicketType } from "./constants";
import { EventSection } from "./types";

// Ticket Details - Configuration
export const baseTicketTypes: TicketType[] = [
    {
        id: 1,
        name: "General Admission",
        color: "white",
        imageSrc: "/images/Tickets/ticket-general-admission.webp",
        quantity: 1,
        tier: TicketTierType.GENERAL_ADMISSION,
        creditMultiplier: 1,
    },
    {
        id: 2,
        name: "VIP Organization",
        color: "yellow.400",
        imageSrc: "/images/Tickets/ticket-gold.webp",
        quantity: 1,
        tier: TicketTierType.VIP,
        creditMultiplier: 2,
    },
    {
        id: 3,
        name: "Premium",
        color: "green.400",
        imageSrc: "/images/Tickets/ticket-premium.webp",
        quantity: 1,
        tier: TicketTierType.PREMIUM,
        creditMultiplier: 3,
    },
    {
        id: 4,
        name: "WildPass",
        color: "green.600",
        imageSrc: "/images/Tickets/ticket-vip-green.webp",
        quantity: 1,
        tier: TicketTierType.WILDPASS,
        creditMultiplier: 4,
    },
];

export const CURRENT_SEASON_ID = "6699448b8e40a07c619784c3";

export const eventSections: {
    name: EventSection;
    isComingSoon?: boolean;
    colorScheme: string;
}[] = [
    // { name: EventSection.EVENTS, colorScheme: "#5e75ad" },
    {
        name: EventSection.STAGES,
        colorScheme: "#71787c",
        isComingSoon: false,
    },
    { name: EventSection.BADGES, colorScheme: "#d22d20" },
    { name: EventSection.STORE, colorScheme: "#8e4385" },
    { name: EventSection.LEADERBOARDS, colorScheme: "#7a5e0e" },
];
