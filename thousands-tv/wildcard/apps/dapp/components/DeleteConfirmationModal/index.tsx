import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    Flex,
} from "@chakra-ui/react";

export interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemToDeleteName: string;
    modalTitle: string;
    additionalText?: string;
}

/**
 * DeleteConfirmationModal component to confirm deletion of an item. (e.g notification)
 */
export const DeleteConfirmationModal: React.FC<
    DeleteConfirmationModalProps
> = ({
    isOpen,
    onClose,
    onConfirm,
    itemToDeleteName,
    modalTitle,
    additionalText,
}) => {
    const handleDelete = async () => {
        onConfirm();
        onClose();
    };

    const modalBodyPrompt = (
        <Flex>
            <Text>
                Are you sure you want to delete{" "}
                <Text as="span" color={"whiteAlpha.800"}>
                    {itemToDeleteName}
                </Text>
                ? This action cannot be undone.
            </Text>
        </Flex>
    );
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg="rgba(0, 0, 0, 0.8)" /> {/* Darker overlay */}
            <ModalContent>
                <ModalHeader>{modalTitle}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>{modalBodyPrompt}</Text>
                    <Text mt={4}>{additionalText}</Text>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="ghost"
                        color={"white"}
                        mr={3}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        bg="red.500"
                        onClick={() => {
                            handleDelete();
                        }}
                    >
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
