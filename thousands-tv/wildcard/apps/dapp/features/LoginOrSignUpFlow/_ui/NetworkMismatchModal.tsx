import React, { useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Text,
} from "@chakra-ui/react";
import { useNetwork } from "wagmi";
import { getTargetChain } from "@/utils/wagmi";
import { linkWalletButtonSX } from "@/features/Wildfile/WildFileProfile/WildfileAccountsFlowPopups/styles";

interface NetworkMismatchModalProps {}

/**
 * Network Mismatch Modal - Shows modal when the user is on the wrong network
 */
const NetworkMismatchModal = ({}: NetworkMismatchModalProps) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { chain } = useNetwork();

    const requiredTargetChain = getTargetChain();

    useEffect(() => {
        if (chain && chain.id !== requiredTargetChain.id) {
            onOpen();
        }
    }, [chain, requiredTargetChain, onOpen]);
    const targetChainName = getTargetChain().name ?? "base";

    return (
        <Modal
            isOpen={isOpen}
            isCentered
            closeOnEsc={false}
            blockScrollOnMount={false}
            closeOnOverlayClick={false}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent
                bg="blackAlpha.900"
                border="1px solid"
                borderColor="white"
                m="10px"
            >
                <ModalHeader>
                    <Text textAlign="center" w="100%">
                        Incorrect Network
                    </Text>
                </ModalHeader>
                <ModalBody p="10px">
                    <Text textAlign={"center"}>
                        You are currently on an unsupported network. Please
                        switch to the <strong>{targetChainName}</strong> network
                        in your wallet settings to continue.
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <Button sx={linkWalletButtonSX} onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default NetworkMismatchModal;
