import { THEME_COLOR_DARK_GOLD } from "@/constants/constants";

export const buttonColorSelectHover = {
    border: "4px solid ",
    borderRadius: "6px",
    borderColor: "white",
    transform: "scale(1.05)",
    cursor: "pointer",
};

export const themeColorSelectButtonSx = (
    primaryColor: string,
    isSelected: boolean
) => {
    return {
        bg: primaryColor,
        _hover: buttonColorSelectHover,
        minW: "60px",
        minH: "60px",
        ...(isSelected && {
            border: "4px solid",
            borderRadius: "3px",
            borderColor: "white",
        }),
    };
};

export const themeColorSelectParentSx = {
    flexDirection: "column",
    minH: "300px",
};

export const themeColorSelectGridSx = {
    autoRows: "min-content",
    gap: 2,
    justifyContent: "flex-start",
};

export const themeColorSelectGridItemSx = {
    h: "7",
    alignContent: "flex-start",
    alignItems: "flex-start",
    justifyContent: ["center", "center", "flex-start"],
    opacity: 1,
    mb: { base: "40px", sm: 50, md: 50, lg: "40px" },
    cursor: "pointer",
};

export const themeColorTileSx = {
    direction: "row",
    alignItems: "center",
    gap: 2,
};

export const themeColorTextSx = (isSelected: boolean) => {
    return {
        fontSize: ["11px", "sm"],
        fontWeight: "bold",
        textTransform: "uppercase",
        ...(isSelected && {
            underline: "true",
            textDecoration: "underline",
        }),
    };
};

export const themeColorHeaderFlexSx = {
    alignItems: {},
    flexDirection: {},
};

export const themeColorHeaderTextSx = {
    fontSize: "sm",
    textTransform: "uppercase",
    alignItems: {},
    color: THEME_COLOR_DARK_GOLD,
    my: "5px",
};
