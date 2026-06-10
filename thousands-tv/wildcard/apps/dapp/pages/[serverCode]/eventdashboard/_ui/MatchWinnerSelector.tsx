import React, { useState } from "react";
import {
    Box,
    Button,
    Flex,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Text,
    Icon,
    useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDownIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { FaTrophy } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { getSetWinnerEndpoint } from "@/utils/environmentUtil";

interface TeamOption {
    value: string;
    label: string;
    color: string;
}

interface MatchWinnerSelectorProps {
    stageId: string;
    onWinnerSet?: (winner: string) => void;
}

/**
 * Selector component for choosing the match winner (Red or Blue team).
 */
const MatchWinnerSelector: React.FC<MatchWinnerSelectorProps> = ({
    stageId,
    onWinnerSet,
}) => {
    const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { onMessage } = useInfoNotifications();

    const buttonHoverBgColor = useColorModeValue("gray.200", "gray.600");

    const teams: TeamOption[] = [
        { value: "red", label: "Red Team", color: "red.500" },
        { value: "blue", label: "Blue Team", color: "blue.500" },
    ];

    const handleSelectTeam = (team: TeamOption) => {
        setSelectedTeam(team);
        setIsSuccess(false);
    };

    const handleSetWinner = async () => {
        if (!selectedTeam) {
            onMessage({
                title: "No team selected",
                description: "Please select either Red or Blue team first",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );

            if (!wildcardAccessToken) {
                throw new Error("Authentication token not found");
            }

            /*
            const response = await axios.post(
                "/api/events/setWinner",
                {
                    team: selectedTeam.value,
                    stageId: stageId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            */

            if (!confirm(`Are you sure you want to set "${selectedTeam.value}" as the winner?`))
            {
                return;
            }

            const setWinnerEndpoint = getSetWinnerEndpoint();

            const awsResponse = await axios.post(
                setWinnerEndpoint,
                {
                    stageId,
                    segment: 0,
                    teamName: selectedTeam.value,
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (awsResponse.data.Success) {
                setIsSuccess(true);
                onMessage({
                    title: "Winner set successfully!",
                    description: `${selectedTeam.label} has been declared the winner`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top",
                });

                if (onWinnerSet) {
                    onWinnerSet(selectedTeam.value);
                }
            } else {
               setIsSuccess(false);
                onMessage({
                    title: "Winner not set!",
                    description: awsResponse.data.ErrorMessage || "Failed to set winner",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "top",
                });

            }
        } catch (error: any) {
            onMessage({
                title: "Error setting winner",
                description: error.message || "An unexpected error occurred",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={5}
            shadow="md"
            width="100%"
            maxWidth="400px"
            position="relative"
        >
            <Flex direction="column" gap={4}>
                <Flex justifyContent="center" alignItems="center" gap={2}>
                    <Icon
                        as={FaTrophy}
                        color={useColorModeValue("yellow.400", "yellow.300")}
                        w={6}
                        h={6}
                    />
                    <Text fontSize="xl" fontWeight="bold">
                        Declare Match Winner
                    </Text>
                </Flex>

                <Flex gap={3} alignItems="center">
                    <Menu placement="bottom">
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            width="full"
                            colorScheme={selectedTeam ? undefined : "gray"}
                            bg={
                                selectedTeam
                                    ? `${selectedTeam.color}`
                                    : "gray.500"
                            }
                            color={selectedTeam ? "white" : undefined}
                            _hover={{
                                bg: selectedTeam
                                    ? `${selectedTeam.value}.600`
                                    : buttonHoverBgColor,
                            }}
                        >
                            {selectedTeam ? selectedTeam.label : "Select Team"}
                        </MenuButton>
                        <MenuList zIndex={10}>
                            {teams.map((team) => (
                                <MenuItem
                                    key={team.value}
                                    onClick={() => handleSelectTeam(team)}
                                    color={team.color}
                                    fontWeight="medium"
                                >
                                    {team.label}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>

                    <Button
                        sx={{
                            bgColor: "#d2a522",
                        }}
                        onClick={handleSetWinner}
                        isLoading={isSubmitting}
                        leftIcon={isSuccess ? <CheckCircleIcon /> : undefined}
                        isDisabled={!selectedTeam || isSuccess}
                        width="160px"
                    >
                        {isSuccess ? "Winner Set" : "Set Winner"}
                    </Button>
                </Flex>

                {isSuccess && (
                    <Box
                        mt={2}
                        p={3}
                        borderRadius="md"
                        bg={`${selectedTeam?.value}.100`}
                        color={`${selectedTeam?.value}.800`}
                        textAlign="center"
                    >
                        <Flex
                            alignItems="center"
                            justifyContent="center"
                            gap={2}
                        >
                            <CheckCircleIcon />
                            <Text fontWeight="medium">
                                {selectedTeam?.label} declared winner!
                            </Text>
                        </Flex>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};

export default MatchWinnerSelector;
