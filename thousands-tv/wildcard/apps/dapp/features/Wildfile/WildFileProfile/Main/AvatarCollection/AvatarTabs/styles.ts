import {
    THEME_COLOR_SKELETON_START,
    THEME_COLOR_SKELETON_END,
    THEME_COLOR_YELLOW_DARK,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
} from "@/constants/constants";

export const modalButtonSurveySx = {
    bg: "blackAlpha.100",
    border: "1px",
    variant: "ghost",
    _hover: { bg: "whiteAlpha.500" },
    borderRadius: "md",
    textTransform: "uppercase",
    minW: "70px",
};

export const skeletonSx = {
    borderRadius: "3xl",
    "--skeleton-start-color": THEME_COLOR_SKELETON_START,
    "--skeleton-end-color": THEME_COLOR_SKELETON_END,
};

export const infiniteScrollStyle = {
    display: "grid",
    flexGrow: 1,
    rowGap: "1rem",
    justifyItems: "center",
};

export const infiniteScrollLoaderSx = {
    color: THEME_COLOR_YELLOW_DARK,
    mr: 4,
    mt: 5,
};

export const avatarFavoritesHeaderTextSx = {
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
    fontSize: "sm",
    mb: 2,
};

export const avatarFavoriteFlexSx = {
    flexWrap: "wrap",
    minH: "100px",
    justifyContent: "center",
};

export const avatarTabPanelViewPortSx = {
    mt: "5px",
    maxH: ["50vh", "50vh", "50vh", "60vh"],
};

export const avatarGridHeaderTextSx = {
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
    fontSize: "sm",
};

export const avatarTabThemeBodySx = {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
};

export const avatarFavoriteGridSx = {
    flexGrow: 1,
    rowGap: 4,
    justifyItems: "center",
};

export const avatarTabThemeTopTextSx = {
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
    fontSize: ["sm", "sm", "lg", "xl", "xl"],
    textTransform: "uppercase",
    fontWeight: "bold",
};

export const avatarTabButtonSx = {
    flexDirection: "row",
    my: "10px",
    justifyContent: "flex-start",
    alignContent: "center",
    alignItems: "center",
    gap: 3,
};

export const avatarTabSurveyBoxSx = {
    px: 2,
};

export const avatarTabSurveyTextSx = {
    fontSize: ["md", "md", "lg"],
};

export const themeColorHeaderFlexSx = {
    alignItems: {
        base: "flex-start",
        md: "center",
    },
    flexDirection: {
        base: "column",
        md: "row",
    },
    py: "10px",
    mt: "10px",
};

export const themeColorHeaderTextSx = {
    fontSize: "md",
    textTransform: "uppercase",
    alignItems: {
        base: "center",
        md: "flex-start",
    },
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
};
