import { IMetric, IWideMetric } from "@repo/interfaces";
import {
    fallBackKeyIndicatorColor,
    KeyIndicatorOption,
    keyIndicatorsToColorMap,
} from "./types";

export const getNumDisplayIntervalDays = (days: number) => {
    switch (days) {
        case 120:
            return 10;
        case 90:
            return 7;
        case 60:
            return 5;
        case 30:
            return 3;
        case 14:
            return 1;
        default:
            return 0;
    }
};

export const buildKeyIndicatorOptions = (
    keyIndicators: string[],
    delimiter: string
): KeyIndicatorOption[] =>
    keyIndicators.map((key) => ({
        value: key,
        label: capitalizeWords(key.replace(delimiter, "")),
        color: keyIndicatorsToColorMap[key] || fallBackKeyIndicatorColor,
    }));

export const filterByCutoffDate = (
    metrics: IMetric[] | IWideMetric[],
    days: number
) => {
    const cutoffDate = new Date();
    cutoffDate.setUTCHours(0, 0, 0, 0);
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - days);

    return metrics.filter(
        (metric) => new Date(metric.timestamp).getTime() >= cutoffDate.getTime()
    );
};

export const getSecondsRemainingTodayUTC = () => {
    const now = new Date();

    const endOfTodayUTC = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0,
            0,
            0,
            0
        )
    );
    const diffMs = endOfTodayUTC.getTime() - now.getTime();
    return Math.floor(diffMs / 1000);
};

export const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

export const formatKeyIndicator = (keyIndicator: string, delimiter: string) => {
    return capitalizeWords(keyIndicator
            .replace(delimiter, "")
            .split(/(?=[A-Z])/)
            .join(" ")
            .toLowerCase());
};
