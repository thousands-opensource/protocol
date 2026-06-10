import React from 'react';
import {
    Box,
    Button,
    Flex,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Stack,
    Text,
    VStack,
} from '@chakra-ui/react';
import { THEME_COLOR_DARK_GOLDEN_YELLOW } from '@/constants/constants';

type TierName = 'Legendary Suite' | 'Champion Box' | 'Elite Skybox' | 'Victory Lounge' | 'Warrior Den';

const SKYBOX_COLORS = [
    '#FFD700', // Metallic Gold
    '#C0C0C0', // Shimmering Silver
    '#CD7F32', // Bronze
    '#9966CC', // Amethyst Purple
    '#36454F'  // Charcoal
] as const;

const DEFAULT_TIERS: TierName[] = [
    'Legendary Suite',
    'Champion Box',
    'Elite Skybox',
    'Victory Lounge',
    'Warrior Den'
];

export type SkyboxTier = {
    id: string;
    name: TierName;
    color: string;
    boxCount: number;
};

type SkyboxConfigSectionProps = {
    skyboxTiers: SkyboxTier[];
    setSkyboxTiers: React.Dispatch<React.SetStateAction<SkyboxTier[]>>;
    onSave: () => void;
};

export const SkyboxConfigSection: React.FC<SkyboxConfigSectionProps> = ({
    skyboxTiers,
    setSkyboxTiers,
    onSave
}) => {
    const handleUpdateTier = (id: string, field: keyof SkyboxTier, value: string | number) => {
        setSkyboxTiers(prev => {
            const updatedTiers = [...prev];
            const tierIndex = updatedTiers.findIndex(tier => tier.id === id);
            if (tierIndex >= 0) {
                updatedTiers[tierIndex] = {
                    ...updatedTiers[tierIndex],
                    [field]: value
                };
            }
            return updatedTiers;
        });
    };

    // Ensure we always have all 4 tiers
    React.useEffect(() => {
        const existingTiers = [...skyboxTiers];
        const updatedTiers = DEFAULT_TIERS.map((name, index) => {
            const existingTier = existingTiers.find(tier => tier.id === (index + 1).toString());
            return existingTier || {
                id: (index + 1).toString(),
                name,
                color: SKYBOX_COLORS[index],
                boxCount: 0
            };
        });
        setSkyboxTiers(updatedTiers);
    }, []);

    return (
        <Stack
            sx={{
                padding: "40px",
                borderRadius: "16px",
                border: "1px solid gray",
            }}
        >
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Text fontSize="2xl" fontWeight="black">
                    Skybox Configuration
                </Text>
            </Flex>

            <VStack spacing={4} align="stretch">
                {DEFAULT_TIERS.map((tierName, index) => {
                    const tier = skyboxTiers.find(t => t.id === (index + 1).toString()) || {
                        id: (index + 1).toString(),
                        name: tierName,
                        color: SKYBOX_COLORS[index],
                        boxCount: 0
                    };

                    return (
                        <Flex key={tier.id} gap={4} alignItems="center">
                            <Box
                                w="4px"
                                h="24px"
                                bg={tier.color}
                                borderRadius="full"
                            />
                            <Text minW="150px" fontWeight="semibold">
                                {tier.name}
                            </Text>
                            <NumberInput
                                value={tier.boxCount}
                                onChange={(_, value) => handleUpdateTier(tier.id, 'boxCount', value)}
                                size="sm"
                                maxW="100px"
                                min={0}
                                max={20}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <Text fontSize="sm" color="gray.400">
                                boxes
                            </Text>
                        </Flex>
                    );
                })}
            </VStack>

            <Flex justifyContent="flex-end" mt={4}>
                <Button
                    onClick={onSave}
                    bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                    size="sm"
                >
                    Save Configuration
                </Button>
            </Flex>
        </Stack>
    );
};