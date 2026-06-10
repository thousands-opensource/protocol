import { ReactNode } from "react";
import {
    Modal,
    ModalOverlay,
    ModalCloseButton,
    ModalContent,
    ModalBody,
} from "@chakra-ui/react";
import * as styles from "./styles";

interface BadgeModalProps {
    isOpen: boolean;
    handleClose: () => void;
    children: ReactNode;
}

const BadgeModal = ({ isOpen, handleClose, children }: BadgeModalProps) => {
    return (
        <Modal
            onClose={handleClose}
            isOpen={isOpen}
            isCentered
            size="lg"
            scrollBehavior="inside"
        >
            <ModalOverlay sx={styles.modalOverlaySx} />
            <ModalCloseButton sx={styles.modalCloseBtnSx} />
            <ModalContent sx={styles.modalContentSx}>
                <ModalBody>{children}</ModalBody>
            </ModalContent>
        </Modal>
    );
};
export default BadgeModal;
