import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BsLink45Deg } from "react-icons/bs";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useGlobalContext } from "@/contexts/globalContext";
import {
    Box,
    Text,
    Button,
    HStack,
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Tooltip,
    Flex,
    Icon,
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
} from "@chakra-ui/react";
import { gilroyBlackItalic, gilroyBold } from "@/utils/themeUtil";
import {
    THEME_COLOR_DARK_GOLD,
    THEME_COLOR_ERROR_RED,
    THEME_COLOR_METALLIC_GREY,
} from "@/constants/constants";
import { isAssociatedWallet } from "@/utils/userUtil";
import * as styles from "@/features/Wildfile/WildFileProfile/Main/ConnectedWallets/styles";
import CircularStep from "@/components/CircularStep";
import { useRouter } from "next/router";
import { copyTextToClipboard, shorten } from "@/utils/util";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaSpinner } from "react-icons/fa";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useLinkedWallets } from "@/hooks/useLinkedWallets";

interface LinkWalletModalProps {
    showModal: boolean;
    closeModal: () => void;
}

const LinkWalletModal: React.FC<LinkWalletModalProps> = ({
    showModal,
    closeModal,
}) => {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { userDB } = useWildfileUserContext();

    const {
        linkWallet,
        linkingInProgress,
        additionalWalletLinked,
        error,
        resetLinkingState,
        linkedWallets,
    } = useLinkedWallets();

    const { loggedIn } = useGlobalContext();

    const isAddressAlreadyLinked = isAssociatedWallet(address || "", userDB);
    const step1Complete = isConnected;
    const step2Complete =
        (isConnected && !isAddressAlreadyLinked) || additionalWalletLinked;

    useEffect(() => {
        if (!loggedIn) {
            return;
        }
        removeReloadFalse();
    }, [loggedIn, additionalWalletLinked]);

    function removeReloadFalse() {
        const { reload } = router.query;
        if (reload !== "false") {
            return;
        }
        const { reload: _, ...updatedQuery } = router.query;
        router.push(
            {
                pathname: router.pathname,
                query: updatedQuery,
            },
            undefined,
            { shallow: true }
        );
    }

    const handleClose = () => {
        closeModal();
        resetLinkingState();
    };

    const renderLinkWalletButton = () => {
        const disabled =
            !step2Complete || additionalWalletLinked || linkingInProgress;
        return (
            <Button
                sx={styles.connectLinkSx}
                onClick={linkWallet}
                isDisabled={disabled}
                rightIcon={
                    linkingInProgress ? (
                        <FaSpinner className="icon-spin" />
                    ) : (
                        <ChevronRightIcon />
                    )
                }
            >
                {linkingInProgress
                    ? "Linking New Wallet"
                    : `LINK  WALLET ${shorten(address, { isAddress: true })}`}
            </Button>
        );
    };

    const renderDoneButton = () => {
        return (
            <Button
                sx={styles.connectLinkSx}
                onClick={handleClose}
                rightIcon={<ChevronRightIcon />}
            >
                All Done
            </Button>
        );
    };

    const renderConnectWalletButton = () => {
        return (
            <Tooltip
                label={isConnected ? "Copy" : ""}
                placement="top"
                hasArrow
                closeDelay={500}
            >
                <Box
                    onClick={() => {
                        if (isConnected) {
                            copyTextToClipboard(address || "", () => {});
                        }
                    }}
                >
                    <Box
                        id="connect-button"
                        sx={
                            isConnected
                                ? { display: "none" }
                                : styles.connectLinkSx
                        }
                    >
                        <ConnectButton
                            label="CONNECT WALLET"
                            chainStatus="icon"
                            accountStatus="address"
                        />
                        <Icon as={ChevronRightIcon} />
                    </Box>
                </Box>
            </Tooltip>
        );
    };

    const renderStep = (
        stepEnabled: boolean,
        isCompleted: boolean,
        stepNumber: string,
        stepText: string,
        button?: JSX.Element,
        subText?: string,
        subTextColor?: string
    ) => {
        const isActiveStep = stepEnabled && !isCompleted;
        const showSubText = subText && isActiveStep;
        const showButton = button && isActiveStep;
        const circleSize = isActiveStep ? "40px" : "40px";
        return (
            <HStack
                sx={stepEnabled ? styles.stepEnabled : styles.stepDisabled}
                spacing={[2, 3, 4]}
            >
                <CircularStep
                    text={stepNumber}
                    isStepEnabled={stepEnabled}
                    isCompleted={isCompleted}
                    sx={styles.stepCircle(circleSize)}
                />
                <Flex sx={styles.stepFlex}>
                    <Text
                        sx={styles.stepText(stepEnabled, isCompleted)}
                        className={gilroyBlackItalic.className}
                    >
                        {stepText}
                    </Text>
                    {stepNumber === "2" && stepEnabled && showSelectedWallet()}
                    {showSubText && (
                        <Text
                            sx={styles.stepSubText}
                            color={subTextColor || THEME_COLOR_METALLIC_GREY}
                        >
                            {subText}
                        </Text>
                    )}
                    {showButton && button}
                </Flex>
            </HStack>
        );
    };

    function additionalWalletErrMessageJsx() {
        if (error) {
            return (
                <Flex sx={styles.additionalWalletErrFlex}>
                    <Text sx={styles.additionalWalletErrMessage}>{error}</Text>
                </Flex>
            );
        }
        return <></>;
    }

    const showSelectedWallet = () => {
        return (
            <Box>
                <Text sx={styles.stepSubText} color={THEME_COLOR_METALLIC_GREY}>
                    Selected Wallet
                </Text>
                <Text sx={styles.stepSubText} color={THEME_COLOR_METALLIC_GREY}>
                    {address}
                </Text>
                {!step2Complete && (
                    <Text
                        sx={styles.stepSubText}
                        my={"10px"}
                        color={THEME_COLOR_ERROR_RED}
                    >
                        This wallet is already linked to your Thousands Account.
                    </Text>
                )}
            </Box>
        );
    };

    const linkedWalletsAccordionJSX = () => {
        if (!address || linkedWallets.length === 0) {
            return (
                <Text sx={styles.currentlyLinked} flex="1" textAlign="left">
                    No Currently Linked Wallets.
                </Text>
            );
        }
        return (
            <Accordion allowToggle w="100%">
                <AccordionItem>
                    <AccordionButton>
                        <Text
                            sx={styles.currentlyLinked}
                            flex="1"
                            textAlign="left"
                        >
                            Currently Linked Wallets:
                        </Text>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        {linkedWallets.map((linkedWallet, idx) => (
                            <HStack key={linkedWallet + idx}>
                                <Icon as={BsLink45Deg} color={"white"} />
                                <Text sx={styles.primaryWalletSx}>
                                    {linkedWallet}
                                </Text>
                            </HStack>
                        ))}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        );
    };

    return (
        <Modal
            id="link-wallet-modal"
            isOpen={showModal}
            onClose={handleClose}
            closeOnOverlayClick={false}
            isCentered={true}
        >
            <ModalOverlay bg={"blackAlpha.700"} />
            <ModalContent
                sx={styles.modalContentSx}
                id="link-wallet-modal-content"
            >
                <ModalCloseButton />
                <ModalHeader
                    sx={styles.headerSx}
                    className={gilroyBlackItalic.className}
                >
                    Link an additional wallet to your Thousands Account
                </ModalHeader>
                <ModalBody px={"15px"}>
                    <VStack spacing={4} alignItems="start">
                        <Box>
                            <Text
                                sx={styles.subHeader}
                                className={gilroyBold.className}
                            >
                                It’s safe, easy, and free!
                            </Text>
                        </Box>
                        <VStack spacing={8} sx={styles.stepsStack}>
                            {renderStep(
                                true,
                                step1Complete,
                                "1",
                                "Connect Your wallet.",
                                renderConnectWalletButton(),
                                "Metamask, Phantom, etc"
                            )}
                            {renderStep(
                                step1Complete,
                                step2Complete,
                                "2",
                                "Select the additional wallet you’d like to link to your Thousands account.",
                                undefined,
                                "Ok, now you need to switch screens back to your wallet provider (i.e. metamask, phantom, etc) and select the additional wallet you wish to link. Once you do that, come back here for the next steps.",
                                THEME_COLOR_DARK_GOLD
                            )}
                            {renderStep(
                                step2Complete,
                                additionalWalletLinked,
                                "3",
                                "Link your wallet by signing a message to prove your ownership.",
                                renderLinkWalletButton(),
                                "This is a signed message that proves you're the owner of this additional wallet.",
                                THEME_COLOR_DARK_GOLD
                            )}
                            {renderStep(
                                additionalWalletLinked,
                                false,
                                "4",
                                "Your additional wallet is now linked to your Thousands account!",
                                renderDoneButton()
                            )}
                            {additionalWalletErrMessageJsx()}
                        </VStack>
                        {linkedWalletsAccordionJSX()}
                        <Text sx={styles.subtitleText}>
                            PLEASE NOTE: Linking and unlinking wallets is a
                            public transaction that will appear on the
                            blockchain.
                        </Text>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default LinkWalletModal;
