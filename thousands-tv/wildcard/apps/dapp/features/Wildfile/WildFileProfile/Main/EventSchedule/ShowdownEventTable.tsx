import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import {
    THEME_COLOR_CLOUD_GREY,
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_SILVER,
} from "@/constants/constants";
import { gilroyBlack, gilroyBold } from "@/utils/themeUtil";
import {
    TableContainer,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Text,
    TableCaption,
} from "@chakra-ui/react";
import LilPudgy from "@/public/images/WildfileAssets/lilPudgy.svg";
import Valhalla from "@/public/images/WildfileAssets/valhalla.svg";
import { IUser } from "@repo/interfaces";
import { ShowdownEvent } from "@/db/schemas/showdownSchema";

export const UPCOMING_SHOWDOWN_EVENT_HEADERS = [
    { label: "Time", pl: 20 },
    { label: "Event" },
    { label: "Points", pl: 0 },
    { label: "" },
];

export const PAST_SHOWDOWN_EVENT_HEADERS = [
    { label: "Time", pl: 20 },
    { label: "Event" },
    { label: "Points", pl: 0 },
    { label: "" },
];

interface ShowdownEventTableProps {
    rows: ShowdownEvent[];
    user: IUser;
    isPastShowdownEvents: boolean;
    title?: string;
}

const ShowdownEventTable = ({
    rows,
    user,
    isPastShowdownEvents,
}: ShowdownEventTableProps) => {
    const headers = isPastShowdownEvents
        ? PAST_SHOWDOWN_EVENT_HEADERS
        : UPCOMING_SHOWDOWN_EVENT_HEADERS;

    const renderCaptions = () => {
        if (rows.length > 0) {
            return null;
        }

        return <TableCaption>None</TableCaption>;
    };

    return (
        <TableContainer>
            <Table
                variant="simple"
                fontSize={{ xl: "sm", "2xl": "md" }}
                color="gray.600"
                textTransform={"uppercase"}
                className={gilroyBlack.className}
                size="sm"
            >
                {renderCaptions()}
                <Thead>
                    <Tr borderTop={"1px solid var(--chakra-colors-gray-100)"}>
                        {headers.map((header, index) => {
                            return (
                                <Th
                                    key={index}
                                    fontSize={{
                                        base: "9px",
                                        md: "sm",
                                        xl: "sm",
                                        "2xl": "md",
                                    }}
                                    _first={{
                                        width: "50px",
                                        paddingInlineStart: {
                                            lg: "var(--chakra-space-20)",
                                        },
                                    }}
                                    whiteSpace="normal"
                                    width={{
                                        base: "250px",
                                        sm: "250px",
                                        md: "250px",
                                        lg: "200px",
                                    }}
                                    css={{
                                        ":nth-of-type(3)": {
                                            width: "50px",
                                            textAlign: "center",
                                            padding: 0,
                                        },
                                    }}
                                    _last={{
                                        width: { base: "100px", md: "40px" },
                                        textAlign: "center",
                                        padding: { base: 8, md: 0 },
                                    }}
                                >
                                    {header.label}
                                </Th>
                            );
                        })}
                    </Tr>
                </Thead>
                <Tbody
                    css={{
                        "& tr:nth-of-type(even) td": {
                            background: THEME_COLOR_SILVER,
                        },
                        "& tr:last-child td": {
                            borderBottom: "none",
                        },
                        "& tr:first-of-type": {
                            color: isPastShowdownEvents
                                ? THEME_COLOR_CLOUD_GREY
                                : THEME_COLOR_DARK_GOLD,
                        },
                    }}
                >
                    {rows.map((row: ShowdownEvent, index) => {
                        const date = new Date(row.scheduledStartTime);
                        const dateStr = date
                            .toLocaleDateString()
                            .replace(/\//g, ".");
                        const timeStr = date.toLocaleTimeString("en-us", {
                            timeZoneName: "short",
                            hour: "numeric",
                            minute: "2-digit",
                        });

                        let teamSelection = "";
                        let points = "-";
                        let hasAttendedShowdownEvent = false;
                        if (row.status === "scheduled") {
                            points = row.points.toString();
                        }

                        if (row.status === "completed") {
                            if (
                                row.team1Selections &&
                                row.team1Selections.includes(
                                    user?.discordProvider?.discordTag || ""
                                )
                            ) {
                                teamSelection = LilPudgy.src;
                                hasAttendedShowdownEvent = true;
                            }

                            if (
                                row.team2Selections &&
                                row.team2Selections.includes(
                                    user?.discordProvider?.discordTag || ""
                                )
                            ) {
                                teamSelection = Valhalla.src;
                                hasAttendedShowdownEvent = true;
                            }
                        }

                        if (hasAttendedShowdownEvent) {
                            points = "+" + row.points.toString();
                        }

                        return (
                            <Tr
                                key={index}
                                whiteSpace="normal"
                                css={{
                                    "& td p": {
                                        color: THEME_COLOR_CLOUD_GREY,
                                        opacity: isPastShowdownEvents
                                            ? hasAttendedShowdownEvent
                                                ? 1
                                                : 0.5
                                            : 1,
                                    },
                                }}
                            >
                                <Td
                                    _first={{
                                        paddingInlineStart: {
                                            lg: "var(--chakra-space-20)",
                                        },
                                    }}
                                    fontSize={{
                                        base: "8px",
                                        md: "sm",
                                        xl: "sm",
                                        "2xl": "md",
                                    }}
                                >
                                    <Text>{`${dateStr} ${timeStr}`}</Text>
                                </Td>
                                <Td
                                    className={gilroyBold.className}
                                    fontSize={{
                                        base: "8px",
                                        md: "sm",
                                        xl: "sm",
                                        "2xl": "md",
                                    }}
                                >
                                    <Text>
                                        {" "}
                                        {row.name}-{row.description}
                                    </Text>
                                </Td>
                                <Td
                                    textAlign={"center"}
                                    fontSize={{
                                        base: "9px",
                                        md: "sm",
                                        xl: "sm",
                                        "2xl": "md",
                                    }}
                                >
                                    <Text> {points}</Text>
                                </Td>
                                {isPastShowdownEvents && teamSelection ? (
                                    <Td
                                        display="flex"
                                        justifyContent={"center"}
                                        alignItems="center"
                                    >
                                        <ChakraNextImageSimple
                                            src={teamSelection}
                                            alt="team selected"
                                            width={"12"}
                                            height={"12"}
                                            priority
                                            sx={{
                                                h: { base: "3rem", md: "3rem" },
                                                w: { base: "3rem", md: "3rem" },
                                            }}
                                        />
                                    </Td>
                                ) : (
                                    <Td></Td>
                                )}
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
export default ShowdownEventTable;
