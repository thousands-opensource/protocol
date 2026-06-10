"use client";
import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(menuAnatomy.keys);
import { blurredBackgroundMenu } from "./shared";

// the base component styles
const baseStyle = definePartsStyle({
    button: {},
    list: {
        color: "white",

        ...blurredBackgroundMenu,
    },
    item: {
        backgroundColor: "transparent",
        color: "white",
        _focus: {
            backdropFilter:
                "blur(20px) saturate(190%) contrast(70%) brightness(80%)",
        },
    },
    groupTitle: {},
    command: {},
    divider: {},
});
const normal = definePartsStyle({
    button: {},
    list: {
        color: "white",
    },
    item: {
        backgroundColor: "transparent",
        color: "white",
    },
    groupTitle: {},
    command: {},
    divider: {},
});

const menu = defineMultiStyleConfig({ baseStyle, variants: { normal } });
export default menu;
