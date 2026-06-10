const smFontSize = ["xs", "xs", "sm", "md"];
const lgFontSize = ["xl", "2xl", "3xl", "4xl"];

/**
 * @param smSize - whether the text should be small
 * @param color - font color to use
 * @returns sx object
 */
export const labelSx = (smSize: boolean, color?: string) => {
    const fontSize = smSize ? smFontSize : lgFontSize;
    return {
        mt: 1,
        fontSize,
        color: color || "white",
        textTransform: "uppercase",
    };
};
