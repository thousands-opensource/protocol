import {
    Grid,
    GridItem,
    Stack,
    Text,
} from "@chakra-ui/react";
import { ISponsoredEvent } from "@repo/interfaces";

export type SponsoredEventRow = Pick<
    ISponsoredEvent,
    "name" | "startTime" | "sponsorLockTime"
> & { _id: string };

export interface SponsoredEventsProps {
    sponsoredEvents: SponsoredEventRow[];
    onSelect: (sponsoredEventId: string) => void;
    limit?: number;
}

const SponsoredEvents = ({
    sponsoredEvents,
    onSelect,
    limit,
}: SponsoredEventsProps) => {
    const now = Date.now();
    const eligibleEvents = sponsoredEvents
        .map((event) => {
            const parsed =
                typeof event.startTime === "string"
                    ? new Date(event.startTime)
                    : event.startTime;
            if (Number.isNaN(parsed.getTime())) {
                return null;
            }
            return { event, startTimeMs: parsed.getTime() };
        })
        .filter(
            (
                entry
            ): entry is { event: SponsoredEventRow; startTimeMs: number } =>
                !!entry && entry.startTimeMs >= now
        )
        .sort((a, b) => a.startTimeMs - b.startTimeMs);

    const displayEvents =
        eligibleEvents.length > 0 ? [eligibleEvents[0].event] : [];

    const formatDateTime = (value: string | Date) => {
        if (!value) {
            return "--";
        }

        const parsed = typeof value === "string" ? new Date(value) : value;
        if (Number.isNaN(parsed.getTime())) {
            return "--";
        }

        return parsed.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatEventDateRange = (value: string | Date) => {
        if (!value) {
            return "--";
        }

        const startDate = typeof value === "string" ? new Date(value) : value;
        if (Number.isNaN(startDate.getTime())) {
            return "--";
        }

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const startMonth = startDate.toLocaleString("en-US", {
            month: "short",
        });
        const endMonth = endDate.toLocaleString("en-US", {
            month: "short",
        });
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        if (startMonth === endMonth && startYear === endYear) {
            return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
        }

        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    };

    if (displayEvents.length === 0) {
        return (
            <Text color="whiteAlpha.800" textAlign="center">
                No sponsored events available yet.
            </Text>
        );
    }

    return (
        <Stack spacing={3}>
            <Grid
                templateColumns={{
                    base: "1fr",
                    md: "2fr 1fr 1fr",
                }}
                gap={4}
                px={4}
                py={3}
                color="whiteAlpha.700"
                textTransform="uppercase"
                letterSpacing="0.15em"
                fontSize="sm"
            >
                <GridItem>Name</GridItem>
                <GridItem>Event Date</GridItem>
                <GridItem>Sponsorship Deadline</GridItem>
            </Grid>
            {displayEvents.map((event, index) => (
                <Grid
                    key={`${event.name}-${index}`}
                    templateColumns={{
                        base: "1fr",
                        md: "2fr 1fr 1fr",
                    }}
                    gap={4}
                    px={4}
                    py={3}
                    borderRadius="lg"
                    bg="rgba(255,255,255,0.08)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.1)"
                    cursor="pointer"
                    _hover={{
                        bg: "rgba(255,255,255,0.15)",
                        borderColor:
                            "rgba(255,255,255,0.25)",
                    }}
                    onClick={() => onSelect(event._id)}
                >
                    <GridItem>
                        <Text color="white">{event.name}</Text>
                    </GridItem>
                    <GridItem>
                        <Text color="whiteAlpha.800">
                            {formatEventDateRange(event.startTime)}
                        </Text>
                    </GridItem>
                    <GridItem>
                        <Text color="whiteAlpha.800">
                            {formatDateTime(event.sponsorLockTime)}
                        </Text>
                    </GridItem>
                </Grid>
            ))}
        </Stack>
    );
};

export default SponsoredEvents;
