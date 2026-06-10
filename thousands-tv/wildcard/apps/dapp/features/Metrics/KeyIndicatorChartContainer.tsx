import { useEffect, useMemo, useState } from "react";
import { MultiValue } from "react-select";
import KeyIndicatorSelectControl from "./KeyIndicatorSelectControl";
import {
    Category,
    KeyIndicatorOption,
    MAX_NUM_KEY_INDICATORS_SELECTION,
} from "./types";
import { Flex } from "@chakra-ui/react";
import DataLineChart from "./Chart/DataLineChart";
import { buildKeyIndicatorOptions } from "./metricsUtils";

interface KeyIndicatorChartContainerProps {
    days: number;
    category: Category;
    categoryKey: string;
}
const KeyIndicatorChartContainer = ({
    days,
    category,
    categoryKey,
}: KeyIndicatorChartContainerProps) => {
    const { keyIndicators, delimiter, format, yAxisOptionalText } = category;
    const keyIndicatorValues = useMemo<string[]>(
        () =>
            Array.isArray(keyIndicators) ? keyIndicators : [keyIndicators],
        [keyIndicators]
    );
    const keyIndicatorOptions = useMemo<KeyIndicatorOption[]>(
        () => buildKeyIndicatorOptions(keyIndicatorValues, delimiter),
        [keyIndicatorValues, delimiter]
    );
    const [selectedKeyIndicators, setSelectedKeyIndicators] = useState<
        MultiValue<KeyIndicatorOption>
    >(() => keyIndicatorOptions.slice(0, MAX_NUM_KEY_INDICATORS_SELECTION));

    useEffect(() => {
        const defaultSelection = keyIndicatorOptions.slice(
            0,
            MAX_NUM_KEY_INDICATORS_SELECTION
        );
        setSelectedKeyIndicators((prevSelected) => {
            const hasSameSelection =
                prevSelected.length === defaultSelection.length &&
                prevSelected.every(
                    (option, index) =>
                        option.value === defaultSelection[index]?.value
                );

            return hasSameSelection ? prevSelected : defaultSelection;
        });
    }, [keyIndicatorOptions, categoryKey]);

    return (
        <Flex flexDirection="column" width={"100%"} height={"100%"} gap={4}>
            <KeyIndicatorSelectControl
                keyIndicators={keyIndicatorValues}
                delimiter={delimiter}
                selectedKeyIndicators={selectedKeyIndicators}
                setSelectedKeyIndicators={setSelectedKeyIndicators}
            />
            <DataLineChart
                days={days}
                category={category}
                categoryKey={categoryKey}
                selectedKeyIndicators={selectedKeyIndicators}
            />
        </Flex>
    );
};
export default KeyIndicatorChartContainer;
