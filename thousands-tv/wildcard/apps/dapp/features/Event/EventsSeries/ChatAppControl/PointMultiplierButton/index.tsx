import React from "react";
import { Flex, Text, Box } from "@chakra-ui/react";
import {
    pointMultiplierContainerSx,
    pointMultiplierDisplaySx,
    multiplierButtonSx,
    multiplierCostSx,
    multiplierDurationSx,
} from "../styles";
import {
    azeretMonoMedium,
    poppinsBold,
    poppinsMedium,
} from "@/utils/themeUtil";

interface PointMultiplierButtonProps {
    command: string;
    multiplier: number;
    buttonCost: number;
    buttonSeconds: number;
    background: string; // Background color or gradient
    borderColor: string; // Border color
    onClick: (command: string) => void;
}

const PointMultiplierButton: React.FC<PointMultiplierButtonProps> = ({
    command,
    multiplier,
    buttonCost,
    buttonSeconds,
    background,
    borderColor,
    onClick,
}) => {
    // Render coin icon JSX
    const renderCoinIconJSX = () => {
        return (
            <Box w="8pt" h="8pt" bg="#FFB400" borderRadius="full" ml="4px" />
        );
    };

    // Render multiplier display JSX
    const renderMultiplierButtonJSX = () => {
        return (
            <Flex
                sx={{
                    ...multiplierButtonSx,
                    background,
                    border: `1.5px solid ${borderColor}`,
                }}
                justifyContent="center"
                alignItems="center"
                onClick={() => onClick(command)}
            >
                <Text
                    fontSize="24pt"
                    className={poppinsBold.className}
                    lineHeight="1"
                    textAlign="center"
                >
                    {multiplier}
                </Text>
                <Text
                    fontSize="20pt"
                    className={poppinsBold.className}
                    lineHeight="1"
                    position="relative"
                    top="2px"
                >
                    x
                </Text>
            </Flex>
        );
    };

    // Render multiplier cost JSX
    const renderMultiplierCostJSX = () => {
        return (
            <Flex
                sx={multiplierCostSx}
                justifyContent="center"
                alignItems="center"
            >
                <Text
                    fontSize="11pt"
                    className={azeretMonoMedium.className}
                    color="white"
                >
                    {buttonCost}
                </Text>
                {renderCoinIconJSX()}
            </Flex>
        );
    };

    // Render multiplier duration JSX
    const renderMultiplierDurationJSX = () => {
        return (
            <Flex
                sx={multiplierDurationSx}
                justifyContent="center"
                alignItems="center"
                paddingTop={1}
            >
                <Text
                    fontSize="8pt"
                    className={poppinsMedium.className}
                    color="#FF6A45"
                >
                    {Math.floor(buttonSeconds / 60)}:
                    {String(buttonSeconds % 60).padStart(2, "0")}
                </Text>
            </Flex>
        );
    };

    return (
        <Flex
            sx={pointMultiplierContainerSx}
            flexDirection="column"
            justifyContent="space-between"
            alignItems="center"
        >
            {/* Top Container */}
            <Flex
                sx={pointMultiplierDisplaySx}
                flexDirection="column"
                justifyContent="flex-end"
            >
                {renderMultiplierButtonJSX()}
                {renderMultiplierCostJSX()}
            </Flex>
            {renderMultiplierDurationJSX()}
        </Flex>
    );
};

export default PointMultiplierButton;
