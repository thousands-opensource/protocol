import { THEME_COLOR_BORDER_OUTLINE, THEME_COLOR_SECONDARY } from "@/constants";
import {
    THEME_COLOR_DARK_BAY_BLUE,
    THEME_COLOR_PRIMARY_AZURE,
    THEME_COLOR_STEEL_GREY,
    THEME_COLOR_YELLOW_DARK,
} from "@/constants/constants";

export const navigationBarSx = {
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 2,
};

export const navigationBarFlexSx = (isSquareCorner: boolean) => ({
    alignItems: ["center", "center", "center", "center"],
    pt: 0,
    pb: 0,
    px: [1, 1, 1, 2],
    minH: "60px",
    justifyContent: [
        "flex-end",
        "flex-end",
        "flex-end",
        "space-between",
        "space-between",
    ],
    flexDir: ["row", "row", "row", "row", "row"],
    backgroundColor: "transparent",
});

export const navigationSx = {
    display: "flex",
    alignItems: "center",
    width: ["100%", "100%", "100%", "auto"],

    justifyContent: ["space-between"],
};

export const drawerContentSx = { bgColor: THEME_COLOR_DARK_BAY_BLUE };

export const drawerHeaderSx = { borderBottomWidth: "1px" };

export const drawerHeaderFlexSx = {
    ml: { base: -2 },
    display: { base: "flex", md: "none" },
};

export const hamburgerIconBtnSx = {
    border: "none",
    size: "sm",
};

export const hamburgerIconSx = { color: "white" };

export const wildfileTextSvgSx = {
    marginLeft: "15px",
    width: "100%",
    background: "transparent",
    fontSize: "30px",
};

export const wildfileTextIconSx = {
    ml: 3,
    fontSize: "8xl",
    height: [".5em", ".5em", ".5em", "auto"],
    verticalAlign: "baseline",
};

export const wildfileLogoIconSx = {
    fontSize: "4xl",
};

export const hamburgerMenuFlexSx = {
    display: { base: "flex", lg: "none" },
    color: "white",
};

export const hamburgerMenuIconSx = { color: THEME_COLOR_YELLOW_DARK };

export const dividerSx = { mt: 3, mb: 5 };

export const stackSx = { flexDirection: "row", alignItems: "center" };

export const settingsIconSx = { color: THEME_COLOR_YELLOW_DARK };

export const settingsTextSx = {
    ml: "2 !important",
    fontSize: "lg",
    mt: "0px !important",
    color: THEME_COLOR_YELLOW_DARK,
    textAlign: "left",
};

export const loginLogoutButton = (isConnected: boolean) => {
    return {
        bgColor: THEME_COLOR_PRIMARY_AZURE,
        color: "white",
        mx: "8px",
        mb: "0px",
        cursor: isConnected ? "pointer" : "not-allowed",
        disabled: !isConnected,
        _hover: { opacity: 0.8 },
        _active: { bgColor: THEME_COLOR_STEEL_GREY },
    };
};

export const thousandsSeriesDividerSX = {
    bg: "whiteAlpha.400",
    color: "blue",
    height: "35px",
    mx: "20px",
};

export const thousandsSeriesImageFlexSx = {
    flexDirection: "row",
    alignItems: "center",
    gap: "10px",
};

export const thousandsSeriesNameTextSx = {
    fontSize: "25px",
};

export const customWalletConnectButton = {
    border: "1px solid",
    borderColor: "rgba(255,255,255,0.5)",
    bg: "unset",
};

export const seriesNameTextSx = {
    mt: "-10px",
    textTransform: "uppercase",
    color: "white",
};

export const seriesNameSpinnerSx = {
    size: "sm",
    color: "white",
};

export const serverNavItemSx = (isActive: boolean) => ({
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
    width: "100%",
    py: 1,
    _before: {
        content: '""',
        position: "absolute",
        left: "-8px",
        width: "4px",
        height: isActive ? "40px" : "8px",
        backgroundColor: "white",
        borderRadius: "0 4px 4px 0",
        transition: "all 0.2s ease",
        opacity: isActive ? 1 : 0,
        transform: isActive ? "scale(1)" : "scale(0)",
    },
    _hover: {
        _before: {
            opacity: 1,
            height: isActive ? "40px" : "20px",
            transform: "scale(1)",
        },
        "& > *": {
            transform: "scale(1.05)",
        },
    },
});
