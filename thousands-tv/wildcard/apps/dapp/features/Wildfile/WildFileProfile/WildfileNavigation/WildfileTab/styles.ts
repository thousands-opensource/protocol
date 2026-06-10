import { THEME_COLOR_SECONDARY } from "@/constants";
import { ColorObject } from "@/types";
import { border } from "@chakra-ui/react";

export const ghostTabButton = (
    avatarThemeColor: ColorObject | undefined,
    isSelected: boolean
) => {
    if (!avatarThemeColor) {
        return {};
    } else {
        return {
            display: "flex",
            flexDir: "column",
            justifyContent: [
                "center",
                "center",
                "center",
                "center",
                "flex-end",
                "center",
            ],
            alignItems: "center",
            paddingX: 0,
            mb: 0,
            minW: 20,
            color: "whiteAlpha.700",

            opacity: 0.7,

            "&[aria-selected=true]": {
                opacity: 1,
                color: "white",
                borderBottom: "3px solid",
                borderColor: THEME_COLOR_SECONDARY,
            },
            _hover: {
                "--tabs-color": isSelected ? "white" : "white",
                opacity: 1,
            },
            _focus: {
                outline: "none",
                background: "none",
            },
            _active: {
                outline: "none",
                background: "none",
            },
            fontSize: ["xs", "xs", "md", "md"],
        };
    }
};
