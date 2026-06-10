import {
    COMMUNITY_GATHERINGS,
    DEFAULT_BREAKPOINT_DIMENSIONS,
    MELEE_ON_THE_METEOR,
    MOODS_OF_BOLGAR,
    PRE_ALPHA_PARTNERS_ACTIVATIONS,
    ROAD_TO_EX1,
    SWAG_PIN_COLLECTION_BREAKPOINT_DIMENSIONS_MISSING,
    SWAG_PIN_COLLECTION_BREAKPOINT_DIMENSIONS_OWNED,
    ULTIMATE_FAN,
    SPAWN_OF_SPORD,
    G3,
    YGG,
} from "@/constants/flair";
import { SystemStyleObject } from "@chakra-ui/react";
import {
    MOODS_OF_BOLGAR_HORIZONTAL_BACKGROUND_IMAGE,
    MOODS_OF_BOLGAR_VERTICAL_BACKGROUND_IMAGE,
    SPAWN_OF_SPORD_HORIZONTAL_BACKGROUND_IMAGE,
    SPAWN_OF_SPORD_VERTICAL_BACKGROUND_IMAGE,
    STRIPE_HORIZONTAL_BACKGROUND_IMAGE,
    STRIPE_VERTICAL_BACKGROUND_IMAGE,
    THEME_CHARCOAL_BLACK,
    THEME_COLOR_BRIGHT_GRAY,
    THEME_COLOR_DARK_BRONZE,
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    THEME_COLOR_GHOST_WHITE,
    THEME_COLOR_PLATINUM,
    THEME_COLOR_YELLOW,
    ULTIMATE_FAN_STRIPE_HORIZONTAL_BACKGROUND_IMAGE,
    WILDFILE_ASSETS_COLLECTION_DIRECTORY,
} from "@/constants/constants";
import MeleeOnTheMeteor_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/MeleeOnTheMeteor_Desktop.webp";
import Community_Gatherings_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Community_Gatherings_Desktop.webp";
import RoadToEx1_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/RoadToEx1_Desktop.webp";
import PreAlphaPartner_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/PreAlphaPartner_Desktop.webp";
import Collect_Them_All_Blue_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Collect_Them_All_Blue_Desktop.svg";
import Collect_Them_All_Gold_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Collect_Them_All_Gold_Desktop.svg";
import Collect_Them_All_Green_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Collect_Them_All_Green_Desktop.webp";
import Collect_Them_All_Stacked_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Collect_Them_All_Stacked_Desktop.svg";
import Fallback_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Fallback_Desktop.svg";
import Ultimate_Fan_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Ultimate_Fan.webp";
import Moods_Of_Bolgar_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Moods_Of_Bolgar_Desktop.webp";
import Moods_Of_Bolgar_Mobile from "@/public/images/WildfileAssets/Collections/pre-alpha/Moods_Of_Bolgar_Mobile.webp";
import Spawn_Of_Spord_Desktop from "@/public/images/WildfileAssets/Collections/pre-alpha/Spawn_Of_Spord_Desktop.webp";
import Spawn_Of_Spord_Mobile from "@/public/images/WildfileAssets/Collections/pre-alpha/Spawn_Of_Spord_Mobile.webp";
import G3_Desktop_Cover from "@/public/images/WildfileAssets/Collections/g3/G3_Desktop_Cover.webp";
import G3_Mobile_Cover from "@/public/images/WildfileAssets/Collections/g3/G3_Mobile_Cover.webp";
import G3_Desktop_Background_Image from "@/public/images/WildfileAssets/Collections/g3/G3_desktop_foam.webp";
import G3_Mobile_Background_Image from "@/public/images/WildfileAssets/Collections/g3/G3_Mobile_Foam.webp";
import G3_Collect_Them_All_Desktop from "@/public/images/WildfileAssets/Collections/g3/G3_CollectThemAll.webp";
import YGG_Desktop_Cover from "@/public/images/WildfileAssets/Collections/ygg/YGG_Desktop_Cover.webp";
import YGG_Mobile_Cover from "@/public/images/WildfileAssets/Collections/ygg/YGG_Mobile_Cover.webp";
import YGG_Desktop_Background_Image from "@/public/images/WildfileAssets/Collections/ygg/YGG_Desktop_Foam.webp";
import YGG_Mobile_Background_Image from "@/public/images/WildfileAssets/Collections/ygg/YGG_Mobile_Foam.webp";
import YGG_Collect_Them_All_Desktop from "@/public/images/WildfileAssets/Collections/ygg/YGG_CollectThemAll.webp";
import { SwagSetStyle, SwagSetStyles } from ".";

export const ghostButtonSx = {
    textTransform: "uppercase",
    border: "1px",
    _hover: {
        bg: "whiteAlpha.900",
        color: "black",
    },
    bg: "transparent",
    color: "white",
    borderRadius: "md",
    fontSize: ["xs", "xs", "sm", "sm"],
    px: "8px",
    height: [5, 5, 6, 6],
    minW: "var(--chakra-sizes-7)",
    lineHeight: 1,
};

export const totalOwnedTextSx = {
    display: "inline",
    ml: "0.5em",
    textTransform: "lowercase",
    fontSize: ["xs", "xs", "sm", "sm"],
};

/**
 * Gets src to use for token image
 * @param tokenId - id of token
 * @param owned - whether this token is owned or not
 * @returns string
 */
export const tokenImgAsset = (tokenId: string, owned: boolean) => {
    return `url(${WILDFILE_ASSETS_COLLECTION_DIRECTORY}/${
        owned ? "owned" : "missing"
    }/${tokenId}.webp)`;
};

export const pinImgSx = (tokenId: string, owned: boolean) => {
    /**
     * Get specific background size for the swag pin
     * @param swagCollectionDimensions - specific swag pin background size from list of swag pin dimensions
     * @returns dimension (array of strings)
     */
    const getSwagPinStyles = (swagPinDimensions: {
        backgroundSize: string | string[];
        top?: string | string[];
        left?: string | string[];
    }) => {
        return swagPinDimensions
            ? swagPinDimensions
            : DEFAULT_BREAKPOINT_DIMENSIONS;
    };

    let imgSrc = `
        ${tokenImgAsset(tokenId, owned)}
       `;
    const missingSwagPinsStyles = getSwagPinStyles(
        SWAG_PIN_COLLECTION_BREAKPOINT_DIMENSIONS_MISSING[tokenId]
    );
    let backgroundSize = missingSwagPinsStyles.backgroundSize;
    const top = missingSwagPinsStyles.top;
    const left = missingSwagPinsStyles.left;

    if (owned) {
        imgSrc = `
         ${imgSrc},
        ${tokenImgAsset(tokenId, false)}
       `;
        const ownedSwagPinsStyles = getSwagPinStyles(
            SWAG_PIN_COLLECTION_BREAKPOINT_DIMENSIONS_OWNED[tokenId]
        );
        backgroundSize = ownedSwagPinsStyles.backgroundSize;
    }

    return {
        backgroundImage: `
         ${imgSrc}
       `,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: backgroundSize,
        height: "100%",
        width: "100%",
        cursor: "pointer",
        border: "solid 0.5px transparent",
        borderRadius: "5px",
        ["&:hover"]: {
            filter: "brightness(150%)",
        },
        position: "absolute",
        top: top,
        left: left,
    };
};

export const imgMediaSx = {
    // maxW: "100%",
    // w: "50%",
    h: "50%",
    objectFit: "fill",
};

export const genericSwagSetStyle: SwagSetStyle = {
    backgroundBorderGradient: `linear-gradient(to right, ${THEME_COLOR_YELLOW}, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_DARK_BRONZE})`,
    leftPanelImageDesktopSrc: Fallback_Desktop.src,
    leftPanelImageMobileSrc: Fallback_Desktop.src,
    bannerHeight: "20%",
    templateColumns: `repeat(2, 1fr)`,
    rightPanelHeight: ["370px", "650px", "900px", "auto"],
    rightPanelBackgroundSize: "cover",
    rightPanelBackgroundImageUrl: `url(${STRIPE_VERTICAL_BACKGROUND_IMAGE})`,
};

export const swagSetsStyles: SwagSetStyles = {
    [MELEE_ON_THE_METEOR]: {
        backgroundBorderGradient: `linear-gradient(to right, ${THEME_COLOR_YELLOW}, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_DARK_BRONZE})`,
        leftPanelImageDesktopSrc: MeleeOnTheMeteor_Desktop.src,
        leftPanelImageMobileSrc: MeleeOnTheMeteor_Desktop.src,
        bannerHeight: "20%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelHeight: ["370px", "650px", "900px", "auto"],
        rightPanelBackgroundSize: "cover",
        rightPanelBackgroundImageUrl: `url(${STRIPE_VERTICAL_BACKGROUND_IMAGE})`,
        collectThemAllSrc: Collect_Them_All_Stacked_Desktop.src,
        collectThemAllWidth: ["90px", "144px", "200px", "114px"],
    },
    [COMMUNITY_GATHERINGS]: {
        backgroundBorderGradient: `linear-gradient(to right, #FFFFFF, #CCCCCC)`,
        leftPanelImageDesktopSrc: Community_Gatherings_Desktop.src,
        leftPanelImageMobileSrc: Community_Gatherings_Desktop.src,
        bannerHeight: "20%",
        templateColumns: `repeat(1, 1fr)`,
        templateRows: `1fr 1fr 1fr .5fr`,
        rightPanelPaddingY: ["32px", "32px", "32px", "52px"],
        rightPanelHeight: ["370px", "650px", "900px", "auto"],
        rightPanelBackgroundSize: "cover",
        rightPanelBackgroundImageUrl: `url(${STRIPE_VERTICAL_BACKGROUND_IMAGE})`,
        collectThemAllSrc: Collect_Them_All_Gold_Desktop.src,
        collectThemAllWidth: ["173px", "133px", "133px", "133px"],
    },
    [ROAD_TO_EX1]: {
        backgroundBorderGradient: `linear-gradient(to right, #3C64EF, #1D396F)`,
        leftPanelImageDesktopSrc: RoadToEx1_Desktop.src,
        leftPanelImageMobileSrc: RoadToEx1_Desktop.src,
        bannerHeight: "30%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: ["53%", "53%", "53%", "55%"],
        rightPanelHeight: ["300px", "420px", "600px", "auto"],
        rightPanelBackgroundSize: "cover",
        rightPanelBackgroundImageUrl: `url(${STRIPE_HORIZONTAL_BACKGROUND_IMAGE})`,
        colSpan: 2,
        collectThemAllSrc: Collect_Them_All_Blue_Desktop.src,
        collectThemAllWidth: ["183px", "233px", "263px", "263px"],
    },
    [PRE_ALPHA_PARTNERS_ACTIVATIONS]: {
        backgroundBorderGradient: `linear-gradient(to right, ${THEME_COLOR_YELLOW}, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_DARK_BRONZE})`,
        leftPanelImageDesktopSrc: PreAlphaPartner_Desktop.src,
        leftPanelImageMobileSrc: PreAlphaPartner_Desktop.src,
        bannerHeight: "30%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: "50%",
        rightPanelHeight: ["300px", "420px", "600px", "auto"],
        rightPanelBackgroundSize: "cover",
        rightPanelBackgroundImageUrl: `url(${STRIPE_HORIZONTAL_BACKGROUND_IMAGE})`,
        colSpan: 2,
        collectThemAllSrc: Collect_Them_All_Gold_Desktop.src,
        collectThemAllWidth: ["183px", "233px", "263px", "263px"],
    },
    [ULTIMATE_FAN]: {
        backgroundBorderGradient: `linear-gradient(to right, ${THEME_COLOR_YELLOW}, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_DARK_BRONZE})`,
        leftPanelImageDesktopSrc: Ultimate_Fan_Desktop.src,
        leftPanelImageMobileSrc: Ultimate_Fan_Desktop.src,
        bannerHeight: "15%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: ["54%", "53%", "53%", "54%"],
        rightPanelHeight: ["410px", "650px", "900px", "auto"],
        rightPanelBackgroundSize: "cover",
        rightPanelBackgroundImageUrl: `url(${ULTIMATE_FAN_STRIPE_HORIZONTAL_BACKGROUND_IMAGE})`,
        collectThemAllSrc: Collect_Them_All_Gold_Desktop.src,
        collectThemAllWidth: ["173px", "233px", "263px", "263px"],
    },
    [MOODS_OF_BOLGAR]: {
        backgroundBorderGradient: `linear-gradient(to bottom, ${THEME_COLOR_PLATINUM}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_GHOST_WHITE})`,
        leftPanelImageDesktopSrc: Moods_Of_Bolgar_Desktop.src,
        leftPanelImageMobileSrc: Moods_Of_Bolgar_Mobile.src,
        bannerHeight: "30%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: "50%",
        rightPanelHeight: ["265px", "357px", "600px", "auto"],
        rightPanelBackgroundSize: [
            "100% 100%",
            "100% 100%",
            "100% 100%",
            "cover",
        ],
        rightPanelBackgroundImageUrl: [
            `url(${MOODS_OF_BOLGAR_VERTICAL_BACKGROUND_IMAGE})`,
            `url(${MOODS_OF_BOLGAR_VERTICAL_BACKGROUND_IMAGE})`,
            `url(${MOODS_OF_BOLGAR_VERTICAL_BACKGROUND_IMAGE})`,
            `url(${MOODS_OF_BOLGAR_HORIZONTAL_BACKGROUND_IMAGE})`,
        ],
        collectThemAllSrc: Collect_Them_All_Green_Desktop.src,
        collectThemAllWidth: ["100px", "100px", "100px", "60px"],
        collectThemAllInset: ["4px 0 0 0"],
    },
    [SPAWN_OF_SPORD]: {
        backgroundBorderGradient: `linear-gradient(to bottom, ${THEME_COLOR_PLATINUM}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_GHOST_WHITE})`,
        leftPanelImageDesktopSrc: Spawn_Of_Spord_Desktop.src,
        leftPanelImageMobileSrc: Spawn_Of_Spord_Mobile.src,
        bannerHeight: "20%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: "50%",
        rightPanelHeight: ["310px", "550px", "900px", "auto"],
        rightPanelBackgroundSize: [
            "100% 100%",
            "100% 100%",
            "100% 100%",
            "cover",
        ],
        rightPanelBackgroundImageUrl: [
            `url(${SPAWN_OF_SPORD_VERTICAL_BACKGROUND_IMAGE})`,
            `url(${SPAWN_OF_SPORD_VERTICAL_BACKGROUND_IMAGE})`,
            `url(${SPAWN_OF_SPORD_VERTICAL_BACKGROUND_IMAGE})`,
            `url(${SPAWN_OF_SPORD_HORIZONTAL_BACKGROUND_IMAGE})`,
        ],
        collectThemAllSrc: Collect_Them_All_Green_Desktop.src,
        collectThemAllWidth: ["100px", "100px", "100px", "60px"],
        collectThemAllInset: ["4px 0 0 -4px"],
    },
    [G3]: {
        backgroundBorderGradient: `linear-gradient(to bottom, ${THEME_COLOR_PLATINUM}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_GHOST_WHITE})`,
        leftPanelImageDesktopSrc: G3_Desktop_Cover.src,
        leftPanelImageMobileSrc: G3_Mobile_Cover.src,
        bannerHeight: "30%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: "50%",
        rightPanelHeight: ["265px", "357px", "357px", "auto"],
        rightPanelBackgroundSize: [
            "100% 100%",
            "100% 100%",
            "100% 100%",
            "cover",
        ],
        rightPanelBackgroundImageUrl: [
            `url(${G3_Mobile_Background_Image.src})`,
            `url(${G3_Mobile_Background_Image.src})`,
            `url(${G3_Mobile_Background_Image.src})`,
            `url(${G3_Desktop_Background_Image.src})`,
        ],
        collectThemAllSrc: G3_Collect_Them_All_Desktop.src,
        collectThemAllWidth: ["100px", "100px", "100px", "60px"],
        collectThemAllInset: ["0 0 0 -5px"],
    },
    [YGG]: {
        backgroundBorderGradient: `linear-gradient(to bottom, ${THEME_COLOR_PLATINUM}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_BRIGHT_GRAY}, ${THEME_COLOR_GHOST_WHITE})`,
        leftPanelImageDesktopSrc: YGG_Desktop_Cover.src,
        leftPanelImageMobileSrc: YGG_Mobile_Cover.src,
        bannerHeight: "30%",
        templateColumns: `repeat(2, 1fr)`,
        rightPanelTop: "50%",
        rightPanelHeight: ["265px", "357px", "357px", "auto"],
        rightPanelBackgroundSize: [
            "100% 100%",
            "100% 100%",
            "100% 100%",
            "cover",
        ],
        rightPanelBackgroundImageUrl: [
            `url(${YGG_Mobile_Background_Image.src})`,
            `url(${YGG_Mobile_Background_Image.src})`,
            `url(${YGG_Mobile_Background_Image.src})`,
            `url(${YGG_Desktop_Background_Image.src})`,
        ],
        collectThemAllSrc: YGG_Collect_Them_All_Desktop.src,
        collectThemAllWidth: ["100px", "100px", "100px", "60px"],
        collectThemAllInset: ["0 0 0 -7px"],
    },
};

export const collectionHeaderSx: SystemStyleObject = {
    justifyContent: "space-between",
    mb: 4,
    w: "100%",
};

export const collectionHeaderTitleSx: SystemStyleObject = {
    color: "white",
    display: "inline",
    fontSize: ["xs", "xs", "sm", "sm"],
};

export const claimViewBtnSx: SystemStyleObject = {
    w: "100%",
    flexDir: "row-reverse",
};

export const collectionBodyWrapperSx = (
    completedSet: boolean,
    swagSetStyle: SwagSetStyle
) => {
    return {
        width: "100%",
        height: "50%",
        justifyContent: "start",
        padding: "0px",
        flexDirection: "row",
        position: "relative",
        _before: {
            content: "''",
            position: "absolute",
            inset: "0",
            padding: "5px",
            borderRadius: "10px",
            WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            background: completedSet
                ? swagSetStyle.backgroundBorderGradient
                : `linear-gradient(to right, #707070, #707070)`,
        },
    };
};

export const collectionBodySx: SystemStyleObject = {
    flexDir: ["column", "column", "column", "row"],
    justifyContent: "start",
    backgroundColor: THEME_CHARCOAL_BLACK,
    padding: "7px",
    borderRadius: "18px",
};

export const leftPanelSx: SystemStyleObject = {
    h: "100%",
    w: "100%",
    position: "relative",
    borderTop: `2px solid black`,
    borderLeft: `2px solid black`,
    borderRight: [
        `2px solid black`,
        `2px solid black`,
        `2px solid black`,
        "unset",
    ],
    borderBottom: ["unset", "unset", "unset", `2px solid black`],
};

export const bannerImgSx = (swagSetStyle: SwagSetStyle) => ({
    height: swagSetStyle.bannerHeight,
    right: ["5%", "5%", "5%", "10%"],
    top: ["-23px", "-23px", "-27px", "-23px"],
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    cursor: "pointer",
    border: "solid 0.5px transparent",
    borderRadius: "5px",
    position: "absolute",
    ["&:hover"]: {
        filter: "brightness(150%)",
    },
});

export const rightPanelSx = (swagSetStyle: SwagSetStyle) => ({
    gap: 1,
    width: "100%",
    height: swagSetStyle.rightPanelHeight,
    borderTop: ["unset", "unset", "unset", `2px solid black`],
    borderLeft: [
        `2px solid black`,
        `2px solid black`,
        `2px solid black`,
        "unset",
    ],
    borderRight: `2px solid black`,
    borderBottom: `2px solid black`,
    backgroundImage: swagSetStyle.rightPanelBackgroundImageUrl,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "top center",
    backgroundSize: swagSetStyle.rightPanelBackgroundSize,
    position: "relative",
    paddingY: swagSetStyle.rightPanelPaddingY,
});

export const rightPanelGridItemSx: SystemStyleObject = {
    display: "flex",
    alignItems: "center",
    position: "relative",
};

export const collectThemAllGridItemSx: SystemStyleObject = {
    display: "flex",
    alignSelf: "center",
    justifySelf: "center",
};

export const collectThemAllSx = (swagSetStyle: SwagSetStyle) => ({
    w: swagSetStyle.collectThemAllWidth,
    position: "relative",
    inset: swagSetStyle.collectThemAllInset,
});

export const collectThemAllGridItemAbsoluteSx = (
    swagSetStyle: SwagSetStyle
) => ({
    display: "flex",
    letterSpacing: ".5rem",
    position: "absolute",
    top: swagSetStyle.rightPanelTop,
    left: "50%",
    transform: "translate(-50%, -50%)",
});

export const collectThemAllAbsoluteSx = (swagSetStyle: SwagSetStyle) => ({
    w: swagSetStyle.collectThemAllWidth,
    maxW: "fit-content",
});
