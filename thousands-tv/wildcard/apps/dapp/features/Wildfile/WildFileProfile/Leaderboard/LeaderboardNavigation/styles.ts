export const leaderboardNavigation = {
    flexDir: ["column", "column", "column", "row"],
    justifyContent: ["center", "center", "center", "start"],
    alignItems: ["start", "start", "start", "center"],
    p: [4, 4, 4, 0],
    pt: 0,
    pb: 0,
    gap: [2, 4, 4, 6],
    mt: [0, 0, 0, 6],
    mb: [9, 9, 9, 6],
};

export const ghostBtnSx = (selected: boolean) => ({
    textTransform: "uppercase",
    border: "1px",
    _hover: {
        bg: "whiteAlpha.900",
        color: "black",
    },
    bg: selected ? "whiteAlpha.900" : "transparent",
    color: selected ? "black" : "white",
    borderRadius: "md",
    fontSize: ["xs", "xs", "sm", "md"],
    px: "8px",
    height: [5, 5, 6, 6],
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minW: ["5rem"],
    lineHeight: 1,
});

export const btnGroupSx = { columnGap: 3 };
