import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { THEME_COLOR_DARK_ONYX } from "@/constants/constants";
import { poppinsBold } from "@/utils/themeUtil";

interface CombinedCreditsScoreProps {
    credits: number | undefined;
}

/**
 * Formatted Combined Credit Score Component with padded leading zeros
 */

const CombinedCreditsScore: React.FC<CombinedCreditsScoreProps> = ({
    credits,
}) => {
    if (credits === undefined) {
        return null;
    }

    const formattedCredit = credits?.toString();
    const totalMissingLeadingZeros = 6 - formattedCredit.length;
    const paddedFormattedCredit = formattedCredit.padStart(6, "0");
    const formattedCreditList = paddedFormattedCredit.split("");
    let numMissingLeadingZeros = 0;

    return (
        <>
            {formattedCreditList.map((digit, index) => {
                let color = "white";
                if (numMissingLeadingZeros < totalMissingLeadingZeros) {
                    color = THEME_COLOR_DARK_ONYX;
                    numMissingLeadingZeros += 1;
                }

                return (
                    <Flex flexDirection={"column"} key={index}>
                        <Text
                            key={`${paddedFormattedCredit}-${index}`}
                            className={poppinsBold.className}
                            sx={{
                                color: color,
                                fontSize: "26px",
                                width: "18px",
                                textAlign: "center",
                            }}
                        >
                            {digit}
                        </Text>
                    </Flex>
                );
            })}
        </>
    );
};

export default CombinedCreditsScore;
