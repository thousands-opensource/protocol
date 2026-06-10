// ManageUserWallets.tsx
import React, { useState } from "react";
import {
    Flex,
    Text,
    Spacer,
    Divider,
    IconButton,
    Button,
    AccordionPanel,
    AccordionIcon,
    AccordionButton,
    AccordionItem,
    Accordion,
    Box,
    useTheme,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import {
    accordionButtonSx,
    accordionPanelBoxSx,
    additionalWalletButtonFlexSX,
    accordionWalletSx,
    primaryWalletButtonSX,
    removeLinkedWallet,
} from "@/features/Wildfile/WildFileProfile/Main/ConnectedWallets/styles";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useLinkedWallets } from "@/hooks/useLinkedWallets";
import CopyAddressTooltip from "./CopyAddressTooltip";
import { ManageLinkedWallets } from "./ManagedLinkWallets";
import { buttonSizeIconSx } from "@/features/Wildfile/WildFileProfile/WildfileNavigation/Icons/styles";

export enum WalletDisplayType {
    PRIMARY = "primary",
    EXPANDER = "expander",
}

interface ManageUserWalletsProps {
    onPrimaryWalletAction?: () => void;
    variant?: WalletDisplayType;
    onExpandChange?: (isExpanded: boolean) => void;
    showBackgroundGradient?: boolean;
}

export const ManageUserWallets = ({
    onPrimaryWalletAction,
    variant = WalletDisplayType.PRIMARY,
    onExpandChange,
    showBackgroundGradient = true,
}: ManageUserWalletsProps) => {
    const { userDB } = useWildfileUserContext();
    const { linkedWallets, unlinkWallet } = useLinkedWallets();
    const [isExpanded, setIsExpanded] = useState(false);
    const theme = useTheme();

    const primaryWalletAddress = userDB?.walletProvider?.address;

    if (!primaryWalletAddress) return <></>;

    const { _hover, ...hoverlessAccordionWallet } =
        additionalWalletButtonFlexSX;

    const handleAccordionChange = (isExpanded: boolean) => {
        if (onExpandChange) {
            onExpandChange(isExpanded);
        }

        setIsExpanded(isExpanded);
    };

    const borderRadiusMd = theme.radii.md;

    if (isExpanded) {
        hoverlessAccordionWallet.borderRadius = `${borderRadiusMd} ${borderRadiusMd} 0 0`;
    }

    if (variant === WalletDisplayType.EXPANDER) {
        return (
            <Accordion
                allowToggle
                w="100%"
                onChange={(index) => handleAccordionChange(index !== -1)}
            >
                <AccordionItem style={{ border: "none" }}>
                    <AccordionButton
                        zIndex={0}
                        sx={accordionButtonSx(hoverlessAccordionWallet)}
                    >
                        {showBackgroundGradient && (
                            <Box
                                sx={accordionWalletSx(
                                    hoverlessAccordionWallet.borderRadius
                                )}
                            />
                        )}
                        <Flex
                            sx={{
                                ...hoverlessAccordionWallet,
                                position: "relative",
                            }}
                        >
                            <CopyAddressTooltip
                                address={primaryWalletAddress}
                            />
                            <Spacer />
                            <AccordionIcon sx={buttonSizeIconSx} />
                        </Flex>
                    </AccordionButton>
                    <AccordionPanel pb={4} px={0} py={0}>
                        {linkedWallets.map((wallet, index) => (
                            <React.Fragment key={`${wallet}-${index}`}>
                                <Box
                                    sx={
                                        showBackgroundGradient
                                            ? accordionPanelBoxSx("0")
                                            : {}
                                    }
                                >
                                    <Flex sx={additionalWalletButtonFlexSX}>
                                        <CopyAddressTooltip address={wallet} />
                                        <Spacer />
                                        <IconButton
                                            variant="outline"
                                            icon={<DeleteIcon />}
                                            aria-label="remove-wallet"
                                            sx={{
                                                ...removeLinkedWallet,
                                            }}
                                            onClick={async () => {
                                                await unlinkWallet(wallet);
                                            }}
                                        />
                                    </Flex>
                                    <Divider />
                                </Box>
                            </React.Fragment>
                        ))}
                        <Box
                            sx={
                                showBackgroundGradient
                                    ? accordionPanelBoxSx(borderRadiusMd)
                                    : {}
                            }
                        >
                            <ManageLinkedWallets />
                        </Box>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        );
    }

    return (
        <>
            {primaryWalletAddress && (
                <>
                    <Flex sx={additionalWalletButtonFlexSX}>
                        <CopyAddressTooltip address={primaryWalletAddress} />
                        <Spacer />
                        <Button
                            sx={primaryWalletButtonSX}
                            onClick={onPrimaryWalletAction}
                            _hover={{ bg: "whiteAlpha.100" }}
                        >
                            <Text fontSize="sm">View Primary Wallet</Text>
                        </Button>
                    </Flex>
                    <Divider />
                </>
            )}
            {linkedWallets &&
                linkedWallets.map((wallet, index) => (
                    <React.Fragment key={`${wallet}-${index}`}>
                        <Flex sx={additionalWalletButtonFlexSX}>
                            <CopyAddressTooltip address={wallet} />
                            <Spacer />
                            <IconButton
                                variant="outline"
                                icon={<DeleteIcon />}
                                aria-label="remove-wallet"
                                sx={removeLinkedWallet}
                                onClick={async () => {
                                    await unlinkWallet(wallet);
                                }}
                            />
                        </Flex>
                        <Divider />
                    </React.Fragment>
                ))}
            <ManageLinkedWallets />
        </>
    );
};
