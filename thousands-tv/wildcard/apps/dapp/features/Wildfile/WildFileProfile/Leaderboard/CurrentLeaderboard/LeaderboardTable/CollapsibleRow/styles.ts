import {
    THEME_COLOR_ONYX,
    THEME_COLOR_STEEL_GREY,
} from "@/constants/constants";

export const collapsibleRowSx = (isOpen: boolean) => {
    return {
        display: "table-row",
        borderTop: isOpen ? `3px solid ${THEME_COLOR_STEEL_GREY}` : "none",
        borderBottom: isOpen ? `3px solid ${THEME_COLOR_STEEL_GREY}` : "none",
    };
};

export const tableDataSx = { py: 0, border: "transparent" };

export const userStatsSx = { py: 2, fontSize: ["xs", "sm", "sm"] };

export const gridSx = { rowGap: 2, columnGap: [2, 2, 4, 4], my: 2 };

export const gridItemSx = {
    w: "100%",
    h: "35px",
    p: 1,
    fontSize: ["8px", "11px", "11px"],
    backgroundColor: THEME_COLOR_ONYX,
    textTransform: "uppercase",
    display: "flex",
    flexDir: "column",
    justifyContent: "center",
    alignItems: "center",
};

export const gridItemValueSx = {
    display: "inline-block",
    verticalAlign: "text-top",
    lineHeight: 1.2,
    fontSize: ["9px", "11px", "11px"],
};

export const visitWildfileContainerSx = {
    py: 2,
};

export const visitWildfileSx = {
    ml: 2,
    cursor: "pointer",
    fontSize: ["xs", "xs", "xs"],
};
