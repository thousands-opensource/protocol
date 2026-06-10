import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react";
import { useAccount, useSignMessage } from "wagmi";
import { ProviderObject } from "..";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { AccountProviderType } from "@repo/interfaces";
import { API_AUTH_ROUTES } from "@/constants/routes";
import { WildcardAccountsApiResponse } from "@/types";
import axios from "axios";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

interface LinkWalletProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: ProviderObject | null;
    setIsLinkingWallet: (isLinkingWallet: boolean) => void;
    isLinkingWallet: boolean;
}

const LinkWalletProviderModal = ({
    isOpen,
    onClose,
    account,
    setIsLinkingWallet,
    isLinkingWallet,
}: LinkWalletProviderModalProps) => {
    const { onMessage } = useInfoNotifications();

    const { address, isConnected } = useAccount();
    const { userDB, setUserDB } = useWildfileUserContext();

    const { signMessage: signLinkWalletMessage } = useSignMessage({
        onSuccess: (data: any, variables: any) => {
            callLinkWalletApi(data, variables.message);
        },
        onError: (error: any) => {
            setIsLinkingWallet(false);
            console.error("Failed to sign message:", error);
        },
    });

    if (!userDB) {
        return <Box p={4}>User not found</Box>;
    }

    // API call to link wallet
    const callLinkWalletApi = async (
        signature: `0x${string}`,
        message: string | Uint8Array
    ) => {
        if (!isConnected) {
            return;
        }

        try {
            const body = {
                wildcardSessionTokenParams: {
                    accountProviderType: AccountProviderType.WALLET,
                    userDBId: userDB?._id?.toString(),
                    address,
                    signature,
                    message,
                },
            };

            const resp = await axios.post(
                API_AUTH_ROUTES.AUTH.WILDCARD.LINK_WALLET,
                body
            );
            const loginResp: WildcardAccountsApiResponse = resp.data;

            if (!loginResp.success) {
                setIsLinkingWallet(false);
                onMessage({
                    description: loginResp.message || "",
                    status: "warning",
                    title: "Linking Wallet failed",
                });
                return;
            }

            onMessage({
                description: "Successfully Linked Wallet",
                status: "success",
                title: "Login successful",
            });
            setUserDB(loginResp.data);
            onClose();
            setIsLinkingWallet(false);
        } catch (error: any) {
            setIsLinkingWallet(false);
            console.error("Failed to login:", error);
            onMessage({
                description: error.response?.data.message || "",
                status: "error",
                title: "Login failed",
            });
        }
    };

    // Link Web3 Wallet provider from an OAuth account
    const handleLinkWeb3WalletFromOAuth = () => {
        try {
            setIsLinkingWallet(true);

            onMessage({
                title: "Linking Wallet",
                description: "Please sign the message to link your wallet.",
                status: "info",
                duration: 5000,
                isClosable: true,
            });

            // create a message
            const nonce = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
            const message = `Please sign this message to link your wallet to Wildcard and verify ownership of your account. This is READ-ONLY access and will NOT trigger any blockchain transactions or incur any fees.\nNonce: ${nonce}`;
            signLinkWalletMessage({ message });
        } catch (error) {
            setIsLinkingWallet(false);

            console.error("Failed to sign message:", error);
        }
    };

    if (!address) {
        return;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg={"blackAlpha.800"} />
            <ModalContent bg="blackAlpha.900" border="1px solid">
                <ModalHeader>Link Wallet</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text fontSize="md">
                        {`Your connecting wallet address: ${address}`}
                        <br /> <br />
                        By linking your Web3 wallet, you will be associating it
                        with your account. This action is irreversible and
                        cannot be undone. Please ensure your Web3 wallet is
                        secure and you have access to it. Are you sure you want
                        to proceed?
                        <br />
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <Button
                        bg="glass.bg"
                        border="1px solid"
                        borderColor={THEME_COLOR_SECONDARY}
                        onClick={handleLinkWeb3WalletFromOAuth}
                        isDisabled={isLinkingWallet}
                        isLoading={isLinkingWallet}
                    >
                        Link Wallet
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default LinkWalletProviderModal;
