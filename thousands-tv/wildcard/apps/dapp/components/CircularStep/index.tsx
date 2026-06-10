import {
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_GREY,
    THEME_GRADIENT_GOLD_TWO_TONE,
} from "@/constants/constants";
import { CheckIcon } from "@chakra-ui/icons";
import { Box, Center, CenterProps, Icon, Text } from "@chakra-ui/react";
import {
    circularStepCenterSx,
    circularStepCompleteSx,
    circularStepContainerSx,
    circularStepTextSx,
    circularStepUncompletedSx,
} from "./styles";

interface CircularStepProps extends CenterProps {
    text: string;
    isStepEnabled: boolean;
    isCompleted?: boolean;
}

/**
 * Render a circular step indicating progression status
 */
const CircularStep = ({
    text,
    isStepEnabled,
    isCompleted = false,
    ...rest
}: CircularStepProps) => {
    const renderCircularStep = () => {
        if (isCompleted) {
            return (
                <Box {...circularStepCompleteSx}>
                    <Icon as={CheckIcon} fontSize="18px" />
                </Box>
            );
        }

        return (
            <Box {...circularStepUncompletedSx}>
                <Text sx={circularStepTextSx}>{text}</Text>
            </Box>
        );
    };

    const renderBorder = () => {
        if (isCompleted) return `2px solid ${THEME_GRADIENT_GOLD_TWO_TONE}`;
        if (isStepEnabled) {
            return `2px solid ${THEME_COLOR_DARK_GOLD}`;
        }

        return `2px solid ${THEME_COLOR_GREY}`;
    };

    return (
        <Center
            border={renderBorder()}
            sx={circularStepCenterSx}
            w={rest.w || circularStepContainerSx}
            h={rest.h || circularStepContainerSx}
            {...rest}
        >
            {renderCircularStep()}
        </Center>
    );
};
export default CircularStep;
