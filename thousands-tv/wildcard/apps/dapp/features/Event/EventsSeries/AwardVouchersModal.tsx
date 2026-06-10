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
    Select,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Text,
    Box,
    VStack,
} from "@chakra-ui/react";
import { TicketTierType } from "@repo/interfaces";
import { selectTicketButtonSX } from "./styles";
import { useAwardVouchers } from "@/hooks/ticketQueue/useAwardVouchers";
import { CURRENT_SEASON_ID } from "../config";

interface AwardVouchersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMessage: (message: any) => void;
}

/**
 * Admin Tool to award access code vouchers to users
 */
export default function AwardVouchersModal({
    isOpen,
    onClose,
    onMessage,
}: AwardVouchersModalProps) {
    const [numberOfVouchersToAward, setNumberOfVouchersToAward] = useState(1);
    const [tier, setTier] = useState(TicketTierType.GENERAL_ADMISSION);
    const { awardVouchers, isLoading, error } = useAwardVouchers();

    const handleAwardVouchers = async () => {
        try {
            const awardedUsers = await awardVouchers({
                seriesId: CURRENT_SEASON_ID,
                numberOfVouchersToAward,
                tier,
            });
            onMessage({
                title: "Success",
                description: `Awarded vouchers to ${numberOfVouchersToAward} user${
                    numberOfVouchersToAward > 1 ? "s" : ""
                }`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            console.log("Users awarded vouchers:", awardedUsers);
        } catch (error) {
            onMessage({
                title: "Error",
                description: "Failed to award vouchers",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent
                bg="blackAlpha.900"
                border="1px solid"
                borderColor="gray.600"
            >
                <ModalHeader>Award Access Code Vouchers</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text>Number of Vouchers to Award:</Text>
                        <NumberInput
                            value={numberOfVouchersToAward}
                            onChange={(_, value) =>
                                setNumberOfVouchersToAward(value)
                            }
                            min={1}
                            max={100}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                        <Text>Ticket Tier:</Text>
                        <Select
                            value={tier}
                            onChange={(e) =>
                                setTier(e.target.value as TicketTierType)
                            }
                        >
                            {Object.values(TicketTierType).map((tierType) => (
                                <option key={tierType} value={tierType}>
                                    {tierType
                                        .replace(/-/g, " ")
                                        .replace(/\b\w/g, (char) =>
                                            char.toUpperCase()
                                        )}
                                </option>
                            ))}
                        </Select>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        sx={{ ...selectTicketButtonSX, width: "fit-content" }}
                        mr={3}
                        onClick={handleAwardVouchers}
                        isLoading={isLoading}
                    >
                        Award Vouchers
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
