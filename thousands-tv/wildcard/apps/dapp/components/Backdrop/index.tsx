import { useState } from "react";
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
} from "@chakra-ui/react";
import LoadingSpinner from "../LoadingSpinner";

interface MyComponentProps {
    isOpen: boolean;
    onClose: () => void;
}

function Backdrop({ isOpen, onClose }: MyComponentProps) {
    return (
        <div>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay
                    backdropFilter="blur(5px)"
                    id="backdrop"
                    justifyContent="center"
                    alignItems="center"
                    display="flex"
                >
                    <LoadingSpinner />
                </ModalOverlay>
            </Modal>
        </div>
    );
}

export default Backdrop;
