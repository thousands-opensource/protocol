import { THEME_COLOR_EERIE_BLACK } from "@/constants/constants";
import { ColorObject } from "@/types";
import { getBorderGradient } from "../../../styles";
import { gilroyBlack, gilroyBold } from "@/utils/themeUtil";

const tdAfter = {
    content: "''",
    position: "absolute",
    inset: "0",
    WebkitMask:
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
};

export const tableRowSx = (
    rowUserId: string,
    userId: string,
    rank: number,
    avatarThemeColor: ColorObject
) => ({
    "& > td": {
        py: 1,
        height: "30px",
        border: "transparent",
        fontSize:
            rowUserId === userId
                ? ["11px", "15px", "15px"]
                : ["10px", "14px", "14px"],
        color: "white",
        position: "relative",

        _first: {
            opacity: 1,
            "::after": {
                ...tdAfter,
                padding: "2px 0px 2px 2px",
                borderTopLeftRadius: "8px",
                borderBottomLeftRadius: "8px",
                background:
                    rowUserId === userId
                        ? getBorderGradient(rank, 0, avatarThemeColor)
                        : "transparent",
            },
        },

        "::after": {
            ...tdAfter,
            padding: "2px 0px 2px 0px",
            background:
                rowUserId === userId
                    ? getBorderGradient(rank, 1, avatarThemeColor)
                    : "transparent",
        },

        _last: {
            "::after": {
                ...tdAfter,
                padding: "2px 2px 2px 0px",
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                background:
                    rowUserId === userId
                        ? getBorderGradient(rank, 2, avatarThemeColor)
                        : "transparent",
            },
        },
    },
    "&&": {
        _even: {
            backgroundColor:
                rowUserId === userId ? "transparent" : THEME_COLOR_EERIE_BLACK,
        },
    },
    textTransform: "uppercase",
    fontFamily:
        rowUserId === userId
            ? gilroyBlack.style.fontFamily
            : gilroyBold.style.fontFamily,
    cursor: "pointer",
});

export const trophyTableCellSx = {
    width: "40px",
    px: 1,
};

export const trophySx = {
    width: ["25px", "30px", "30px"],
};

export const rankTableCellSx = {
    ps: 2.5,
    pe: [3, 6],
    width: ["40px", "80px"],
};

export const playerTableCellSx = {
    ps: 0,
    pe: [3, 6],
    display: "flex",
    alignItems: "center",
    gap: [1, 2],
};

export const scoreTableCellSx = {
    ps: 0,
    pe: [3, 6],
    width: "60px",
};
