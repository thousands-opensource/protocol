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
    TicketTierType,
    AccessCodeIntent,
} from "@repo/interfaces"; // Import AccessCodeIntent
import { selectTicketButtonSX } from "./styles";
import { CSVLink } from "react-csv";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";

interface TicketAccessCodeGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId?: string | null;
    seriesId: string | null;
}

/**
 * Admin tool to generate ticket access codes for an event
 */
export default function TicketAccessCodeGenerationModal({
    isOpen,
    onClose,
    organizationId,
    seriesId,
}: TicketAccessCodeGenerationModalProps) {
    const [codeType, setCodeType] = useState(AccessCodeType.SINGLE_USE);
    const [count, setCount] = useState(1);
    const [maxQuantity, setMaxQuantity] = useState(1);
    const [tier, setTier] = useState(TicketTierType.GENERAL_ADMISSION);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
    const [csvData, setCSVData] = useState<{ "Access Code": string }[]>([]);

    const { onMessage } = useInfoNotifications();

    const handleOnClose = () => {
        onClose();
        setGeneratedCodes([]);
        setCSVData([]);
    };

    const handleGenerateAccessCodes = async () => {
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
                    organizationId,
                    intent: AccessCodeIntent.TICKET,
                }
            );
            const codes = response.data.accessCodes;
            setGeneratedCodes(codes);
            setCSVData(codes.map((code: any) => ({ "Access Code": code })));
            onMessage({
                title: "Success",
                description: `Generated ${codes.length} access code(s)`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            onMessage({
                title: "Error",
                description: "Failed to generate access codes",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const getCSVFilename = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        return `access_codes_${codeType}_${tier}_${timestamp}.csv`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent
                bg="blackAlpha.900"
                border="1px solid"
                borderColor="gray.600"
            >
                <ModalHeader>Generate Access Codes</ModalHeader>
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
                        {codeType === AccessCodeType.SINGLE_USE && (
                            <NumberInput
                                value={count}
                                onChange={(_, value) => setCount(value)}
                                min={1}
                                max={100}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        )}
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
                        {generatedCodes.length > 0 && (
                            <Box mt={4}>
                                <Text fontWeight="bold">Generated Codes:</Text>
                                <Box
                                    maxHeight="300px"
                                    overflowY="auto"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    p={2}
                                    borderRadius="md"
                                >
                                    {generatedCodes.map((code, index) => (
                                        <Text key={index}>{code}</Text>
                                    ))}
                                </Box>
                                <CSVLink
                                    data={csvData}
                                    filename={getCSVFilename()}
                                    className="chakra-button css-4xx2wk"
                                    style={{
                                        ...selectTicketButtonSX,
                                        display: "inline-block",
                                        marginTop: "10px",
                                        textDecoration: "none",
                                    }}
                                >
                                    Download CSV
                                </CSVLink>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        sx={{ ...selectTicketButtonSX, width: "fit-content" }}
                        mr={3}
                        onClick={handleGenerateAccessCodes}
                        isLoading={isGenerating}
                    >
                        Generate
                    </Button>
                    <Button variant="ghost" onClick={handleOnClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
