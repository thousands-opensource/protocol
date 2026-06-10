import { ColorObject } from "@/types";
import { getAvatarThemeColor } from "@/utils/themeUtil";

export const leaderboardContainerSx = {
    w: "100%",
    flexDir: "column",
};

export const myRankingContainerSx = {
    p: [4, 4, 4, 0],
    pt: [0, 0, 0, 0],
    pb: [0, 0, 0, 0],
    mt: 6,
    mb: 9,
    flexDir: "column",
    gap: [6, 8, 8, 8],
};

export const myRankingWrapperSx = {
    flexDir: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: [6, 8, 8, 5],
};

export const currentLeaderboardContainerSx = {
    flexDir: "column",
    mb: 6,
};

export const tableContainerSx = {
    display: "flex",
    flexDir: ["column", "column", "column", "row"],
    justifyContent: "space-between",
    overflow: "hidden",
    flexWrap: "wrap",
    rowGap: 10,
    px: [4, 4, 4, 0, 0],
};

const constructBronzeBorderGradient = (index: number) => {
    switch (index) {
        case 0:
            return `linear-gradient(to right, #D0AC7E, #D0AC7E, #916748)`;
        case 1:
            return `linear-gradient(to right, #916748, #916748, #916748)`;
        case 2:
            return `linear-gradient(to right, #916748, #683A25, #683A25)`;
    }
};

const constructSilverBorderGradient = (index: number) => {
    switch (index) {
        case 0:
            return `linear-gradient(to right, #C2C4DA, #C2C4DA, #5B5F75)`;
        case 1:
            return `linear-gradient(to right, #5B5F75, #5B5F75, #5B5F75)`;
        case 2:
            return `linear-gradient(to right, #5B5F75, #888FB6, #888FB6)`;
    }
};

const constructGoldBorderGradient = (index: number) => {
    switch (index) {
        case 0:
            return `linear-gradient(to right, #EED25E, #EED25E, #7D522A)`;
        case 1:
            return `linear-gradient(to right, #7D522A, #7D522A, #7D522A)`;
        case 2:
            return `linear-gradient(to right, #7D522A, #C5A34B, #C5A34B)`;
    }
};

// Keep for reference
const bronzeBorderGradient = `linear-gradient(to right, #D0AC7E, #916748, #683A25, #744229, #A6653A)`;
const silverBorderGradient = `linear-gradient(to right, #C2C4DA, #5B5F75, #888FB6)`;
const goldenBorderGradient = `linear-gradient(to right, #EED25E, #7D522A, #C5A34B)`;

export const getBorderGradient = (
    rank: number,
    index: number,
    avatarThemeColor?: ColorObject
) => {
    switch (rank) {
        case 3:
            return constructBronzeBorderGradient(index);
        case 2:
            return constructSilverBorderGradient(index);
        case 1:
            return constructGoldBorderGradient(index);
        default:
            return `linear-gradient(to right, ${getAvatarThemeColor(
                avatarThemeColor!
            )}, ${getAvatarThemeColor(
                avatarThemeColor!
            )}, ${getAvatarThemeColor(avatarThemeColor!)})`;
    }
};
