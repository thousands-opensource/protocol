import { THEME_COLOR_ONYX } from "@/constants/constants";
import { gilroyMedium } from "@/utils/themeUtil";

export const currentLeaderboardContainerSx = {
    flexDir: "column",
    width: ["100%", "100%", "100%", "md", "md", "xl"],
    minHeight: "300px",
};

export const currentLeaderboardHeaderContainerSx = {
    justifyContent: "space-between",
    borderBottom: "transparent",
    pb: 2,
};

export const currentLeaderboardHeaderSx = {
    display: "flex",
    alignItems: "center",
    gap: 3,
};

export const currentLeaderboardBadgeSx = {
    h: [25, 25, 25, 10],
    w: [25, 25, 25, 10],
};

export const currentLeaderboardHeaderTitleContainerSx = {
    flexDir: "column",
    alignItems: "flex-start",
};

export const currentLeaderboardHeaderTitleSx = {
    fontSize: ["2xs", "xs", "xs", "sm"],
};

export const currentLeaderboardInfoBtnSx = {
    textTransform: "uppercase",
    fontSize: ["2xs", "xs", "xs", "sm"],
    justifyContent: "flex-start",
};

export const currentLeaderboardPaginationContainerSx = {
    alignItems: "center",
    textTransform: "none",
};

export const currentLeaderboardSubHeaderContainerSx = {
    borderTop: "1px solid black",
    justifyContent: "space-between",
};

export const currentLeaderboardSubHeaderSx = {
    display: "flex",
    alignItems: "center",
    gap: 3,
    my: [3, 3, 3, 6],
    ml: [3, 0, 0, 2, 2],
    width: "100%",
};

export const currentLeaderboardSubHeaderDescriptionContainerSx = {
    flexDir: "column",
    alignItems: "flex-start",
    gap: [2, 2, 2, 5],
    flexGrow: 1,
};

export const currentLeaderboardSubHeaderDescriptionTitleSx = {
    color: "var(--chakra-colors-gray-500)",
    fontSize: ["xs", "xs", "xs", "md"],
    textTransform: "uppercase",
};

export const currentLeaderboardSubHeaderDescriptionSx = {
    textWrap: "balance",
    fontSize: ["2xs", "2xs", "2xs", "xs"],
    wordWrap: "break-word",
    overflowWrap: "break-word",
    fontFamily: gilroyMedium.style.fontFamily,
};

export const currentLeaderboardGridSx = {
    gap: 2,
    my: 2,
    w: "100%",
};

export const currentLeaderboardGridItemSx = {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: "2xs",
    fontFamily: gilroyMedium.style.fontFamily,
    textTransform: "uppercase",
    mx: 2,
};

export const currentLeaderboardGridItemLabelSx = {
    h: "40px",
    p: 1,
    fontSize: ["11px", "11px", "11px"],
    backgroundColor: THEME_COLOR_ONYX,
    textTransform: "uppercase",
    display: "flex",
    flexDir: "column",
    justifyContent: "center",
    alignItems: "center",
    w: "100%",
};

export const currentLeaderboardGridItemFlexSx = {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    paddingRight: "5px",
    paddingLeft: "5px",
};

export const currentLeaderboardGridItemBoxSx = {
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    paddingRight: "5px",
    alignItems: "center",
    flex: 1,
    minW: 0,
};

export const currentLeaderboardGridItemScoringTypeTextSx = {
    maxWidth: "130px",
    alignSelf: "center",
};

export const currentLeaderboardGridItemValueSx = {
    display: "inline-block",
    verticalAlign: "text-top",
    lineHeight: 1.2,
    fontSize: ["9px", "11px", "11px"],
};

export const currentLeaderboardSubHeaderLearnMoreSx = {
    textTransform: "uppercase",
    lineHeight: 1,
    _hover: { opacity: 0.3 },
};

export const currentLeaderboardBoxScoringTypeSx = {
    alignSelf: "center",
};

export const currentLeaderboardTextScoringTypeSx = {
    textAlign: "right",
};
