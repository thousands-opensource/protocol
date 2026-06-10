// ***************************
// ChatAppControl Styles

import { CHAT_ACTION_PURPLE, CHAT_ACTION_RED } from "../../constants";

// ***************************
export const containerSx = {
    display: "flex",
    flexDirection: "row",
    // width: "335pt",
    height: "99pt",
    borderRadius: "13.5px",
    background: `linear-gradient(140deg, ${CHAT_ACTION_RED} 40%, ${CHAT_ACTION_PURPLE} 90%)`,
};

export const leftAppControl = {
    width: "40%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "8px 8px", // top/bottom, left/right padding
};

export const rightAppControl = {
    // width: "64%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "8px",
    // paddingRight: "10px",
};

// ***************************
// UserPointMetrics Styles
// ***************************
export const userPointMetricsSx = {
    borderRadius: "9.5px",
    background: "linear-gradient(140deg, #1B1B1BCC 60%, #232323CC 80%)",
    padding: "8px", // Optional padding for text content
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gap: 1,
};

// export const goldRingSx = {
//     backgroundColor: "transparent",
//     width: "30px",
//     height: "30px",
//     borderRadius: "50%",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     border: "2px solid #FFB400", // Gold ring
// };

// ***************************
// Boosts Section Styles
// ***************************
export const boostsContainerSx = {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // Distribute BoostHeader and buttons evenly
    padding: "8px", // Adjusted padding for consistency
};

export const boostsHeaderSx = {
    height: "15%", // Slightly increased to give enough room for text
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px", // Adjusted padding for fitting
    paddingBottom: "4px",
};

// ***************************
// Boost Buttons Styles
// ***************************
export const boostButtonsContainerSx = {
    flex: 1, // Remaining height
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    gap: "7px", // Add spacing between buttons
};

export const pointMultiplierContainerSx = {
    height: "100%", // Occupies the full height of the container
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
};

export const pointMultiplierDisplaySx = {
    height: "80%", // 4/5ths of the parent's vertical space
    width: "100%",
    borderRadius: "11px",
    background: "linear-gradient(140deg, #1B1B1B63 40%, #23232363 80%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "4px", // Adjusted padding for content
};

export const multiplierButtonSx = {
    height: "65%", // Occupies 65% of the vertical space
    width: "100%",
    minWidth: "55px",
    borderRadius: "7px",
    border: "1px solid #86D54F",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    // "Pressed" effect
    _active: {
        transform: "scale(0.95)", // Slightly compress the button
        boxShadow: "inset 0px 4px 8px rgba(0, 0, 0, 0.4)", // Creates an inset shadow to give a pressed look
    },
};

export const multiplierCostSx = {
    height: "31%", // Remaining space under Multiplier Button
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

export const multiplierDurationSx = {
    height: "20%", // Bottom container for the duration
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};
