import { THEME_COLOR_SECONDARY } from "@/constants";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import {
    COOKIES_IS_CONNECT_ACCOUNT,
    COOKIES_CONNECT_WALLET_EMAIL,
    COOKIES_CONNECTED_PROVIDER_ID,
} from "@/utils/accountAPIUtil";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtilWCA";
import {
    Button,
    Flex,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react";
import { signIn } from "next-auth/react";
import Cookies from "js-cookie";
import { ProviderObject } from "..";
import { AccountProviderType } from "@repo/interfaces";

interface LinkAdditionalProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedAccount: ProviderObject | null;
    setIsLoadingSignIn: (isLoading: boolean) => void;
    isLoadingSignIn: boolean;
    redirectUrl?: string;
}

/**
 * `LinkAdditionalProviderModal` is a React component that renders a modal for merging OAuth accounts to a wallet.
 *
 * @component
 * @param {object} props - The properties that define the component's behavior and display.
 * @param {boolean} props.isOpen - Determines whether the modal is open.
 * @param {function} props.onClose - The function to call when the modal is closed.
 * @param {object} props.selectedAccount - The account that has been selected.
 * @param {function} props.handleDisconnectAccountProvider - The function to call when disconnecting an account provider.
 * @param {function} props.handleSignIn - The function to call when signing in.
 * @param {boolean} props.isLoadingSignIn - Determines whether the sign-in process is loading.
 * @returns {ReactElement} The rendered `MergeOAuthAccountToWalletModal` component.
 */
const LinkAdditionalProviderModal: React.FC<
    LinkAdditionalProviderModalProps
> = ({
    isOpen,
    onClose,
    selectedAccount,
    setIsLoadingSignIn,
    isLoadingSignIn,
    redirectUrl,
}) => {
    const {
        userDB,
        setUserDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
    } = useWildfileUserContext();

    const handleLinkAdditionalProvider = async (accountType: string) => {
        Cookies.set(COOKIES_IS_CONNECT_ACCOUNT, "true");
        Cookies.set(COOKIES_CONNECT_WALLET_EMAIL, connectedUserDBEmail);
        Cookies.set(COOKIES_CONNECTED_PROVIDER_ID, connectedUserDBProviderId);
        await signIn(accountType, {
            callbackUrl:
                redirectUrl ||
                `${getAPIEndpointRootUrl()}/wildfile/profile/connected-accounts/`,
            redirect: true,
        });
        setIsLoadingSignIn(false);
    };

    /**
     * Display a user-friendly connection message based on the provider type.
     */
    const renderConnectMessageByProviderType = (providerType: string) => {
        switch (providerType.toLowerCase()) {
            case AccountProviderType.TWITTER:
                return "Connect your X account to share and interact with the community. Please ensure you're logged into X before proceeding.";
            default:
                return `Would you like to connect your ${providerType} account? This will enhance your community experience by linking it to your Thousands profile.`;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg={"blackAlpha.800"} />
            <ModalContent bg="blackAlpha.900" border="1px solid">
                <ModalHeader>{"Connect Account"}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text fontSize="md">
                        {renderConnectMessageByProviderType(
                            selectedAccount?.type || ""
                        )}
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <Flex
                        flexDirection="row"
                        justifyContent="center"
                        alignItems={"center"}
                        gap={"5px"}
                    >
                        <Button
                            variant={"outline"}
                            onClick={onClose}
                            border={"1px solid gray"}
                        >
                            Cancel
                        </Button>
                        <Button
                            isLoading={isLoadingSignIn}
                            isDisabled={isLoadingSignIn}
                            bg="glass.bg"
                            border="1px solid"
                            borderColor={THEME_COLOR_SECONDARY}
                            onClick={() =>
                                handleLinkAdditionalProvider(
                                    selectedAccount?.type as string
                                )
                            }
                        >
                            Connect
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default LinkAdditionalProviderModal;
