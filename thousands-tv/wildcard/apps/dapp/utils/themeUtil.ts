import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import localFont from "next/font/local";
import { ColorObject } from "@/types";
// // These are the default chakra breakpoints
// const breakpoints = {
//     sm: '30em', // 480px
//     md: '48em', // 768px
//     lg: '62em', // 992px
//     xl: '80em', // 1280px
//     '2xl': '96em', // 1536px
//   }

export const wildleagueBoldIatlicInline = localFont({
    src: [
        {
            path: "../public/fonts/Wild-League-Bold-Italic-Inline.woff",
        },
    ],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-wildLeague-blackItalicInline",
});

export const wildleagueBoldCondensed = localFont({
    src: [
        {
            path: "../public/fonts/Wild-League-Bold-Condensed.woff",
        },
    ],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-wildLeague-boldCondensed",
});

export const wildleagueBold = localFont({
    src: [
        {
            path: "../public/fonts/Wild-League-Bold.woff",
        },
    ],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-wildLeague-bold",
});

export const gilroyRegular = localFont({
    src: [{ path: "../public/fonts/Gilroy-Regular.woff" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-regular",
});

export const gilroyHeavy = localFont({
    src: [{ path: "../public/fonts/Gilroy-Heavy.woff" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-heavy",
});

export const gilroySemiBold = localFont({
    src: [{ path: "../public/fonts/Gilroy-SemiBold.woff" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-semiBold",
});

export const gilroyBlack = localFont({
    src: [{ path: "../public/fonts/Gilroy-Black.woff", weight: "900" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-black",
});

export const gilroyBlackItalic = localFont({
    src: [{ path: "../public/fonts/Gilroy-BlackItalic.woff", weight: "900" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-blackItalic",
});

export const gilroyBold = localFont({
    src: [{ path: "../public/fonts/Gilroy-Bold.woff", weight: "900" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-bold",
});

export const gilroyMedium = localFont({
    src: [{ path: "../public/fonts/Gilroy-Medium.woff", weight: "900" }],
    adjustFontFallback: false,
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-gilroy-medium",
});

/**
 * Poppins Font Family
 */

export const poppinsMedium = localFont({
    src: [{ path: "../public/fonts/Poppins-Medium.woff", weight: "400" }],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-medium",
});

export const poppinsLightItalic = localFont({
    src: [
        {
            path: "../public/fonts/Poppins-LightItalic.woff",
            style: "italic",
            weight: "300",
        },
    ],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-light-italic",
});

export const poppinsLight = localFont({
    src: [{ path: "../public/fonts/Poppins-Light.woff", weight: "300" }],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-light",
});

export const poppinsBoldItalic = localFont({
    src: [
        {
            path: "../public/fonts/Poppins-BoldItalic.woff",
            style: "italic",
            weight: "700",
        },
    ],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-bold-italic",
});

export const poppinsBold = localFont({
    src: [{ path: "../public/fonts/Poppins-Bold.woff", weight: "700" }],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-bold",
});

export const poppinsBlack = localFont({
    src: [{ path: "../public/fonts/Poppins-Black.woff", weight: "900" }],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-black",
});

export const poppinsRegular = localFont({
    src: [{ path: "../public/fonts/Poppins-Regular.woff", weight: "100" }],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-poppins-reg",
});

export const azeretMonoMedium = localFont({
    src: [{ path: "../public/fonts/AzeretMono-Medium.woff", weight: "500" }],
    preload: true,
    display: "block",
    fallback: ["system-ui"],
    variable: "--font-azeret-mono-medium",
});

const config: ThemeConfig = {
    initialColorMode: "dark",
    useSystemColorMode: false,
};

/**
 * base: Styles for all screen sizes.
 * sm: Small screens (≥30em) - Approximately 480px.
 * md: Medium screens (≥48em) - Approximately 768px.
 * lg: Large screens (≥62em) - Approximately 992px.
 * xl: Extra-large screens (≥80em) - Approximately 1280px.
 * 2xl: Double extra-large screens (≥96em) - Approximately 1536px.
 * 3xl: Triple extra-large screens (≥112em) - Approximately 1792px.
 * 4xl: Quadruple extra-large screens (≥128em) - Approximately 2048px.
 */
export const theme = extendTheme({
    config,
    styles: {
        global: {
            html: {
                fontFamily: gilroyBlackItalic.style.fontFamily,
            },
            body: {
                fontSize: "16px", // Default font size
                "@media (min-width: 768px)": {
                    fontSize: "16px",
                },
                "@media (min-width: 992px)": {
                    fontSize: "16px",
                },
                "@media (min-width: 1280px)": {
                    fontSize: "16px",
                },
                "@media (min-width: 1536px)": {
                    fontSize: "18px",
                },
                "@media (min-width: 2048px)": {
                    fontSize: "22px",
                },
            },
        },
    },
    fonts: {
        heading: gilroyBlack.style.fontFamily,
        body: gilroyBold.style.fontFamily,
    },
    colors: {
        brand: {
            bg: "#DAE0E6",
            900: "#171923",
        },
        wildcardGold: {
            "500": "#c9ac53",
            bg: "#c9ac53",
        },
        // Extend Customized Wildcard Dark Theme
        brandDark: {
            "100": "##f2f2f2",
            "200": "#acacac",
            "300": "#434343",
            "400": "#303030",
            "500": "#1A1A1B",
            "600": "#131313",
            "700": "#080808",
            "800": "#131313",
            bg: "#020203",
        },
    },
    components: {
        Text: {
            variants: {
                "gilroy-black": {
                    fontFamily: gilroyBlack.style.fontFamily,
                },
                "gilroy-medium": {
                    fontFamily: gilroyMedium.style.fontFamily,
                },

                "gilroy-black-italic": {
                    fontFamily: gilroyBlackItalic.style.fontFamily,
                },
                "gilroy-bold": {
                    fontFamily: gilroyBold.style.fontFamily,
                },
            },
        },
        Alert: {
            parts: ["container", "title", "description", "icon"],
            baseStyle: {
                container: {
                    color: "white",
                },
                title: {
                    color: "white",
                },
                description: {
                    color: "white",
                },
                icon: {
                    color: "white",
                },
            },
        },
    },
    NextLink: {
        baseStyle: {
            "&:hover": { textDecoration: "none" },
        },
    },
});

// BUTTONS
export const buttonHeight = ["7", "7", "7", "7", "8"];
export const buttonPaddingX = ["8px", "12px"];
export const buttonMinWidth = ["28px", "36px"];
export const buttonSize = ["sm", "sm", "sm", "md", "lg"];

/**
 * get the user's avatar theme color
 * @param avatarThemeColor - the avatar theme color object
 * @returns {string} The hex value of the avatar theme color.
 */
export const getAvatarThemeColor = (avatarThemeColor: ColorObject): string => {
    return avatarThemeColor.hexValue ? avatarThemeColor.hexValue : "white";
};
