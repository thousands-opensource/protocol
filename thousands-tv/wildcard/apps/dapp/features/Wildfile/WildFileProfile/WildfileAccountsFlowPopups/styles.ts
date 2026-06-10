import { THEME_COLOR_SECONDARY } from "@/constants";
import { ConnectedAccountGridItem } from "@/pages/[serverCode]/wildfile/profile/[tab]/_ui/connected-accounts";
import { SystemStyleObject } from "@chakra-ui/react";
import { IUser } from "@repo/interfaces";

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

// connected accounts sx
export const linkWalletButtonSX = {
    width: "full",
    bg: "glass.bg",
    border: "1px solid",
    borderColor: THEME_COLOR_SECONDARY,
};

// show the connected account grid item
export const connectedAccountGridItem = (
    userDB: IUser,
    provider: ConnectedAccountGridItem,
    isAccountConnected: boolean,
    THEME_COLOR_SECONDARY: string
) => ({
    w: "250px",
    borderWidth: userDB.preferredProvider === provider.type ? "3px" : "1px",
    borderRadius: "lg",
    p: 4,
    textAlign: "center",
    opacity: isAccountConnected ? "0.8" : "",
    borderColor:
        userDB.preferredProvider === provider.type ? THEME_COLOR_SECONDARY : "",
    position: "relative",
});

export const connectedAccountFlex = {
    flexDirection: "column",
    alignItems: "space-between",
    h: "100%",
};

export const connectedAccountText = (isAccountConnected: boolean) => ({
    fontSize: "sm",
    mb: 3,
    color: isAccountConnected ? "gray.500" : "white",
});

export const connectedAccountsCard = {
    borderRadius: "lg",
    p: 4,
    mb: 4,
    shadow: "sm",
    bg: "unset",
    color: "white",
    w: "100%",
};

export const connectedAccountsCardGrid = (
    isWalletRequired: boolean,
    isWalletConnected: boolean
) => ({
    alignItems: "center",
    justifyContent: "center",
    templateColumns:
        isWalletRequired && !isWalletConnected ? "1fr" : "repeat(3, 1fr)",
});
