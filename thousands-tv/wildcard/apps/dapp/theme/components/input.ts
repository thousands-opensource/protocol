import { inputAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(inputAnatomy.keys);

const baseStyle = definePartsStyle({
    field: {
        bg: "brand.darkGray",
        borderRadius: "lg",
        outline: "none",
        fontFamily: "body",
        focusBorderColor: "transparent",
        _focus: { outline: "none" },
        _active: { outline: "none" },
        _placeholder: {
            fontSize: "sm",
        },
        border: "none",
    },
});

export const Input = defineMultiStyleConfig({ baseStyle });
