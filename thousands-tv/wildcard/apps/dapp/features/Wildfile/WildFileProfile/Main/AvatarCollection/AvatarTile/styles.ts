import { BACKGROUND_COLOR_CRYPTO_PUNKS } from "@/constants/constants";

export const checkboxCss = {
    "& span": {
        border: "none",
        borderRadius: "none",
        borderColor: "transparent",
        "&[data-checked]": {
            background: "white",
            borderColor: "black",
            "&:hover": {
                background: "white",
                borderColor: "black",
                color: "black",
                border: "1px solid",
                borderRadius: "40px",
            },
            color: "black",
            border: "1px solid",
            borderRadius: "40px",
        },
        "&[data-indeterminate]": {
            background: "transparent",
            borderColor: "transparent",
            "&:hover": {
                background: "transparent",
                borderColor: "transparent",
            },
        },
    },
};

export const checkboxSx = {
    "& span": {
        w: ["1.25rem", "1.5rem"],
        h: ["1.25rem", "1.5rem"],
    },
    _hover: {
        cursor: "not-allowed",
    },
    _checked: {
        bg: "transparent",
    },
    position: "absolute",
    top: 2,
    left: 2,
};

export const heartCheckboxCss = (
    isChecked: boolean,
    isAvatarLoaded: boolean
) => {
    return {
        "& span": {
            border: "none",
            borderRadius: "none",
            borderColor: "transparent",
            "&[data-checked][data-hover]": {
                background: "white",
                borderColor: "black",
            },
            "&[data-checked][data-disabled]": {
                background: "white",
                borderColor: "black",
                color: "black",
            },
            "&[data-indeterminate]": {
                background: "white",
                borderColor: "black",
                "&:hover": {
                    background: "white",
                    borderColor: "black",
                },
                color: isChecked ? "black" : "white",
                border: "1px solid black",
                borderRadius: "40px",
            },
        },
        display: isAvatarLoaded ? "inline-flex" : "none",
    };
};

export const heartCheckboxSx = {
    "& span": {
        w: ["1.25rem", "1.5rem"],
        h: ["1.25rem", "1.5rem"],
    },
    _checked: {
        bg: "transparent",
    },
};

export const imageSx = (isAvatarLoaded: boolean) => {
    return {
        borderRadius: "4px",
        background: isAvatarLoaded
            ? BACKGROUND_COLOR_CRYPTO_PUNKS
            : "whiteAlpha.700",
    };
};

export const circularProgressSx = (isAvatarLoaded: boolean) => {
    return { opacity: isAvatarLoaded ? 0 : 1 };
};

export const avatarBox = (isSameImage: boolean) => {
    return {
        border: isSameImage ? "2px solid white" : "2px solid transparent",
        _hover: { border: "2px solid white" },
        cursor: isSameImage ? "not-allowed" : "pointer",
        borderRadius: "8px",
    };
};

export const avatarTileBoxSx = {
    position: "relative",
    minWidth: ["92px", "100px"],
};
