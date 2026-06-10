import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/styled-system";
import { blurredBackground } from "./shared";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(parts.keys);

const baseStyle = definePartsStyle({
    overlay: {
        bg: "rgba(0, 0, 0, 0.6)",
    },
    dialog: {
        color: "white",
        ...blurredBackground,
    },
});

export const Modal = defineMultiStyleConfig({
    baseStyle,
});
