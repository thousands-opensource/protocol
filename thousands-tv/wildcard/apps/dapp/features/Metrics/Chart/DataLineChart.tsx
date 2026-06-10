import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Line,
    LineChart,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { Skeleton, useToast } from "@chakra-ui/react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import CustomizedAxisTick from "./CustomizedAxisTick";
import {
    filterByCutoffDate,
    formatKeyIndicator,
    getNumDisplayIntervalDays,
} from "../metricsUtils";
import { IMetric, IWideMetric, WildcardApiResponse } from "@repo/interfaces";
import {
    Category,
    fallBackKeyIndicatorColor,
    KeyIndicatorOption,
    keyIndicatorsToColorMap,
} from "../types";
import { MultiValue } from "react-select";

interface DataLineChartProps {
    days: number;
    category: Category;
    categoryKey: string;
    selectedKeyIndicators: MultiValue<KeyIndicatorOption>;
}

const DataLineChart = ({
    days,
    category,
    categoryKey,
    selectedKeyIndicators,
}: DataLineChartProps) => {
    const { format, delimiter, keyIndicators, yAxisOptionalText } = category;
    const [metrics, setMetrics] = useState<IMetric[] | IWideMetric[]>([]);
    const toast = useToast();

    const sortedMetrics = useMemo(() => {
        return filterByCutoffDate(metrics, days);
    }, [metrics, days]);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const { data }: { data: WildcardApiResponse } =
                    await axiosAuthClientInstance.get(
                        `/api/fetchMetrics?category=${categoryKey}&format=${format}`
                    );
                if (!data.success) {
                    toast({
                        description: `Unable to fetch metrics by ${categoryKey}`,
                        status: "error",
                        duration: 5000,
                        position: "top",
                    });
                    return;
                }
                setMetrics(data.data);
            } catch (e: any) {
                const msg = `Error - Failed to fetch metrics by ${categoryKey}`;
                console.error(msg, e);
                toast({
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
            }
        };
        fetchMetrics();
    }, [category, format]);

    const renderKeyIndicatorLines = (
        format: "long" | "wide",
        keyIndicators: string | string[],
        selectedKeyIndicators: MultiValue<KeyIndicatorOption>,
        delimiter: string
    ) => {
        if (format === "long") {
            const keyIndicator = keyIndicators as string;
            return (
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                        keyIndicatorsToColorMap[keyIndicator] ||
                        fallBackKeyIndicatorColor
                    }
                    name={formatKeyIndicator(keyIndicator, delimiter)}
                />
            );
        }

        if (format === "wide") {
            return selectedKeyIndicators.map((keyIndicator) => (
                <Line
                    key={keyIndicator.value}
                    type="monotone"
                    dataKey={keyIndicator.value}
                    stroke={
                        keyIndicatorsToColorMap[keyIndicator.value] ||
                        fallBackKeyIndicatorColor
                    }
                    name={formatKeyIndicator(keyIndicator.value, delimiter)}
                    connectNulls={false}
                />
            ));
        }

        return null;
    };

    if (!sortedMetrics || sortedMetrics.length <= 0) {
        return <Skeleton height="100%" width="100%" />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={sortedMetrics}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="timestamp"
                    height={50}
                    tick={<CustomizedAxisTick />}
                    interval={getNumDisplayIntervalDays(days)}
                />
                <YAxis stroke={"#dddddd"} />
                <Tooltip
                    labelStyle={{ color: "black" }}
                    labelFormatter={(label) => new Date(label).toUTCString()}
                    formatter={(value, name) => [
                        `${value} ${yAxisOptionalText ?? ""}`,
                        name,
                    ]}
                />
                <Legend />
                {renderKeyIndicatorLines(
                    format,
                    keyIndicators,
                    selectedKeyIndicators,
                    delimiter
                )}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default DataLineChart;
