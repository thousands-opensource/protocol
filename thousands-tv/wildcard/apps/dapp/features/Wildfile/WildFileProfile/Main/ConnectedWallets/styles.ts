import { THEME_COLOR_BG_PRIMARY, THEME_COLOR_SECONDARY } from "@/constants";

import {
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    THEME_COLOR_GREY,
    THEME_COLOR_IRON_GREY,
    THEME_COLOR_METALLIC_GREY,
    THEME_GRADIENT,
} from "@/constants/constants";
import { ColorObject } from "@/types";
import {
    buttonHeight,
    buttonMinWidth,
    buttonPaddingX,
    buttonSize,
    getAvatarThemeColor,
} from "@/utils/themeUtil";

export const iconImgSx = {
    height: 25,
    width: 25,
    mr: 3,
};

export const additionalWalletTextSx = {
    "&:hover": {
        cursor: "pointer",
        textDecor: "underline",
    },
};

export const accordionButton = {
    _expanded: {
        "& .chakra-accordion__icon": {
            transform: "rotate(0deg)",
        },
    },
    "& .chakra-accordion__icon": {
        transform: "rotate(-90deg)",
    },
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const topAccordionButton = {
    justifyContent: "space-between",
    _expanded: {
        "& .chakra-accordion__icon": {
            transform: "rotate(0deg)",
        },
    },
    "& .chakra-accordion__icon": {
        transform: "rotate(-90deg)",
    },
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const accordionPanelSx = {
    color: THEME_COLOR_IRON_GREY,
    alignItems: "center",
    justifyContent: "space-between",
    display: "flex",
    p: [
        "5px 0px 0px 25px",
        "5px 0px 0px 25px",
        "5px 0px 0px 25px",
        "5px 0px 0px 5px",
    ],
    maxW: ["190px", "190px", "200px"],
};

export const spacer = {
    width: ["0px", "30px"],
    flex: "none",
};

export const stepsStack = {
    borderTop: `0.5px solid ${THEME_COLOR_GREY}`,
    borderBottom: `0.5px solid ${THEME_COLOR_GREY}`,
    wordBreak: "break-word",
    pt: "25px",
    pb: "50px",
};

export const currentlyLinkedBox = {
    borderBottom: `0.5px solid ${THEME_COLOR_GREY}`,
    pt: "10px",
    pb: "30px",
    w: "100%",
};

export const modalContentSx = {
    textTransform: "upperCase",
    display: "flex",
    justifyContent: "center",
    pt: 4,
    pb: 2,
    px: ["5px", "10px", "20px"],
    color: "white",
    bg: THEME_COLOR_BG_PRIMARY,
    borderRadius: "10px",
    maxWidth: ["365px", "450px", "450px", "450px", "700px"],
    border: "1px solid",
};

/**
 * Style for step circle
 * @param size - length/height
 * @returns SX object
 */
export const stepCircle = (size: string) => {
    return {
        h: size,
        w: size,
        minH: size,
        minW: size,
    };
};

export const primaryWalletSx = {
    fontSize: "xs",
    color: THEME_COLOR_DARK_GOLD,
};

export const currentlyLinked = {
    fontSize: "xs",
    color: THEME_COLOR_METALLIC_GREY,
};

export const headerSx = {
    pt: 2,
    textTransform: "uppercase",
    fontSize: "2xl",
    px: "20px",
};

export const successSx = {
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
    textAlign: "start",
};

export const connectLinkSx = {
    color: "white",
    padding: "3px 8px 3px 8px",
    borderRadius: "5px",
    fontSize: "xs",
    alignItems: "center",
    minW: "fit-content",
    mt: "10px",
    display: "flex",
    bgGradient: THEME_GRADIENT,
    height: 7,
    "&:hover": {
        opacity: 0.8,
        bgGradient: THEME_GRADIENT,
    },
};

export const currentLinkedWalletsBox = {
    w: "100%",
};

// Style to fix rainbow kit's wonky Connect button
export const connectedSx = {
    pointerEvents: "none",
    minW: "125px",
    "& div:nth-of-type(2) div": {
        gap: "8px",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        "& svg": {
            display: "none",
        },
    },
};

export const subtitleTextStack = {
    pt: "15px",
    borderTop: `0.5px solid ${THEME_COLOR_GREY}`,
};

export const subtitleText = {
    fontSize: "xs",
    textTransform: "none",
    color: THEME_COLOR_METALLIC_GREY,
    fontStyle: "italic",
};

export const linkAdditionalSx = {
    textTransform: "uppercase",
    fontSize: "15px",
    mt: 4,
    fontFamily: "Gilroy-Bold",
    color: THEME_COLOR_DARK_GOLD,
    height: "6",
    _hover: { filter: "brightness(1.4)", textDecoration: "underline" },
    px: buttonPaddingX,
    minW: buttonMinWidth,
    "&:hover": {
        opacity: 0.8,
    },
};

export const subHeader = {
    color: THEME_COLOR_DARK_GOLD,
    fontSize: "xl",
};

export const alreadyLinkedSx = {
    color: THEME_COLOR_DARK_GOLDEN_YELLOW,
    fontSize: "sm",
    textAlign: "center",
};

export const stepEnabled = {
    color: "white",
    width: "100%",
    justifyContent: "start",
    alignItems: "start",
};

export const stepDisabled = {
    color: THEME_COLOR_IRON_GREY,
    width: "100%",
    justifyContent: "start",
    alignItems: "start",
};

export const successAddress = {
    display: "block",
    width: "fit-content",
    "&:hover": {
        textDecoration: "underline",
        cursor: "default",
    },
};

export const successHStack = {
    width: "100%",
    justifyContent: "start",
};

export const stepFlex = {
    flexDirection: "column",
    alignItems: "start",
    flexGrow: "1",
    justifyContent: "start",
};

/**
 * Gets styling for text of step
 * @param stepEnabled - whether the step is enbaled
 * @param stepComplete - if the step is complete
 * @returns sx styling
 */
export const stepText = (stepEnabled: boolean, stepComplete: boolean) => {
    const getColor = () => {
        if (stepComplete) return THEME_COLOR_METALLIC_GREY;
        if (stepEnabled) return "white";
        return THEME_COLOR_IRON_GREY;
    };
    return {
        minW: "160px",
        color: getColor(),
        mb: "8px",
    };
};

export const stepSubText = {
    fontSize: "xs",
};

export const removeLinkedWallet = {
    bgColor: "transparent",
    "&:hover": {
        filter: "brightness(150%",
    },
    fontSize: "sm",
};

/**
 * @param bgColor - color to use for background
 * @returns sx object
 */
export const buttonSx = (bgColor: string) => {
    return {
        minWidth: "fit-content",
        fontFamily: "Gilroy-Bold",
        color: "white",
        size: buttonSize,
        bg: bgColor,
        height: buttonHeight,
        _hover: { opacity: 0.8, bg: bgColor },
        px: buttonPaddingX,
        minW: buttonMinWidth,
        "&:hover": {
            opacity: 0.8,
        },
        textColor: "white",
    };
};

export const backgroundThemeTextColorSx = (avatarThemeColor: ColorObject) => ({
    color: getAvatarThemeColor(avatarThemeColor),
    fontSize: ["12px", "12px", "16px", "16px", "16px", "18px"],
});

export const flexBoxToolTipSx = {
    mt: 1,
    color: THEME_COLOR_IRON_GREY,
    alignItems: "center",
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const linkWalletFlexSx = {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "start",
};

export const linkAdditionalWalletButtonSx = {
    paddingX: ["25px", "25px", "25px", "0px"],
    paddingBottom: ["10px", "10px", "10px", "0px"],
    mt: "15px",
};

export const additionalWalletErrFlex = {
    overflowY: "scroll",
    maxHeight: "100px",
};

export const additionalWalletErrMessage = {
    wordWrap: "break-word",
    color: "red",
    fontWeight: "bold",
};

export const additionalWalletButtonFlexSX = {
    flexDirection: "row",
    py: "5px",
    w: "100%",
    _hover: {
        bg: "whiteAlpha.100",
        py: "5px",
    },
    borderRadius: "md",
    px: "20px",
    justifyContent: "space-between",
    alignItems: "center",
    height: ["40px", "40px", "50px"],
};

export const primaryWalletButtonSX = {
    border: "1px solid",
    borderColor: THEME_COLOR_SECONDARY,
    bg: "glass.bg",
    color: "white",
    fontSize: "sm",
    _hover: { bg: "whiteAlpha.100" },
};

export const walletCardSX = {
    borderRadius: "lg",
    p: 4,
    bg: "unset",
    color: "white",
    border: "1px solid",
    borderColor: "whiteAlpha.500",
};

export const walletCardFlexSX = {
    alignItems: "center",
    justifyContent: "space-between",
    p: 2,
    borderRadius: "md",
    flexDirection: "column",
    gap: "10px",
};

export const walletAccordionButtonSX = {
    bg: "unset",
    p: 0,
    _hover: { bg: "whiteAlpha.100" },
};

export const accordionButtonSx = (accordionWalletSX: any) => ({
    ...accordionWalletSX,
    position: "relative",
    overflow: "hidden",
    _hover: {
        bg: "whiteAlpha.100",
    },
    px: 0,
});

export const accordionWalletSx = (borderRadius: string) => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
        "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
    opacity: 0.7,
    border: "0.5px solid #fff",
    borderRadius: borderRadius,
    zIndex: 1,
    pointerEvents: "none",
});

export const accordionPanelBoxSx = (borderRadiusMd: string) => ({
    position: "relative",
    width: "100%",
    height: "100%",
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background:
            "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
        opacity: 0.7,
        border: "0.5px solid #fff",
        borderTop: "none",
        borderRadius: `0 0 ${borderRadiusMd} ${borderRadiusMd}`,
        zIndex: 1,
        pointerEvents: "none",
    },
});
