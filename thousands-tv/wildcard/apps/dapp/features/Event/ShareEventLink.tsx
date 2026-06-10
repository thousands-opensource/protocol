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
import axios from "axios";
import {
    AccessCodeType,
    AccessCodeIntent,
    TicketTierType,
} from "@repo/interfaces";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { THEME_COLOR_DARK_GOLD } from "@/constants/constants";

interface ShareEventLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventLink: string; // Base event link
    seriesId: string | null;
    organizationId?: string | null;
}

/**
 * Modal to generate and share event link with an access code.
 */
export default function ShareEventLinkModal({
    isOpen,
    onClose,
    eventLink,
    seriesId,
    organizationId,
}: ShareEventLinkModalProps) {
    const [codeType, setCodeType] = useState(AccessCodeType.SINGLE_USE);
    const [maxQuantity, setMaxQuantity] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");

    const [count, setCount] = useState(1);
    const [tier, setTier] = useState(TicketTierType.GENERAL_ADMISSION);

    const { onMessage } = useInfoNotifications();

    const handleOnClose = () => {
        onClose();
        setGeneratedLink("");
    };

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        try {
            const response = await axios.post(
                "/api/accessCode/generateAccessCode",
                {
                    codeType,
                    count: codeType === AccessCodeType.SINGLE_USE ? count : 1,
                    maxQuantity:
                        codeType === AccessCodeType.SINGLE_USE
                            ? 1
                            : maxQuantity,
                    tier,
                    seriesId,
                    organizationId: organizationId,
                    intent: AccessCodeIntent.TICKET,
                }
            );

            const accessCode = response.data.accessCodes[0];
            const fullLink = `${eventLink}?accessCode=${accessCode}`;
            setGeneratedLink(fullLink);
            onMessage({
                title: "Success",
                description: "Access code generated successfully!",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            onMessage({
                title: "Error",
                description: "Failed to generate access code.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        onMessage({
            title: "Copied!",
            description: "Event link copied to clipboard.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleOnClose} isCentered>
            <ModalOverlay />
            <ModalContent
                bg="blackAlpha.900"
                border="1px solid"
                borderColor="gray.600"
            >
                <ModalHeader>Share Event Link</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Select
                            value={codeType}
                            onChange={(e) =>
                                setCodeType(e.target.value as AccessCodeType)
                            }
                        >
                            <option value={AccessCodeType.SINGLE_USE}>
                                Single Use
                            </option>
                            <option value={AccessCodeType.MULTI_USE}>
                                Multi Use
                            </option>
                        </Select>
                        <Select
                            value={tier}
                            onChange={(e) =>
                                setTier(e.target.value as TicketTierType)
                            }
                        >
                            <option value={TicketTierType.GENERAL_ADMISSION}>
                                General Admission
                            </option>
                            <option value={TicketTierType.VIP}>VIP</option>
                            {/* Add other ticket tiers as needed */}
                        </Select>

                        {(codeType === AccessCodeType.MULTI_USE ||
                            codeType === AccessCodeType.VOUCHER) && (
                            <NumberInput
                                value={maxQuantity}
                                onChange={(_, value) => setMaxQuantity(value)}
                                min={1}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        )}
                        {generatedLink && (
                            <Box mt={4}>
                                <Text fontWeight="bold">Generated Link:</Text>
                                <Text
                                    sx={{
                                        color: THEME_COLOR_DARK_GOLD,
                                        fontSize: "sm",
                                    }}
                                >
                                    {generatedLink}
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        sx={{ width: "fit-content" }}
                        mr={3}
                        onClick={handleGenerateLink}
                        isLoading={isGenerating}
                    >
                        Generate Link
                    </Button>
                    <Button
                        onClick={handleCopyToClipboard}
                        isDisabled={!generatedLink}
                        sx={{
                            backgroundColor: THEME_COLOR_DARK_GOLD,
                            color: "white",
                            _hover: {
                                backgroundColor: "#a17700",
                                borderColor: "white",
                            },
                        }}
                    >
                        Copy to Clipboard
                    </Button>
                    <Button variant="ghost" onClick={handleOnClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
