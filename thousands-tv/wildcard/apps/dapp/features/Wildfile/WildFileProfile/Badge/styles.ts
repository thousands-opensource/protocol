const badgeDetailsWrapperSx = {
    flexDir: "column",
    alignItems: "center",
};

const badgeContainerSx = {
    p: [4, 4, 4, 0],
    pt: [0, 0, 0, 0],
    pb: [0, 0, 0, 0],
    mt: 6,
    mb: 9,
    flexDir: "column",
    gap: [4, 4, 4, 8],
};

const badgeListFlexContainerSx = {
    display: "flex",
    flexDir: "column",
    gap: "5",
    flexGrow: [1, 1, 1, 0],
};

const badgeAllSx = {
    fontSize: "14px",
    color: "var(--chakra-colors-gray-500)",
};

const badgeLengthSx = {
    fontSize: "12px",
    color: "var(--chakra-colors-gray-500)",
};

const badgeListSx = {
    rowGap: [3, 3, 3, 3, 3],
    mr: [0, 0, 0, "52px"],
    gridTemplateColumns: [
        "repeat(3, 87px)",
        "repeat(auto-fit, 135px)",
        "repeat(auto-fit, 145px)",
        "repeat(4, 140px)",
        "repeat(4, 140px)",
        "repeat(5, 140px)",
    ],
};

export {
    badgeContainerSx,
    badgeListFlexContainerSx,
    badgeAllSx,
    badgeLengthSx,
    badgeListSx,
    badgeDetailsWrapperSx,
};
