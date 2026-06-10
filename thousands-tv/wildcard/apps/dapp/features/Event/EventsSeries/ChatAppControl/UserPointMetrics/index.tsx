import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { userPointMetricsSx } from "../styles";
import { poppinsBold, poppinsMedium, poppinsRegular } from "@/utils/themeUtil";
import { THEME_COLOR_DARK_ONYX } from "@/constants/constants";

interface UserPointMetricsProps {
    totalPoints: number;
    pointsPerSecond: string;
    rank: number;
}

const UserPointMetrics: React.FC<UserPointMetricsProps> = ({
    totalPoints,
    pointsPerSecond,
    rank,
}) => {
    // Render Total Points Label
    const renderTotalPointsLabelJSX = () => (
        <Flex alignItems={"center"} gap={1} mb="-5px">
            <Text fontSize="8pt" className={poppinsRegular.className}>
                Total Points
            </Text>
            {renderPointsIconJSX()}
        </Flex>
    );

    const renderPointsIconJSX = () => (
        <Box
            as="img"
            src="/images/ChatAppControl/points-icon.svg"
            alt="credits icon"
            width="10pt"
            height="10pt"
        />
    );

    /**
     * Render styled personal credit
     * @returns formated personal credit
     */
    const renderFormattedPersonalCredit = () => {
        const formattedPersonalCredit = totalPoints.toString();
        const formattedPersonalCreditList = formattedPersonalCredit.split("");
        return formattedPersonalCreditList.map((digit, index) => {
            let color = "white";

            return (
                <Text
                    key={`${formattedPersonalCredit}-${index}`}
                    className={poppinsBold.className}
                    sx={{
                        color: color,
                        fontSize: "20pt",
                        textAlign: "center",
                        w: "18px",
                        mb: "-10px",
                    }}
                >
                    {digit}
                </Text>
            );
        });
    };

    // Render Total Points Value
    const renderTotalPointsValueJSX = () => (
        <Text
            fontSize="20pt"
            className={poppinsBold.className}
            sx={{ marginBottom: "-10px" }}
        >
            {totalPoints}
        </Text>
    );

    // Render Points Per Second
    const renderPointsPerSecondJSX = () => (
        <Flex gap={1}>
            <Text
                fontSize="11pt"
                className={poppinsMedium.className}
                color="#FF6A45"
            >
                {pointsPerSecond}
            </Text>
            <Text
                fontSize="8pt"
                className={poppinsMedium.className}
                color="#FF6A45"
                position="relative"
                top="4px"
            >
                pts/sec
            </Text>
        </Flex>
    );

    // Render Rank Badge
    const renderRankBadgeJSX = () => (
        <Flex justifyContent="flex-start" alignItems="center">
            <Box
                sx={{
                    backgroundColor: "transparent",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "2px solid #FFB400", // Gold ring
                }}
            >
                <Text
                    fontSize="12pt"
                    color="white"
                    className={poppinsBold.className}
                >
                    {rank}
                </Text>
            </Box>
            <Text
                fontSize="8pt"
                color="#FFB400"
                className={poppinsMedium.className}
                ml={1}
            >
                Rank
            </Text>
        </Flex>
    );

    return (
        <Box sx={userPointMetricsSx}>
            <Flex flexDirection="column">
                {renderTotalPointsLabelJSX()}
                <Flex>{renderFormattedPersonalCredit()}</Flex>
                {renderPointsPerSecondJSX()}
            </Flex>
            {renderRankBadgeJSX()}
        </Box>
    );
};

export default UserPointMetrics;
