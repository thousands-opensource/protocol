import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
    containerSx,
    rightFlexSx,
    scoreLevelFlexSx,
    sliderBoxSx,
    sliderContainerBoxSx,
    streamBoostSx,
} from "./styles";
import { removeTrailingZeros } from "@/utils/util";
import { ChatApp } from "@repo/interfaces";

interface StreamScoreProps {
    streamScorePercentToNextLevel: number;
    streamScoreLevel: number;
    streamScoreBoostMultiplayer: number;
    chatApp: ChatApp;
}

const StreamScore: React.FC<StreamScoreProps> = ({
    streamScorePercentToNextLevel,
    streamScoreLevel,
    streamScoreBoostMultiplayer,
    chatApp,
}) => {
    if (chatApp !== ChatApp.WILDCARD) {
        return null;
    }

    return (
        <Flex sx={containerSx}>
            <Flex align="center" mr={1}>
                <Text sx={streamBoostSx}>Stream Boost</Text>
            </Flex>

            <Flex sx={rightFlexSx}>
                <Text color="white" fontWeight="bold" pr={3} mr={8}>
                    {removeTrailingZeros(streamScoreBoostMultiplayer)}x
                </Text>
                <Box id="slider-container-box" sx={sliderContainerBoxSx}>
                    <Box
                        w={`${streamScorePercentToNextLevel * 100}%`}
                        sx={sliderBoxSx}
                    />
                    <Flex sx={scoreLevelFlexSx}>
                        <Text color="white" fontWeight="bold">
                            {String(streamScoreLevel).padStart(2, "0")}
                        </Text>
                    </Flex>
                </Box>
            </Flex>
        </Flex>
    );
};

export default StreamScore;
