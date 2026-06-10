import React, { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useToast,
} from "@chakra-ui/react";

interface TokenDistributionConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCall: (config: {
        totalTokens: number;
        maxTokensPerUser: number;
        numberOfUsersDistributed: number;
        minimumTokenEligibilityThreshold: number; // Minimum tokens threshold for a user to be eligible for distribution
    }) => void;
}

/**
 * TokenDistributionConfigModal allows an admin to configure the token distribution parameters.
 * It now includes a "Minimum Tokens Threshold" field.
 *
 * Validation:
 *  - Total Tokens must be at least 1.
 *  - Max Tokens Per User must be at least 1 and cannot exceed Total Tokens.
 *  - Number of Users Distributed must be at least 1 and no more than 10.
 *  - Minimum Tokens Threshold must be at least 1 and cannot exceed Total Tokens.
 *
 * @param props - The component props.
 * @returns A JSX element rendering the modal.
 */
const TokenDistributionConfigModal: React.FC<
    TokenDistributionConfigModalProps
> = ({ isOpen, onClose, onCall }) => {
    const toast = useToast();
    const defaultTotalTokens = 100;
    const defaultMaxTokensPerUser = 50;
    const defaultNumberOfUsersDistributed = 10;
    const defaultMinimumTokenEligibilityThreshold = 1;

    const [totalTokens, setTotalTokens] = useState<number>(defaultTotalTokens);
    const [maxTokensPerUser, setMaxTokensPerUser] = useState<number>(
        defaultMaxTokensPerUser
    );
    const [numberOfUsersDistributed, setNumberOfUsersDistributed] =
        useState<number>(defaultNumberOfUsersDistributed);
    const [minTokensEligibilityThreshold, setMinTokensEligibilityThreshold] =
        useState<number>(defaultMinimumTokenEligibilityThreshold);

    // Validate fields
    const isUsersExceeded = numberOfUsersDistributed > 10;
    const isMaxExceedingTotal = maxTokensPerUser > totalTokens;
    const isMinThresholdInvalid =
        minTokensEligibilityThreshold < 1 ||
        minTokensEligibilityThreshold > totalTokens;

    const isCallDisabled =
        isUsersExceeded || isMaxExceedingTotal || isMinThresholdInvalid;

    const handleCall = () => {
        if (isCallDisabled) {
            if (isUsersExceeded) {
                toast({
                    title: "Invalid configuration",
                    description:
                        "Number of users distributed cannot exceed 10.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } else if (isMaxExceedingTotal) {
                toast({
                    title: "Invalid configuration",
                    description:
                        "Max tokens per user cannot exceed total tokens.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } else if (isMinThresholdInvalid) {
                toast({
                    title: "Invalid configuration",
                    description:
                        "Minimum tokens threshold must be at least 1 and not exceed total tokens.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
            return;
        }
        onCall({
            totalTokens,
            maxTokensPerUser,
            numberOfUsersDistributed,
            minimumTokenEligibilityThreshold: minTokensEligibilityThreshold,
        });
        handleClose();
    };

    const handleClose = () => {
        // Reset to defaults on close.
        setTotalTokens(defaultTotalTokens);
        setMaxTokensPerUser(defaultMaxTokensPerUser);
        setNumberOfUsersDistributed(defaultNumberOfUsersDistributed);
        setMinTokensEligibilityThreshold(
            defaultMinimumTokenEligibilityThreshold
        );
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Token Distribution Settings</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={4}>
                        <FormLabel>Total Tokens to Distribute</FormLabel>
                        <NumberInput
                            value={totalTokens}
                            onChange={(valueString) =>
                                setTotalTokens(
                                    parseInt(valueString) || defaultTotalTokens
                                )
                            }
                            min={1}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Max Tokens Per User</FormLabel>
                        <NumberInput
                            value={maxTokensPerUser}
                            onChange={(valueString) =>
                                setMaxTokensPerUser(
                                    parseInt(valueString) ||
                                        defaultMaxTokensPerUser
                                )
                            }
                            min={1}
                            max={totalTokens}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        {isMaxExceedingTotal && (
                            <FormLabel color="red.500" mt={2}>
                                Max tokens per user cannot exceed total tokens.
                            </FormLabel>
                        )}
                    </FormControl>

                    <FormControl mb={4}>
                        <FormLabel>Minimum Tokens Threshold</FormLabel>
                        <NumberInput
                            value={minTokensEligibilityThreshold}
                            onChange={(valueString) =>
                                setMinTokensEligibilityThreshold(
                                    parseInt(valueString) ||
                                        defaultMinimumTokenEligibilityThreshold
                                )
                            }
                            min={1}
                            max={totalTokens}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        {isMinThresholdInvalid && (
                            <FormLabel color="red.500" mt={2}>
                                Minimum threshold must be at least 1 and not
                                exceed total tokens.
                            </FormLabel>
                        )}
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button
                        bgColor="#d2a522"
                        onClick={handleCall}
                        disabled={isCallDisabled}
                    >
                        Call
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default TokenDistributionConfigModal;
