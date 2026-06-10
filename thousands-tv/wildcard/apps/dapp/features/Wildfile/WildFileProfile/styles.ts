import { THEME_COLOR_BG_PRIMARY, THEME_COLOR_FONT_REQUIRED } from "@/constants";
import {
    THEME_COLOR_CYAN_BLUE,
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_IRON_GREY,
    THEME_COLOR_SLIGHT_GREY_BACKGROUND,
} from "@/constants/constants";
import { ColorObject } from "@/types";
import {
    buttonHeight,
    buttonMinWidth,
    buttonPaddingX,
    buttonSize,
    getAvatarThemeColor,
    gilroyBlackItalic,
} from "@/utils/themeUtil";

const smFontSize = ["xs", "xs", "sm", "md"];
const lgFontSize = ["3xl", "4xl", "5xl", "6xl"];

export const profileMainSx = { my: [0, 0, 0, 5] };

export const profileHeaderSx = {
    ml: ["0px", "0px", "0px", "0px", "-50px", "0px"],
};

export const wildpassCollectionInfoIcon = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    size: 17,
    color: "white",
};

export const linkedBoxSx = {
    display: "flex",
    flexDir: ["column", "row"],
    alignItems: ["start", "center"],
    w: "100%",
};

export const linkedBoxFlexSx = {
    w: "100%",
    alignItems: ["center"],
};

export const linkedBoxTextSx = {
    fontSize: ["sm", "md", "md"],
    color: THEME_COLOR_DARK_GOLD,
    fontFamily: "Gilroy-Bold",
    mr: "12px",
    alignItems: ["center"],
    justifyContent: ["center"],
};

export const socialMediaLinkStyle = {
    display: "inline-flex",
    alignItems: "center",
    "&:hover": {
        textDecoration: "underline",
    },
};

export const linkUnlinkFlexSx = {
    flexDir: "column",
    alignItems: ["center"],
    mt: [2, 1],
};

/**
 * @param isLinked whether the social is linked
 * @returns style object
 */
export const socialImgSx = (isLinked: boolean) => {
    return {
        mr: 2,
        filter: isLinked ? "none" : "grayscale(100%)",
        width: { base: 35 },
        height: { base: 35 },
    };
};

/**
 * @param smSize - whether the text should be small
 * @param color - font color to use
 * @returns sx object
 */
export const labelSx = (smSize: boolean, color?: string) => {
    const fontSize = smSize ? smFontSize : lgFontSize;
    return {
        mt: 1,
        fontSize,
        color: color || "white",
        textTransform: "uppercase",
    };
};

/**
 * @param bgColor - color to use for background
 * @returns sx object
 */
export const buttonSx = (bgColor: string) => {
    return {
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

export const discordTagSx = {
    _hover: {
        textDecor: "underline",
        color: THEME_COLOR_CYAN_BLUE,
        "& p": {
            "&:hover": {
                color: THEME_COLOR_CYAN_BLUE,
            },
        },
    },
};

export const noRolesFoundTextSx = {
    fontSize: "sm",
    color: THEME_COLOR_IRON_GREY,
    padding: [
        "0px 0px 5px 25px",
        "0px 0px 5px 25px",
        "0px 0px 5px 25px",
        "0px",
    ],
};

export const rolesHStackSx = {
    bg: "blackAlpha.600",
    borderRadius: "md",
    p: 2,
    fontSize: "xs",
};

export const activityNameSx = {
    color: THEME_COLOR_IRON_GREY,
    fontStyle: "italic",
    fontSize: "sm",
    display: "flex",
    alignItems: "baseline",
    _hover: {
        textDecor: "underline",
        color: THEME_COLOR_CYAN_BLUE,
        "& p": {
            color: THEME_COLOR_CYAN_BLUE,
        },
    },
};

export const activityTimeSx = {
    textTransform: "none",
    color: THEME_COLOR_IRON_GREY,
    fontStyle: "italic",
    fontSize: "xs",
    ml: 1,
};

export const parentBoxSx = {
    mb: 0,
    mx: 0,
    px: [0, 2, 8],
    py: 8,
    minH: "inherit",
    bgColor: THEME_COLOR_SLIGHT_GREY_BACKGROUND,
};

export const parentContainerSx = {
    mb: 0,
    mx: 0,
    py: 2,
    minH: "inherit",
    bgColor: THEME_COLOR_SLIGHT_GREY_BACKGROUND,
    padding: 5,
    height: "auto",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    maxW: "full",
    textTransform: "capitalize",
    minWidth: "320px",
};

export const parentFlexSx = {
    position: "relative",
    borderRadius: "3xl",
    minH: "inherit",
    backgroundColor: THEME_COLOR_BG_PRIMARY,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "top center",
    backgroundSize: "cover",
    borderColor: "whiteAlpha.500",
    fontWeight: 900,
    color: "white",
    alignItems: ["stretch", "stretch", "stretch", "center"],
    justifyContent: "flex-start",
    width: "100%",
    height: "100%",
    margin: "10px",
    paddingBottom: "15px",
    flexDirection: "column",
};

export const tabSx = {
    width: "100%",
    display: "flex",
    flexDir: "column",
    alignItems: ["stretch", "stretch", "stretch", "center"],
    position: "relative",
    zIndex: 99,
};

export const tabWrapperSx = {
    position: "sticky",
    top: 0,
    zIndex: 5,
    minH: "5.5rem",
    mt: "-5.5rem",
    display: "flex",
    alignItems: "center",
};

export const parentPageContentAlignment = {
    flexDirection: "row",
    py: ["20px", "20px", "20px", "unset"],
    alignItems: "center",
    alignSelf: "flex-start",
};

export const tabPanelsSx = {
    "& > div": {
        p: 0,
    },
    // Revisit to find a good width balance
    width: ["auto", "auto", "auto", "960px", "1200px"],
    // "@media (min-width: 1700px)": { width: "1200px" },
};

export const pageContentsSx = {
    justifyContent: ["center", "flex-end"],
    gap: ["8px", "8px", "8px", "48px", "60px"], // distance between the avatar image and the profile text contents
    flexDirection: [
        "column-reverse",
        "column-reverse",
        "column-reverse",
        "row",
    ],
};

export const pageContentsLeftSx = {
    flexDirection: "column",
    flex: 2,
    justifyContent: ["flex-start"],
};

export const avatarBoxSx = (isOwner: boolean | undefined) => {
    return {
        position: ["relative", "relative"],
        bottom: isOwner ? "0" : "5%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
        flexDirection: "column",
        mt: isOwner ? "unset" : ["0px", "0px", "0px", "50px"],
    };
};

export const avatarRadiusFullCircleSx = {
    mx: "auto",
    mb: 3,
    borderRadius: "full",
    width: ["265px", "265px", "365px", "588px"],
    height: ["265px", "265px", "365px", "588px"],
    objectFit: "cover",
};

export const avatarBackgroundGlowWrapperSx = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "absolute",
    borderRadius: "3xl",
    display: "flex",
    flexDir: "row-reverse",
};

export const profileDetailsSx = (isOwner: boolean | undefined) => {
    return {
        flexDir: "column",
        lineHeight: "initial",
        h: "100%",
        gap: isOwner ? ["5px", "5px", "16px", "16px", "24px"] : "5px",
        textTransform: "uppercase",
        alignItems: "start",
        minW: "280px",
    };
};

export const subHeaderFlexSx = {
    gap: 5,
    textAlign: "start",
    alignItems: "start",
    mb: ["5px", "5px", "5px", "5px"],
    direction: { base: "column", lg: "row" },
    position: "relative",
    flexDirection: ["column", "column", "column", "row"],
    justifyContent: "flex-start",
    justifySelf: "flex-start",
    paddingX: ["25px", "25px", "25px", "0px"],
    paddingTop: ["20px", "20px", "20px", "0px"],
    zIndex: 1,
};

export const topDiscordRolesSx = {
    gap: 2,
    flexDir: ["column", "column"],
    alignItems: "start",
    justifyContent: ["center"],
    mb: ["10px", "10px", "10px", "5px"],
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const wildpassRainbowColorSx = {
    justifyContent: "start",
    alignItems: ["center"],
    textTransform: "uppercase",
};

export const leaderboardSx = {
    flexDir: "row",
    gap: [2, 2, 5],
    mt: "15px",
    mb: ["10px", "10px", "10px", "0px"],
    alignItems: "start",
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const userActivityVStackSx = {
    flexDir: "column",
    gap: 2,
    pt: "10px",
    mb: ["10px", "10px", "10px", "0px"],
    alignItems: "start",
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const userDetailsSx = {
    flexDirection: { base: "column", sm: "column" },
    justifyContent: "center",
    alignItems: "start",
    mb: ["10px", "10px", "10px", "0px"],
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const pointsSx = {
    flexDir: "row",
    gap: [2, 2, 5],
    mt: "15px",
    mb: ["10px", "10px", "10px", "0px"],
    alignItems: "start",
    paddingX: ["25px", "25px", "25px", "0px"],
};

export const subHeaderBoxTextSx = {
    mt: ["0px", "0px", "0px", "-15px"],
};

export const subHeaderDiscordUsernameSx = {
    alignItems: "start",
    flexDir: "column",
};

export const pageContentsRightSx = {
    mb: "5px",
    justifyContent: "center",
    alignItems: "center",
};

export const toolTip = {
    bgColor: "var(--chakra-colors-brandDark-800)",
    offset: [0, -5],
    p: 4,
    pl: 6,
    textColor: "white",
    borderRadius: "10px",
};

export const iconImgSx = {
    height: 25,
    width: 25,
    mr: 3,
};

export const linkedSocialsRowSx = {
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
};

export const backgroundThemeTextColorSx = (avatarThemeColor: ColorObject) => ({
    color: getAvatarThemeColor(avatarThemeColor),
    fontSize: ["12px", "12px", "16px", "16px", "16px", "18px"],
});

export const accordionButton = {
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

export const boxAccordionWrapperSx = {
    width: "100%",
    borderTopColor: [
        THEME_COLOR_IRON_GREY,
        THEME_COLOR_IRON_GREY,
        THEME_COLOR_IRON_GREY,
        "unset",
    ],
};

export const callToActionMobileSx = {
    justifyContent: "center",
    alignItems: "center",
    bgColor: "white",
    color: "black",
    textTransform: "uppercase",
    fontFamily: gilroyBlackItalic.style.fontFamily,
    mt: "-20px",
    mb: ["0px", "0px", "20px"],
    boxShadow: "2xl",
    cursor: "pointer",
    height: ["30px", "40px", "50px"],
    fontSize: ["md", "2xl", "3xl"],
    zIndex: 1,
};

export const callToActionSx = {
    position: "absolute",
    top: "88px",
    right: "-20px",
    my: [0, 0, 0, 0, 0, 0],
    h: [0, 0, 0, "56px", "60px", "72px"],
    w: "auto",
    cursor: "pointer",
    zIndex: 1,
};
