import {
    THEME_COLOR_CYAN_BLUE,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
} from "@/constants/constants";

export const editAvatarButtonSx = {
    _hover: {
        textDecor: "underline",
        color: THEME_COLOR_CYAN_BLUE,
    },
    "& p": {
        "&:hover": {
            color: THEME_COLOR_CYAN_BLUE,
        },
    },
};

export const editAvatarFlexSx = {
    flexDirection: "row",
    justifyContent: ["center"],
};

export const selectAvatarFlex = {
    flexDir: "row",
    justifyContent: "space-between",
};

export const selectAvatarSx = {
    h: "auto",
};

/**
 * customized styling theme for modal
 */
export const modalStyle = {
    p: 5,
    bg: "rgba(43, 44, 48, 0.9)",
    color: "white",
    border: "2px solid var(--chakra-colors-brandDark-300)",
    borderRadius: "10px",
    overflowX: "hidden",
    minHeight: "full",
    minWidth: ["320px", "auto", "auto ", "100%"],
    px: "10px",
};

/**
 * Modal save button styling
 */
export const modalSaveButtonStyle = {
    bg: "blackAlpha.100",
    border: "1px",
    variant: "ghost",
    _hover: { bg: "whiteAlpha.500" },
    borderRadius: "md",
    textTransform: "uppercase",
};

/**
 * Modal back button styling
 */
export const modalBackButtonStyle = {
    background: "transparent",
    p: 0,
    fontSize: "xl",
    "&:hover": {
        bg: "gray.700",
        color: "white",
        background: "transparent",
        transform: "scale(1.1)",
    },
    "&:active": {
        bg: "gray.800",
    },
};

export const closeButtonIcon = {
    fontSize: "sm",
};

export const iconButtonWrapper = {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    mb: 7,
};

export const modalFooterFlexSx = {
    flexDirection: "row",
    mt: [{ base: 0, sm: 70, md: 70, lg: "4px", xl: "4px" }],
    ml: "-3px",
    w: "100%",
    justifyContent: [
        "space-between",
        "space-between",
        "space-between",
        "center",
    ],
    alignItems: "center",
    gap: ["0px", "0px", "0px", "10px"],
};

/**
 * Custom styling for modal tabs highlight active when selected
 */
export const modalTabButtonSx = (buttonSelected: boolean) => {
    return {
        textTransform: "uppercase",
        border: "1px",
        _hover: { bg: "whiteAlpha.900", color: "black" },
        bg: buttonSelected ? "whiteAlpha.900" : "",
        color: buttonSelected ? "black" : "",
        borderRadius: "md",
        fontSize: "sm",
        px: "8px",
        height: 8,
    };
};

export const dividerSx = {
    height: "5px",
    my: ["5px", "5px", "5px", "5px", "10px"],
    borderColor: "white",
};

export const modalOverlaySx = {
    bg: "blackAlpha.800",
};

export const modalBody = {
    display: "flex",
    flexDirection: "column",
    p: 0,
};

export const modalBodyFlexSx = {
    justifyContent: ["start"],
    alignItems: ["center", "center", "center", "flex-start"],
    p: ["10px", "10px", "10px", "5px"],
    overflow: "auto",
    width: ["auto", "auto", "auto", "45%"],
    marginLeft: "10px",
    flexDirection: "column",
};

export const modalBodyContentsFlexSx = {
    overflow: "auto",
    flexDirection: "column",
    marginTop: "10px",
};

export const avatarTabHeaderFlexSx = {
    justifyContent: "flex-end",
    gap: 2,
    p: "0 16px 0",
};

export const editAvatarIconSx = {
    fontSize: "md",
};

export const editAvatarIconTextSx = {
    fontSize: "sm",
    textTransform: "uppercase",
};

export const popoverTextSx = {
    textTransform: "uppercase",
};

export const popoverLinkSx = {
    fontWeight: "extrabold",
    color: "white",
};

export const modalBodyContainerFlexSx = {
    flexDirection: ["column", "column", "column", "row"],
    justifyContent: ["flex-start", "flex-start", "flex-start", "center"],
    width: "100%",
    overflow: "hidden",
};

export const avatarContainerFlexSx = {
    maxH: "100%",
    p: "5px",
    width: ["100%", "100%", "100%", "45%"],
    alignItems: ["center", "center", "center", "end"],
    justifyContent: "center",
    flexDirection: "column",
    zIndex: 1,
    position: "sticky",
    mb: "20px",
};

export const avatarContainerTopFlexSx = {
    flexDirection: "row",
    justifyContent: "space-between",
    pt: "15px",
    alignItems: "center",
    float: "right",
    maxWidth: ["100%", "100%", "100%", "300px"],
    width: ["100%", "100%", "100%", "300px"],
    px: "16px",
};

export const avatarTextTitleFlexSx = {
    gap: "4px",
};

export const avatarTextTitleSx = {
    fontSize: ["sm", "sm", "lg", "xl", "xl"],
    textTransform: "uppercase",
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
};

export const avatarTextWildpassCountSx = {
    fontSize: ["xs", "sm", "lg", "xl", "xl"],
    textTransform: "uppercase",
    color: "grey",
    ml: "0.5rem",
};
