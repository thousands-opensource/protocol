import { IMetric, WildcardApiResponse } from "@repo/interfaces";
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
import CustomizedAxisTick from "./CustomizedAxisTick";
import { useEffect, useMemo, useState } from "react";
import { Skeleton, useToast } from "@chakra-ui/react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { filterByCutoffDate, getNumDisplayIntervalDays } from "../metricsUtils";
import { keyIndicatorsToColorMap } from "../types";

interface AverageDataLineChartProps {
    days: number;
    format: "long";
    // todo: add strict typing
    category: string;
    keyIndicator: string;
    delimiter: string;
    yAxisOptionalText?: string;
}
const AverageDataLineChart = ({
    days,
    category,
    format,
    keyIndicator,
    delimiter,
    yAxisOptionalText,
}: AverageDataLineChartProps) => {
    const [metrics, setMetrics] = useState<IMetric[]>([]);
    const toast = useToast();

    const sortedMetrics = useMemo(() => {
        return filterByCutoffDate(metrics, days);
    }, [days, metrics]);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const { data }: { data: WildcardApiResponse } =
                    await axiosAuthClientInstance.get(
                        `/api/fetchMetrics?category=${category}&format=${format}`
                    );
                if (!data.success) {
                    toast({
                        description: `Unable to fetch metrics by ${category}`,
                        status: "error",
                        duration: 5000,
                        position: "top",
                    });
                    return;
                }

                setMetrics(data.data);
            } catch (e: any) {
                const msg = `Error - Failed to fetch metrics by ${category}`;
                console.log(msg, e);
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

    if (!sortedMetrics || sortedMetrics.length <= 0) {
        return <Skeleton height={"100%"} width={"100%"} />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={sortedMetrics}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 10,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="timestamp"
                    height={50}
                    // stroke="#82ca9d"
                    tick={<CustomizedAxisTick />}
                    interval={getNumDisplayIntervalDays(days)}
                />
                <YAxis /* stroke="#8884d8" */ />
                <Tooltip
                    labelStyle={{ color: "black" }}
                    labelFormatter={(label) => {
                        // X-Axis Label
                        return new Date(label).toUTCString();
                    }}
                    formatter={(value, name, entry) => {
                        // Y-Axis Label
                        return [`${value} ${yAxisOptionalText}`, name];
                    }}
                />
                <Legend
                    formatter={(value, entry, index) => {
                        // Legend Label
                        return value;
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={keyIndicatorsToColorMap[keyIndicator]}
                    name={keyIndicator
                        .replace(delimiter, "")
                        .split(/(?=[A-Z])/)
                        .join(" ")
                        .toLowerCase()}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default AverageDataLineChart;
