import React from "react";
import { Box, Spinner, VStack, Text } from "@chakra-ui/react";
import { THEME_COLOR_YELLOW_DARK } from "@/constants/constants";

/**
 * Loading Spinner React Component with custom description
 */
export const LoadingSpinnerWithDescription = ({ description }: any) => {
    return (
        <VStack>
            <Box>
                <Spinner
                    size="xl"
                    color={THEME_COLOR_YELLOW_DARK}
                    mr={4}
                    mt={5}
                />
            </Box>
            <Box>
                <Text fontWeight={"extrabold"} color={THEME_COLOR_YELLOW_DARK}>
                    {description}
                </Text>
            </Box>
        </VStack>
    );
};
