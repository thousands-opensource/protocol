import { THEME_COLOR_LIGHT_BLACK_GREY } from "@/constants/constants";
import { wildleagueBold } from "@/utils/themeUtil";
import { SystemStyleObject } from "@chakra-ui/react";
import { getBadgeIconFromLeaderboardList } from "@/utils/util";

interface RankingCardStyles {
    cardSx: SystemStyleObject;
    cardBodySx: (bgColor: string) => SystemStyleObject;
    rankContainerSx: SystemStyleObject;
    rankLabelSx: SystemStyleObject;
    rankSx: (useDarkColor: boolean) => SystemStyleObject;
    scoreSx: SystemStyleObject;
    lowerContainerSx: SystemStyleObject;
    badgeContainerSx: SystemStyleObject;
    getIconSrc: (leaderboardId: string) => string;
    avatarSx: SystemStyleObject;
    leaderboardLabelContainerSx: SystemStyleObject;
    leaderboardLabelSx: SystemStyleObject;
    trophySx: SystemStyleObject;
    rankUpSx: SystemStyleObject;
    rankDownSx: SystemStyleObject;
    kIndicator: SystemStyleObject;
}

export const leaderboardTabStyles: RankingCardStyles = {
    cardSx: {
        w: ["136px", "136px", "136px", "194px"],
        h: ["115px", "115px", "115px", "175px"],
        position: "relative",
        backgroundColor: "transparent",
    },
    cardBodySx: (bgColor: string) => ({
        backgroundColor: bgColor,
        borderRadius: ["12px", "12px", "12px", "16px"],
        p: 0,
        display: "flex",
        flexDir: "column",
        alignItems: "flex-start",
    }),
    rankContainerSx: { px: [2, 2, 2, 4], pt: 1 },
    rankLabelSx: {
        fontSize: ["9px", "9px", "9px", "sm"],
        color: THEME_COLOR_LIGHT_BLACK_GREY,
    },
    rankSx: (useDarkColor: boolean) => ({
        lineHeight: 1,
        fontFamily: wildleagueBold.style.fontFamily,
        color: useDarkColor ? "black" : "white",
        opacity: useDarkColor ? 0.3 : 1,
        fontSize: ["64px", "64px", "64px", "89px"],
        height: ["54px", "54px", "54px", "74px"],
    }),
    scoreSx: { fontSize: ["9px", "9px", "9px", "sm"], color: "white" },
    lowerContainerSx: {
        borderTop: "1px solid white",
        alignItems: "center",
        flexGrow: 1,
        w: "100%",
        h: "100%",
    },
    badgeContainerSx: {
        h: "inherit",
        minW: [12, 12, 12, 20],
        justifyContent: "center",
        alignItems: "center",
        borderRight: ".5px solid white",
        backgroundColor: "black",
        borderBottomLeftRadius: ["12px", "12px", "12px", "16px"],
    },
    getIconSrc: (leaderboardId: string) => {
        return getBadgeIconFromLeaderboardList(leaderboardId);
    },
    avatarSx: {
        height: [5, 5, 5, 10],
        width: [5, 5, 5, 10],
    },
    leaderboardLabelContainerSx: {
        h: "inherit",
        alignItems: "center",
        borderLeft: ".5px solid white",
        borderBottomRightRadius: ["12px", "12px", "12px", "16px"],
        backgroundColor: "blackAlpha.500",
        flexGrow: 1,
    },
    leaderboardLabelSx: {
        fontSize: ["9px", "9px", "9px", "sm"],
        display: "inline-block",
        verticalAlign: "text-top",
        color: "white",
        whiteSpace: "wrap",
        ps: ["5px", "5px", "5px", "10px"],
        lineHeight: 1.25,
        flexGrow: 1,
    },
    trophySx: {
        position: "absolute",
        height: "25%",
        top: ["-14px", "-14px", "-14px", "-14%"],
        right: ["35%", "35%", "35%", "35%"],
    },
    rankUpSx: {
        position: "absolute",
        height: ["14px", "14px", "14px", "20px"],
        top: ["16%", "16%", "16%", "15%"],
        right: "6%",
    },
    rankDownSx: {
        position: "absolute",
        height: ["14px", "14px", "14px", "20px"],
        top: ["16%", "16%", "16%", "15%"],
        right: "6%",
    },
    kIndicator: {
        position: "absolute",
        top: ["29px", "29px", "29px", "25%"],
        right: ["2%", "2%", "2%", "3%"],
        color: "white",
        fontSize: ["37px", "37px", "37px", "48px"],
    },
};

export const mainTabStyles: RankingCardStyles = {
    cardSx: {
        w: ["110px", "136px", "136px"],
        h: ["94px", "106px", "106px"],
        position: "relative",
        backgroundColor: "transparent",
    },
    cardBodySx: (bgColor: string) => ({
        backgroundColor: bgColor,
        borderRadius: "12px",
        p: 0,
        display: "flex",
        flexDir: "column",
        alignItems: "flex-start",
    }),
    rankContainerSx: {
        px: 2,
        pt: 1,
    },
    rankLabelSx: {
        fontSize: "9px",
        color: THEME_COLOR_LIGHT_BLACK_GREY,
    },
    rankSx: (useDarkColor: boolean) => ({
        lineHeight: 1,
        fontFamily: wildleagueBold.style.fontFamily,
        color: useDarkColor ? "black" : "white",
        opacity: useDarkColor ? 0.3 : 1,
        fontSize: ["50px", "64px", "64px"],
        height: ["45px", "58px", "58px"],
    }),
    scoreSx: { fontSize: "9px", color: "white" },
    lowerContainerSx: {
        borderTop: "1px solid white",
        alignItems: "center",
        flexGrow: 1,
        w: "100%",
        h: "100%",
    },
    badgeContainerSx: {
        h: "inherit",
        minW: 12,
        justifyContent: "center",
        alignItems: "center",
        borderRight: ".5px solid white",
        backgroundColor: "black",
        borderBottomLeftRadius: "12px",
    },
    getIconSrc: (leaderboardId: string) => {
        return getBadgeIconFromLeaderboardList(leaderboardId, true);
    },
    avatarSx: {
        height: "22px",
        width: "22px",
    },
    leaderboardLabelContainerSx: {
        h: "inherit",
        alignItems: "center",
        borderLeft: ".5px solid white",
        borderBottomRightRadius: "12px",
        backgroundColor: "blackAlpha.500",
        flexGrow: 1,
    },
    leaderboardLabelSx: {
        fontSize: "10px",
        display: "inline-block",
        verticalAlign: "text-top",
        color: "white",
        whiteSpace: "wrap",
        ps: "5px",
        lineHeight: 1.25,
    },
    trophySx: {
        position: "absolute",
        height: ["29%", "25%", "25%"],
        top: ["-14px", "-14px", "-14px", "-14%"],
        right: ["35%", "35%", "35%", "35%"],
    },
    rankUpSx: {
        position: "absolute",
        height: "14px",
        top: ["17%", "16%", "16%"],
        right: "6%",
    },
    rankDownSx: {
        position: "absolute",
        height: "14px",
        top: ["17%", "16%", "16%"],
        right: "6%",
    },
    kIndicator: {
        position: "absolute",
        top: ["32%", "30%", "30%"],
        right: ["4%", "2%", "2%"],
        color: "white",
        fontSize: ["27px", "37px", "37px"],
    },
};
