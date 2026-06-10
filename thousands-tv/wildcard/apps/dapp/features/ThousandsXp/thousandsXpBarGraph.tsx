import { Box, Flex, Text } from "@chakra-ui/react";
import React from "react";

export interface ThousandsXpBarGraphProps {
    thousandsXp?: number | null;
}

const ThousandsXpBarGraph: React.FC<ThousandsXpBarGraphProps> = ({
    thousandsXp = 0,
}) => {
    const safeXp = Math.max(0, thousandsXp ?? 0);
    const level = safeXp > 0 ? Math.ceil(safeXp / 1000) : 1;
    const progressWithinLevel = safeXp % 1000;
    const progressPercent = Math.min(progressWithinLevel / 1000, 1);

    return (
        <Box
            bg="rgba(15, 20, 45, 0.65)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.2)"
            borderRadius="2xl"
            backdropFilter="blur(12px)"
            boxShadow="0 20px 60px rgba(0,0,0,0.25)"
            p={{ base: 4, md: 6 }}
            color="white"
        >
            <Flex
                alignItems="center"
                justifyContent="space-between"
                mb={3}
                flexWrap="wrap"
                gap={2}
            >
                <Text fontSize="lg" fontWeight="bold">
                    Level {level}
                </Text>
                <Text fontSize="md" opacity={0.9}>
                    {safeXp.toLocaleString()} Thousands XP
                </Text>
            </Flex>
            <Box
                w="100%"
                h={3}
                borderRadius="full"
                bg="rgba(255,255,255,0.2)"
                overflow="hidden"
            >
                <Box
                    h="100%"
                    borderRadius="full"
                    bgGradient="linear(90deg, #FF5BEF, #FF0030)"
                    width={`${progressPercent * 100}%`}
                    transition="width 0.3s ease"
                />
            </Box>
            <Text mt={2} fontSize="sm" opacity={0.8}>
                {Math.round(progressPercent * 100)}% to next level
            </Text>
        </Box>
    );
};

export default ThousandsXpBarGraph;
