"use client";
import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(cardAnatomy.keys);

const baseStyle = definePartsStyle({
    container: {
        borderRadius: "lg",
        p: 4,
        bg: "glass.bg",
    },
    header: {},
    body: {},
    footer: {},
});

const transparent = definePartsStyle({
    container: {
        bg: "transparent",
        boxShadow: "none",
    },
    header: {},
    body: {},
    footer: {},
});

const sizes = {
    md: definePartsStyle({}),
};

const card = defineMultiStyleConfig({
    baseStyle,
    sizes,
    variants: {
        transparent,
    },
});

export default card;
