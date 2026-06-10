import {
    THEME_COLOR_SLIGHT_GREY_BACKGROUND,
    THEME_COLOR_STEEL_GREY,
} from "@/constants/constants";

export const linkSocialContainer = {
    direction: "row",
    alignITems: "center",
    color: "white",
};

export const loginLogoutButton = (isConnected: boolean) => {
    return {
        border: `solid 0.5px ${THEME_COLOR_SLIGHT_GREY_BACKGROUND}`,
        bgColor: THEME_COLOR_STEEL_GREY,
        color: "white",
        mx: "8px",
        mb: ["8px", "0px"],
        cursor: isConnected ? "pointer" : "not-allowed",
        disabled: !isConnected,
        _hover: { opacity: 0.8 },
        _active: { bgColor: THEME_COLOR_STEEL_GREY },
    };
};
