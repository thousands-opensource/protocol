import {
    THEME_CHARCOAL_BLACK,
    THEME_COLOR_CYAN_BLUE,
    THEME_COLOR_DARK_BRONZE,
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    THEME_COLOR_YELLOW,
} from "@/constants/constants";
import { SystemStyleObject } from "@chakra-ui/react";

export const imgBoxSx = (vertical?: boolean) => {
    return {
        justifyContent: "start",
        height: vertical ? "fit-content" : "100%",
        maxHeight: vertical ? "50%" : "100%",
        width: vertical ? "100%" : "fit-content",
        maxWidth: vertical ? "100%" : "50%",
    };
};

export const wrapCollectionSx = {
    width: "100%",
    height: "100%",
    my: "4px !important",
};

export const setContent = (vertical?: Boolean) => {
    return {
        width: vertical ? "100%" : "49%",
        height: "100%",
        flexGrow: "1",
    };
};

export const title = {
    maxHeight: "25%",
    objectFit: "fill",
    mt: "4px",
};

export const containerVStackSx = {
    w: "100%",
    flexDir: "column",
};

export const containerVStackSmallerSx = {
    minW: "48%",
    maxW: "40%",
    height: "100%",
};

export const bottomRow = {
    minH: "45%",
    w: "100%",
    justifyContent: "space-between",
};

export const collectionSx = (vertical?: boolean) => {
    return {
        width: "100%",
        height: "100%",
        justifyContent: "start",
        padding: "0px",
        flexDirection: vertical ? "column" : "row",
        overflow: "hidden",
        backgroundColor: THEME_CHARCOAL_BLACK,
        borderRadius: "8px",
    };
};

export const trophySx = {
    mr: "10px !important",
    color: "white",
    marginInlineStart: "0 !important",
    _hover: {
        textDecor: "underline",
        color: THEME_COLOR_CYAN_BLUE,
    },
};

export const gradientBoxStyle = (borderColor?: string) => {
    return {
        backgroundClip: "padding-box",
        borderRadius: "10px",
        bgGradient: borderColor
            ? `linear(to-r, ${borderColor}, ${borderColor})`
            : `linear(to-r, ${THEME_COLOR_YELLOW}, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_DARK_BRONZE})`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "4px !important",
        padding: "4px",
    };
};

export const showcaseTabSx: SystemStyleObject = {
    width: ["auto", "auto", "auto", "860px"],
    alignSelf: "center",
};

export const showcaseTabPanelSx: SystemStyleObject = {
    p: [4, 4, 4, 0],
    pt: [0, 0, 0, 0],
};

export const preAlphaFlexWrapperSx: SystemStyleObject = {
    flexDir: "column",
    rowGap: 9,
};
