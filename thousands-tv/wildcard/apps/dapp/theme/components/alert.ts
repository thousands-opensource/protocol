import { alertAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(alertAnatomy.keys);

const baseStyle = definePartsStyle({
    container: {
        bg: "black",
        boxShadow: "md",
        border: "0.4px solid",
        borderColor: "foreground",
    },
});

const errorStyle = definePartsStyle({
    title: {
        color: "red.400",
    },
    description: {
        color: "red.500",
    },
    icon: {
        color: "red.400",
    },
});

const warningStyle = definePartsStyle({
    title: {
        color: "yellow.400",
    },
    description: {
        color: "yellow.500",
    },
    icon: {
        color: "yellow.400",
    },
});

const infoStyle = definePartsStyle({
    title: {
        color: "primary.400",
    },
    description: {
        color: "primary.500",
    },
    icon: {
        color: "primary.400",
    },
});

const successStyle = definePartsStyle({
    title: {
        color: "green.400",
    },
    description: {
        color: "green.500",
    },
    icon: {
        color: "green.400",
    },
});

export const Alert = defineMultiStyleConfig({
    baseStyle,
    variants: {
        error: errorStyle,
        warning: warningStyle,
        info: infoStyle,
        success: successStyle,
    },
});
