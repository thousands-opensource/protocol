export const paginationBtnSx = {
    p: 0,
    minW: "var(--chakra-sizes-4)",
    color: "white",
    opacity: 0.75,
    _hover: { opacity: 1, bgColor: "transparent", transform: "scale(1.5)" },
    _disabled: {
        opacity: 0.4,
        cursor: "not-allowed",
        boxShadow: "var(--chakra-shadows-none)",
        _hover: {
            transform: "none",
        },
    },
};

export const paginationTextSx = {
    border: "1px solid grey",
    borderRadius: "4px",
    px: 2,
    fontSize: "xs",
};
