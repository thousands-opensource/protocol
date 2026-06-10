import {
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_BRONZE,
} from "@/constants/constants";

const circularStepBaseSx = {
    w: {
        base: 8,
        sm: 8,
        md: 8,
        lg: 8,
        xl: 10,
        "2xl": 10,
    },
    h: {
        base: 8,
        sm: 8,
        md: 8,
        lg: 8,
        xl: 10,
        "2xl": 10,
    },
    borderRadius: "full",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

export const circularStepUncompletedSx = {
    ...circularStepBaseSx,
};

export const circularStepCompleteSx = {
    ...circularStepBaseSx,
    bgGradient: `linear(to-r, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_BRONZE})`,
};

export const circularStepTextSx = {
    fontSize: {
        circularStepCenterSxlg: "lg",
        xl: "xl",
        "2xl": "xl",
    },
};

export const circularStepContainerSx = {
    base: 8,
    sm: 8,
    md: 8,
    lg: 8,
    xl: 10,
    "2xl": 10,
};

export const circularStepCenterSx = {
    borderRadius: "100px",
};
