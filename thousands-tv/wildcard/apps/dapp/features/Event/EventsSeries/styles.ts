import { THEME_COLOR_SECONDARY } from "@/constants";
import { EVENT_IMAGE_WIDTH, EVENTS_PRIMARY_COLOR } from "../constants";
import { THEME_COLOR_SLIGHT_GREY_BACKGROUND } from "@/constants/constants";

export const selectTicketButtonSX = {
    width: "full",
    border: "1px solid",
    color: THEME_COLOR_SECONDARY,
};

export const viewEventButtonSx = {
    width: "fit-content",
    border: "1px solid",
    color: THEME_COLOR_SECONDARY,
    _hover: {
        bg: "blackAlpha.500",
    },
};

export const confirmTicketButtonSX = {
    width: "full",
    border: "1px solid",
    color: "white",
};

// EventCard
export const eventCardSX = {
    width: ["100%", "100%", "100%", "600px"],
    overflow: "hidden",
    color: "white",
    border: "1px solid",
    borderColor: "gray",
    borderRadius: "lg",
};

export const eventCardImageSx = {
    width: "100%",
    borderRadius: "sm",
    objectFit: "cover",
};

export const eventCardFlexSx = {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 2,
};

export const eventHostIconSx = {
    fontSize: "4xl",
    color: "whiteAlpha.500",
};

// EventSeries
export const eventSeriesFlex = {
    flexDirection: "column",
    alignItems: "center",
    padding: [0, 0, "0 var(--chakra-space-4)"],
    h: "100%",
    w: "100%",
};

export const eventTicketSectionFlex = {
    alignSelf: "flex-start",
    mt: "20px",
};

export const eventTicketSectionContentsFlex = {
    flexDirection: "column",
    alignItems: "flex-start",
    ml: "25px",
};

// Left Section Content
export const boxContainerSx = {
    minW: "300px",
    borderRight: "1px",
    borderColor: EVENTS_PRIMARY_COLOR,
    p: 4,
};

export const imageBoxSx = {
    border: "1px solid",
    borderColor: "gray",
    borderRadius: "lg",
};

export const imageSx = {
    borderRadius: "md",
    width: EVENT_IMAGE_WIDTH,
};

export const imageInfoContainerSx = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    p: "5px",
};

export const iconTextContainerSx = {
    flexDirection: "row",
    m: "5px",
    alignItems: "center",
    gap: "1px",
};

export const accordionButtonSx = {
    px: 0,
};

export const accordionPanelSx = {
    pb: 4,
    px: 0,
};

// Tickets Carousel
export const carouselContainerSx = {
    alignItems: "center",
    justifyContent: "center",
    w: "full",
    p: [0, 0, 0, 4],
};

export const arrowButtonSx = (isDisabled: boolean) => ({
    bg: "whiteAlpha.500",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.3 : 1,
    borderRadius: "full",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mr: "10px",
    ml: "10px",
});

export const ticketsContainerSx = (visibleItems: number) => ({
    justifyContent: "center",
    w: ["auto", "auto", "auto", `${visibleItems * 180}px`],
});

export const ticketBoxSx = (isSelected: boolean) => ({
    bg: "blackAlpha.500",
    borderRadius: "md",
    p: 4,
    m: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    border: isSelected ? "2px solid white" : "none",
    cursor: "pointer",
    transition: "all 0.2s",
    _hover: { transform: "scale(1.05)" },
});

export const ticketImageSx = {
    mb: 2,
    borderRadius: "md",
    w: "150px",
    h: "75px",
};

export const ticketNameTextSx = (color: string) => ({
    fontSize: "sm",
    fontWeight: "bold",
    color,
    mb: 1,
});

export const ticketDescriptionTextSx = {
    color: "gray.400",
    fontSize: "xs",
    textAlign: "center",
    mb: 2,
};

export const eventsParentContainerSx = {
    mb: 0,
    mx: 0,
    py: 2,
    minH: "100vh",
    bgColor: THEME_COLOR_SLIGHT_GREY_BACKGROUND,
    padding: 5,
    width: "100%",
    display: "flex",
    maxW: "full",
    textTransform: "capitalize",
    minWidth: "320px",
};

export const confirmButtonSx = {
    bg: "unset",
    border: "1px solid",
    borderColor: THEME_COLOR_SECONDARY,
    size: "md",
    py: "10px",
    px: "50px",
    borderRadius: "3xl",
    w: "fit-content",
    mt: ["2rem", "2rem", "2rem", "auto"],
};

export const selectedCurrentTicketFlexSx = {
    flexDirection: "column",
    alignItems: "center",
};

export const ticketCarouselFlexSx = {
    flexDirection: "row",
    justifyContent: "space-between",
    px: "10px",
    alignItems: "flex-end",
};

export const ticketCarouselContainerSx = {
    flexDirection: "column",
    width: ["100%", "100%", "100%", "600px"],
};
