import {
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getCoreRowModel,
    createColumnHelper,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Link,
    Box,
    Flex,
    IconButton,
    Input,
    Divider,
    Text,
    Spinner,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EditIcon,
} from "@chakra-ui/icons";
import { WILDFILE_ROUTES } from "@/constants/routes";
import axios from "axios";
import { shorten } from "@/utils/util";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { useRouter } from "next/router";
import { IEvent, IStage } from "@repo/interfaces";

interface StageTableProps {
    userRole: string;
}

const StageTable: React.FC<StageTableProps> = ({ userRole }) => {
    // Create a state variable for the search input
    const [filterInput, setFilterInput] = useState<string>("");
    const [allStagesData, setAllStagesData] = useState<IStage[]>([]);
    const [isLoadingStages, setIsLoadingStages] = useState(true);

    const router = useRouter();
    const { serverCode } = router.query as { serverCode: string };

    const getFormattedStageName = (stage: IStage) => {
        const eventName =
            stage.eventId && "eventName" in stage.eventId
                ? stage.eventId.eventName
                : "";

        console.log("eventName", eventName, stage);
        const stageName = stage.name;
        return eventName ? `${eventName}-${stageName}` : stageName;
    };

    useEffect(() => {
        const fetchStages = async () => {
            try {
                setIsLoadingStages(true);

                const response = await axios.post(
                    "/api/stages/fetchStagesByServer",
                    {
                        serverCode: serverCode,
                    }
                );
                setAllStagesData(response.data.stages);
                setIsLoadingStages(false);
            } catch (error) {
                console.error("Failed to fetch calendar data:", error);
            }
            setIsLoadingStages(false);
        };

        fetchStages();
    }, [serverCode]);

    const columnHelper = createColumnHelper<IStage>();
    const columns = [
        columnHelper.accessor("name", {
            header: "Stages",
            sortingFn: (rowA, rowB) => {
                const rowAName = getFormattedStageName(rowA.original);
                const rowBName = getFormattedStageName(rowB.original);
                return rowAName < rowBName ? -1 : 1;
            },
            cell: (info) => {
                const row = info.row.original;
                const formattedName = getFormattedStageName(row);

                const beamableEventId = row.beamableEventId || "";
                const eventRouteUrl =
                    WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.EVENT.BASE.url;
                const editEventRouteUrl =
                    WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.EVENT.EDIT.url;
                const formattedEditEventRouteUrl = formatRouteConfigUrl(
                    editEventRouteUrl,
                    {
                        serverCode,
                        eventId: beamableEventId,
                    }
                );
                const formattedEventRouteUrl = formatRouteConfigUrl(
                    eventRouteUrl,
                    {
                        serverCode,
                        eventId: beamableEventId,
                    }
                );

                return (
                    <Flex alignItems="center" gap="10px">
                        <Link href={formattedEditEventRouteUrl}>
                            {(userRole === "admin" ||
                                userRole === "developer") && (
                                <IconButton
                                    aria-label="Edit event"
                                    icon={<EditIcon />}
                                    size="xs"
                                    variant="outline"
                                    color="white"
                                />
                            )}
                        </Link>
                        <Link href={formattedEventRouteUrl}>
                            <Text _hover={{ textDecoration: "underline" }}>
                                {shorten(formattedName, {
                                    length: 40,
                                    isAddress: false,
                                })}
                            </Text>
                        </Link>
                    </Flex>
                );
            },
        }),
        columnHelper.accessor("startDate", {
            header: "Event Start",
            cell: (info) => new Date(info.getValue()).toLocaleString(),
        }),
        columnHelper.accessor("endDate", {
            header: "Event End",
            cell: (info) => {
                const value = info.getValue();
                if (!value) {
                    return "N/A";
                }
                return new Date(value).toLocaleString();
            },
        }),
        columnHelper.accessor("status", {
            header: "Status",
            cell: (info) => info.getValue(),
        }),
    ];

    const fuzzyFilter = (row: any, columnId: string, value: string) => {
        const itemValue = row.getValue(columnId);
        const eventName = row.original.event?.eventName || "";
        const stageName = itemValue || "";
        const searchStr = `${eventName}:${stageName}`.toLowerCase();

        return searchStr.includes(value.toLowerCase());
    };

    const table = useReactTable({
        data: allStagesData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter: filterInput,
        },
        onGlobalFilterChange: setFilterInput,
        globalFilterFn: fuzzyFilter,
        initialState: {
            pagination: {
                pageSize: 5,
            },
        },
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterInput(e.target.value);
    };

    const isLoadingUserEvents = isLoadingStages;
    if (isLoadingUserEvents) {
        return (
            <Flex
                flexDirection={"column"}
                justifyContent={"center"}
                alignItems={"center"}
                gap="10px"
            >
                <Spinner />
                <Text>Loading Events...</Text>
            </Flex>
        );
    }

    return (
        <>
            <Box my="10px">
                <Input
                    value={filterInput}
                    onChange={handleFilterChange}
                    placeholder="Search by event name"
                    sx={{
                        "::placeholder": {
                            fontSize: "2xl",
                        },
                    }}
                    fontSize={"2xl"}
                    my={4}
                    border="1px solid white"
                />
            </Box>

            <Divider my="10px" />

            <Table>
                <Thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Th
                                    key={header.id}
                                    onClick={header.column.getToggleSortingHandler()}
                                    cursor="pointer"
                                    fontSize={"md"}
                                >
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                    {header.column.getIsSorted() ? (
                                        header.column.getIsSorted() ===
                                        "desc" ? (
                                            <ArrowDownIcon ml={1} />
                                        ) : (
                                            <ArrowUpIcon ml={1} />
                                        )
                                    ) : null}
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </Thead>
                <Tbody>
                    {table.getRowModel().rows.map((row) => (
                        <Tr key={row.id} py="10px">
                            {row.getVisibleCells().map((cell) => (
                                <Td key={cell.id} py="10px">
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <Flex justifyContent="space-between" m={4} alignItems="center">
                <IconButton
                    onClick={() => table.previousPage()}
                    isDisabled={!table.getCanPreviousPage()}
                    bg="glass.bg"
                    border="1px solid white"
                    icon={<ChevronLeftIcon h={6} w={6} />}
                    aria-label="Previous Page"
                />
                <span>
                    Page{" "}
                    <strong>
                        {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </strong>
                </span>
                <IconButton
                    bg="glass.bg"
                    onClick={() => table.nextPage()}
                    isDisabled={!table.getCanNextPage()}
                    icon={<ChevronRightIcon h={6} w={6} />}
                    aria-label="Next Page"
                />
            </Flex>
        </>
    );
};

export default StageTable;
