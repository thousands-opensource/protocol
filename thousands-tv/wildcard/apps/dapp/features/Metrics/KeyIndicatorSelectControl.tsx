import { Flex } from "@chakra-ui/react";
import Select, {
    ActionMeta,
    OnChangeValue,
    StylesConfig,
    MultiValue,
    Options,
} from "react-select";
import { Dispatch, SetStateAction, useState } from "react";
import chroma from "chroma-js";
import { KeyIndicatorOption, MAX_NUM_KEY_INDICATORS_SELECTION } from "./types";
import { buildKeyIndicatorOptions } from "./metricsUtils";

const colourStyles: StylesConfig<KeyIndicatorOption, true> = {
    control: (styles) => ({
        ...styles,
        backgroundColor: "transparent",
        borderRadius: "16px",
    }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        const color = chroma(data.color);
        return {
            ...styles,
            backgroundColor: isDisabled
                ? undefined
                : isSelected
                ? data.color
                : isFocused
                ? color.alpha(0.1).css()
                : undefined,
            color: isDisabled
                ? "#ccc"
                : isSelected
                ? chroma.contrast(color, "white") > 2
                    ? "white"
                    : "black"
                : data.color,
            cursor: isDisabled ? "not-allowed" : "default",

            ":active": {
                ...styles[":active"],
                backgroundColor: !isDisabled
                    ? isSelected
                        ? data.color
                        : color.alpha(0.3).css()
                    : undefined,
            },
        };
    },
    multiValue: (styles, { data }) => {
        const color = chroma(data.color);
        return {
            ...styles,
            backgroundColor: color.alpha(0.1).css(),
        };
    },
    multiValueLabel: (styles, { data }) => ({
        ...styles,
        color: data.color,
    }),
    multiValueRemove: (styles, { data }) => ({
        ...styles,
        color: data.color,
        ":hover": {
            backgroundColor: data.color,
            color: "white",
        },
    }),
};

interface KeyIndicatorSelectControlProps {
    keyIndicators: string[];
    delimiter: string;
    selectedKeyIndicators: MultiValue<KeyIndicatorOption>;
    setSelectedKeyIndicators: Dispatch<
        SetStateAction<MultiValue<KeyIndicatorOption>>
    >;
}

const KeyIndicatorSelectControl = ({
    keyIndicators,
    delimiter,
    selectedKeyIndicators,
    setSelectedKeyIndicators,
}: KeyIndicatorSelectControlProps) => {
    const keyIndicatorOptions = buildKeyIndicatorOptions(
        keyIndicators,
        delimiter
    );

    const toggleKeyIndicator = (
        keyIndicator: MultiValue<KeyIndicatorOption>,
        actionMeta: ActionMeta<KeyIndicatorOption>
    ) => {
        if (
            keyIndicator.length > MAX_NUM_KEY_INDICATORS_SELECTION &&
            actionMeta.action === "select-option"
        ) {
            return;
        }

        setSelectedKeyIndicators([...keyIndicator]);
    };

    return (
        <Select
            options={keyIndicatorOptions}
            value={selectedKeyIndicators}
            onChange={toggleKeyIndicator}
            isMulti
            formatOptionLabel={(option) => (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        cursor:
                            selectedKeyIndicators.length <
                            MAX_NUM_KEY_INDICATORS_SELECTION
                                ? "pointer"
                                : "not-allowed",
                    }}
                >
                    <span
                        style={{
                            backgroundColor: option.color,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            display: "inline-block",
                            marginRight: 8,
                        }}
                    />
                    {option.label}
                </div>
            )}
            getOptionValue={(option) => option.value}
            styles={colourStyles}
        />
    );
};
export default KeyIndicatorSelectControl;
