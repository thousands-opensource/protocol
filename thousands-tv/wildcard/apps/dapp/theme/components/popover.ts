import { popoverAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
import { blurredBackground } from "./shared";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(parts.keys);

const baseStyle = definePartsStyle({
    body: {
        color: "white",
        backgroundColor: "transparent",
    },
    content: {
        color: "white",
        padding: 3,
        mr: 1,
        ...blurredBackground,
    },
    arrow: {
        bg: "rgba(29, 30, 43, 0.498) !important",
        backdropFilter:
            "blur(10px) saturate(190%) contrast(70%) brightness(80%)",
    },
});

export const Popover = defineMultiStyleConfig({ baseStyle });
