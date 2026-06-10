import { IMetric, IWideMetric, WildcardApiResponse } from "@repo/interfaces";
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
import { KeyIndicatorOption, keyIndicatorsToColorMap } from "../types";
import { MultiValue } from "react-select";
import { filterByCutoffDate, getNumDisplayIntervalDays } from "../metricsUtils";

interface AverageDataLineChartWideFormatProps {
    days: number;
    format: "wide";
    category: string;
    yAxisOptionalText: string;
    selectedKeyIndicators: MultiValue<KeyIndicatorOption>;
    delimiter: string;
}
const AverageDataLineChartWideFormat = ({
    days,
    format,
    category,
    yAxisOptionalText,
    selectedKeyIndicators,
    delimiter,
}: AverageDataLineChartWideFormatProps) => {
    const [metrics, setMetrics] = useState<IWideMetric[]>([]);
    const toast = useToast();

    const sortGroupedWideMetric: any = useMemo(() => {
        return filterByCutoffDate(metrics, days);
    }, [metrics, days]);

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

    if (!sortGroupedWideMetric || sortGroupedWideMetric.length <= 0) {
        return <Skeleton height={"100%"} width={"100%"} />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={sortGroupedWideMetric}
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
                    // type="number"
                    // domain={["auto", "auto"]}
                    tick={<CustomizedAxisTick />}
                    interval={getNumDisplayIntervalDays(days)}
                    // tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                />
                <YAxis stroke="#8884d8" />
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

                {selectedKeyIndicators.map((keyIndicator, idx) => {
                    return (
                        <Line
                            key={keyIndicator.value}
                            type="monotone"
                            dataKey={keyIndicator.value}
                            stroke={keyIndicatorsToColorMap[keyIndicator.value]}
                            // dot={false}
                            name={keyIndicator.value
                                .replace(delimiter, "")
                                .split(/(?=[A-Z])/)
                                .join(" ")
                                .toLowerCase()}
                            connectNulls={false}
                        />
                    );
                })}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default AverageDataLineChartWideFormat;
