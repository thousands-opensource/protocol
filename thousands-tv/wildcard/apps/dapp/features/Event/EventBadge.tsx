import React from "react";
import { Box, Image } from "@chakra-ui/react";
import { EventStatus } from "./types";

interface EventBadgeProps {
    eventType: EventStatus;
}

/**
 * Event Badge Component
 */
const EventBadge: React.FC<EventBadgeProps> = ({ eventType }) => {
    let imagePath = "";
    let imageWidth = "75px";

    switch (eventType) {
        case EventStatus.LIVE:
            imagePath = "/images/Events/svg/live.svg";
            break;
        case EventStatus.NEXT_EVENT:
            imagePath = "/images/Events/svg/next-event.svg";
            imageWidth = "148px";
            break;
        default:
            return null;
    }

    return (
        <Box position="absolute" top="10px" left="-10px">
            <Image
                src={imagePath}
                alt={`${eventType} Event Badge`}
                w={imageWidth}
            />
        </Box>
    );
};

export default EventBadge;
