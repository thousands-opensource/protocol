import {
    CHAT_ACTION_PURPLE,
    CHAT_ACTION_RED,
} from "@/features/Event/constants";
import { position, theme } from "@chakra-ui/react";

export const containerSx = {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderRadius: "15.5px",
    background: `linear-gradient(140deg, ${CHAT_ACTION_RED} 40%, ${CHAT_ACTION_PURPLE} 90%)`,
    padding: theme.space[1.5],
};

export const streamBoostSx = {
    color: "white",
    fontSize: "0.6em",
    textAlign: "center",
    maxWidth: "50px",
};

export const rightFlexSx = {
    borderRadius: theme.radii["xl"],
    flex: 1,
    padding: theme.space[2.5],
    paddingLeft: theme.space[3],
    alignItems: "center",
    background: `linear-gradient(140deg, #701517 40%, #351048 90%)`,
};

export const sliderContainerBoxSx = {
    position: "relative",
    flex: 1,
    h: 6,
    bgColor: "black",
    borderRadius: "full",
};

export const scoreLevelFlexSx = {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: "full",
    top: "-6px",
    left: "-32px",
    backgroundColor: "black",
    border: "2px solid #00BA56",
    alignItems: "center",
    justifyContent: "center",
};

export const sliderBoxSx = {
    position: "absolute",
    height: "full",
    minWidth: "5px",
    borderRightRadius: "full",
    bgGradient: "linear(to-r, green.500, cyan.500)",
};
