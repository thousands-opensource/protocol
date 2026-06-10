import { SystemStyleObject } from "@chakra-ui/react";

export const modalContentSx: SystemStyleObject = {
    h: ["568px", "736px", "736px", "341px", "341px"],
    background: "transparent",
};

export const modalBodySx: SystemStyleObject = {
    h: "100%",
    p: 0,
};

export const newFeatureFlexBackgroundSx: SystemStyleObject = {
    p: ["10px 30px 10px 25px", "10px 30px", "10px 30px", 2],
    h: "200%",
    backgroundImage: [
        "url(/images/WildfileAssets/Collections/modal/Vertical_Stripe_Modal.webp)",
        "url(/images/WildfileAssets/Collections/modal/Vertical_Stripe_Modal.webp)",
        "url(/images/WildfileAssets/Collections/modal/Vertical_Stripe_Modal.webp)",
        "url(/images/WildfileAssets/Collections/modal/Horizontal_Stripe_Modal.webp)",
        "url(/images/WildfileAssets/Collections/modal/Horizontal_Stripe_Modal.webp)",
    ],
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center",
    backgroundSize: "contain",
    borderRadius: ["24px", "24px", "24px", "unset"],
};

export const newFeatureFlexSx: SystemStyleObject = {
    h: "100%",
    flexGrow: 1,
    flexDir: ["column", "column", "column", "row"],
    position: "relative",
    borderRadius: "24px",
    p: 5,
};

export const newFeatureLeftPanelSx: SystemStyleObject = {
    width: "100%",
    display: "flex",
    flexDir: "column",
    h: "100%",
    pt: 5,
};

export const newFeatureTextWrapperSx: SystemStyleObject = {
    flexGrow: 1,
    display: "flex",
    flexDir: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    rowGap: 5,
    pl: [5, 5, 5, 10],
};

export const newFeatureDescriptionSx: SystemStyleObject = {
    color: "#b47700",
    fontSize: ["12px", "14px"],
};

export const exploreMoreSx: SystemStyleObject = {
    minW: 52,
    justifyContent: "space-between",
    color: "white",
    bg: "linear-gradient(to right, #D69D36, #B07728, #894B19)",
    h: [8, 8, 8, 10],
    lineHeight: 1,
    _hover: { opacity: 0.8, border: "1px solid white" },
    zIndex: "popover",
    WebkitJustifyContent: "center",
};

export const imgWrapperSx: SystemStyleObject = {
    display: "flex",
    position: "relative",
    width: "100%",
    height: "100%",
};

export const lockeImgSx: SystemStyleObject = {
    w: "auto",
    height: "auto",
    position: "absolute",
    transform: [
        "translate(-50%, -50%) scale(2)",
        "translate(-50%, -50%) scale(2)",
        "translate(-50%, -50%) scale(2)",
        "translate(-50%, -50%) scale(1.45)",
        "translate(-50%, -50%) scale(1.45)",
        "translate(-50%, -50%) scale(1.45)",
    ],
    top: ["49%", "50%", "50%", "27%"],
    left: ["25%", "25%", "25%", "35%"],
    zIndex: "popover",
};
