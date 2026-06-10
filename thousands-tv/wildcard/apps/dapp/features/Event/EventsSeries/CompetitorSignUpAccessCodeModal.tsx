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
    FormControl,
    FormLabel,
} from "@chakra-ui/react";
import { selectTicketButtonSX } from "./styles";


interface CompetitorSignUpAccessCodeModalProps {
    isOpen: boolean;
    onCopy: (competitorSignUpUrl: string, numberOfUses: number) => void;
    onCancel: () => void;
    competitorSignUpUrl: string;
}

export default function CompetitorSignUpAccessCodeModal({
    isOpen,
    onCopy,
    onCancel,
    competitorSignUpUrl,
}: CompetitorSignUpAccessCodeModalProps) {

    const [maxQuantity, setMaxQuantity] = useState(1);

    const handleOnCopy = () => {
        onCopy(competitorSignUpUrl, maxQuantity);
    };

    const handleOnCancel = () => {
        onCancel();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleOnCancel} isCentered>
            <ModalOverlay />
            <ModalContent
                bg="blackAlpha.900"
                border="1px solid"
                borderColor="gray.600"
            >
                <ModalHeader>Share Competitor Link</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>
                        <FormLabel fontWeight="bold">Number of Uses:</FormLabel>
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
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button
                        sx={{ ...selectTicketButtonSX, width: "fit-content" }}
                        mr={3}
                        onClick={handleOnCopy}
                        isLoading={false}
                    >
                        Copy to Clipboard
                    </Button>
                    <Button variant="ghost" onClick={handleOnCancel}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}