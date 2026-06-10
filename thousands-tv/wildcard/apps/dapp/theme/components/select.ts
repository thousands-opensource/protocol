import { selectAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(selectAnatomy.keys);

const baseStyle = definePartsStyle({
    field: {
        bg: "brand.darkGray",
        borderRadius: "10px",
        outline: "none",
        fontFamily: "body",
        focusBorderColor: "transparent",
        _focus: { outline: "none" },
        _active: { outline: "none" },
        _placeholder: { fontSize: "14px" },
        border: "none",
    },
    icon: {
        color: "primary.400",
    },
});

export const Select = defineMultiStyleConfig({ baseStyle });
