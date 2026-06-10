import { THEME_COLOR_EERIE_BLACK } from "@/constants/constants";
import { ColorObject } from "@/types";
import { getAvatarThemeColor } from "@/utils/themeUtil";
import { SystemStyleObject } from "@chakra-ui/react";

export const tableSx = {
    w: ["100%", "100%", "100%", "md", "md", "xl"],
};

export const tableHeaderSx = (
    avatarThemeColor: ColorObject,
    sx: SystemStyleObject
) => {
    return {
        py: 1,
        borderTop: "var(--chakra-borders-1px)",
        borderColor: "var(--chakra-colors-black)",
        color: getAvatarThemeColor(avatarThemeColor),
        fontSize: ["10px", "xs", "xs"],
        ...sx,
    };
};

export const tableBodySx = {
    "& tr": {
        _even: {
            backgroundColor: THEME_COLOR_EERIE_BLACK,
        },
    },
};
