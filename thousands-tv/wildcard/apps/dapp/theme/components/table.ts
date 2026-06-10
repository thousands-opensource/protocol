"use client";
import { tableAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(tableAnatomy.keys);

const baseStyle = definePartsStyle({
    table: {
        bg: "glass.bg",
    },
    thead: {
        bg: "glass.bg",
        color: "gray.500",
    },
    tbody: {
        bg: "glass.bg",
        color: "gray.500",
    },
    tfoot: {
        bg: "glass.bg",
        color: "gray.500",
    },
});

const sizes = {
    // md: definePartsStyle({}),
};

const table = defineMultiStyleConfig({
    defaultProps: {
        colorScheme: "whiteAlpha",
    },
    baseStyle,
    sizes,
});

export default table;
