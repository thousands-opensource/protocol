import { WILDFILE_ROUTES } from "@/constants/routes";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

interface WalletMismatchModalProps {
    isOpen: boolean;
    handleLogout: () => void;
}

/**
 * `WalletMismatchModal` is a React component that renders a modal for handling wallet mismatches.
 *
 * @component
 * @param {object} props - The properties that define the component's behavior and display.
 * @param {boolean} props.isOpen - Determines whether the modal is open.
 * @param {function} props.handleLogout - The function to call when the logout button is clicked.
 * @returns {ReactElement} The rendered `WalletMismatchModal` component.
 */
const WalletMismatchModal: React.FC<WalletMismatchModalProps> = ({
    isOpen,
    handleLogout,
}) => {
    const router = useRouter();

    // Allow users to switch their wallet on the wallet management page (during add additional wallet flow)
    const isWalletPage =
        router.asPath ==
        `${WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.WEB3_WALLET.url}/`;

    if (!isOpen || isWalletPage) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            isCentered
            closeOnOverlayClick={false}
            onClose={() => {}}
        >
            <ModalOverlay style={{ backdropFilter: "blur(5px)" }} />
            <ModalContent>
                <ModalHeader>Wallet Mismatch Detected</ModalHeader>
                <ModalBody>
                    The connected wallet does not match your linked accounts.
                    Please reconnect with the correct wallet.
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="red" onClick={handleLogout}>
                        Logout
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default WalletMismatchModal;
