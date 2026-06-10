import {
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getCoreRowModel,
    createColumnHelper,
    getFilteredRowModel,
    flexRender,
    ColumnFiltersState,
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
import axios from "axios";
import { shorten } from "@/utils/util";
import { useRouter } from "next/router";
import { ISeries } from "@repo/interfaces";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { formatRouteConfigUrl } from "@/utils/routeUtil";

interface StageTableProps {}

const SeriesTable: React.FC<StageTableProps> = ({}) => {
    // Create a state variable for the search input
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [allSeriesData, setAllSeriesData] = useState<ISeries[]>([]);
    const [isLoadingSeries, setIsLoadingSeries] = useState(true);

    const router = useRouter();
    const { serverCode } = router.query as { serverCode: string };

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                setIsLoadingSeries(true);

                const response = await axios.post(
                    "/api/series/fetchSeriesByServer",
                    {
                        serverCode,
                    }
                );
                setAllSeriesData(response.data.series);
                setIsLoadingSeries(false);
            } catch (error) {
                console.error("Failed to fetch series data:", error);
            }
            setIsLoadingSeries(false);
        };

        fetchSeries();
    }, [serverCode]);

    const columnHelper = createColumnHelper<ISeries>();
    const columns = [
        columnHelper.accessor("seriesName", {
            header: "Name",
            sortingFn: (rowA, rowB) => {
                return rowA.original.seriesName < rowB.original.seriesName
                    ? -1
                    : 1;
            },
            cell: (info) => {
                const row = info.row.original;
                const seriesId = row._id?.toString() as string;
                const baseUrl =
                    WILDFILE_ROUTES.SERVER.SERIES_DASHBOARD.SERIES.BASE.url;
                const formattedSeriesUrl = formatRouteConfigUrl(baseUrl, {
                    serverCode,
                    serieId: seriesId,
                });
                return (
                    <Flex alignItems="center" gap="10px">
                        <Link href={formattedSeriesUrl}>
                            <IconButton
                                aria-label="Edit event"
                                icon={<EditIcon />}
                                size="xs"
                                variant="outline"
                                color="white"
                            />
                        </Link>
                        <Link href={formattedSeriesUrl}>
                            <Text _hover={{ textDecoration: "underline" }}>
                                {shorten(row.seriesName, {
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
            header: "Series Start",
            cell: (info) => new Date(info.getValue()).toLocaleString(),
        }),
        columnHelper.accessor("endDate", {
            header: "Series End",
            cell: (info) => {
                const value = info.getValue();
                if (!value) {
                    return "N/A";
                }
                return new Date(value).toLocaleString();
            },
        }),
    ];

    const table = useReactTable({
        data: allSeriesData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        initialState: {
            pagination: {
                pageSize: 5,
            },
        },
    });

    if (isLoadingSeries) {
        return (
            <Flex
                flexDirection={"column"}
                justifyContent={"center"}
                alignItems={"center"}
                gap="10px"
            >
                <Spinner />
                <Text>Loading Series...</Text>
            </Flex>
        );
    }

    return (
        <>
            <Box my="10px">
                <Input
                    value={
                        (table
                            .getColumn("seriesName")
                            ?.getFilterValue() as string) ?? ""
                    }
                    onChange={(e) =>
                        table
                            .getColumn("seriesName")
                            ?.setFilterValue(e.target.value)
                    }
                    placeholder="Search by series name"
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

export default SeriesTable;
