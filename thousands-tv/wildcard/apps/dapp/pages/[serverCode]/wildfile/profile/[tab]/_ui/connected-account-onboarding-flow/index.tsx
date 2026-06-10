import React, { useState, Dispatch, SetStateAction } from "react";
import {
    Box,
    Button,
    useDisclosure,
    Card,
    Grid,
    GridItem,
    Icon,
    Text,
    Image,
    Flex,
    Spacer,
    useToast,
} from "@chakra-ui/react";
import { useAccount } from "wagmi";
import {
    AccountProvider,
    AccountProviderType,
    WalletAccountProvider,
} from "@repo/interfaces";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import RainbowkitCustomConnectButton from "@/components/RainbowkitCustomConnectButton";
import { getUserDBProviderByType } from "@/utils/accountsUtil";
import { shorten } from "@/utils/util";
import { THEME_COLOR_SECONDARY } from "@/constants";
import LinkAdditionalProviderModal from "../connected-accounts/_ui/LinkAdditionalProviderModal";
import LinkWalletProviderModal from "../connected-accounts/_ui/LinkWalletProviderModal";
import { accountProviders, ProviderObject } from "../connected-accounts";
import {
    linkWalletButtonSX,
    connectedAccountGridItem,
    connectedAccountFlex,
    connectedAccountText,
    connectedAccountsCard,
    connectedAccountsCardGrid,
} from "@/features/Wildfile/WildFileProfile/WildfileAccountsFlowPopups/styles";
import { AccessRules } from "@/constants/routes";

interface ConnectedAccountsOnboardingFlowProps {
    requiredRules: AccessRules[];
    redirectUrl?: string;
    followWildcard: boolean;
    setFollowWildcard: Dispatch<SetStateAction<boolean>>;
    onSocialConnected: () => void;
    onWalletLinked: () => void;
    includedProviders?: AccountProviderType[];
}

/**
 *  Connected Accounts Onboarding Flow component
 *  Conditionally renders connected accounts based on the required access rules
 */
const ConnectedAccountsOnboardingFlow = ({
    requiredRules,
    redirectUrl,
    followWildcard,
    setFollowWildcard,
    onSocialConnected,
    onWalletLinked,
    includedProviders = [], // include all providers by default
}: ConnectedAccountsOnboardingFlowProps) => {
    const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const linkWalletDisclosure = useDisclosure();
    const [isLoadingSignIn, setIsLoadingSignIn] = useState<boolean>(false);
    const [isLinkingWallet, setIsLinkingWallet] = useState<boolean>(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState<boolean>(false);

    const { address, isConnected } = useAccount();
    const { userDB } = useWildfileUserContext();
    const toast = useToast();

    const isWalletRequired = requiredRules.includes(
        AccessRules.REQUIRE_LINKED_WALLET
    );

    const isTwitterRequired = requiredRules.includes(
        AccessRules.REQUIRE_TWITTER_LINKED
    );

    const isSocialRequired = requiredRules.includes(
        AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL
    );
    const isWalletConnected = !!userDB?.walletProvider?.address;

    /**
     * Filter the account providers based on the required rules
     * @param {AccountProvider[]} accountProviders - The list of account providers
     * @note - if no includedProviders are passed, all providers are included (default)
     */
    const filteredAccountProviders = accountProviders.filter((provider) => {
        if (includedProviders && includedProviders.length > 0) {
            if (
                includedProviders.includes(provider.type as AccountProviderType)
            ) {
                return true;
            }
            return false;
        }

        if (
            isWalletRequired &&
            !isWalletConnected &&
            provider.type === "wallet"
        ) {
            return true;
        }

        if (
            (isSocialRequired || isTwitterRequired) &&
            (!isWalletRequired || isWalletConnected) &&
            provider.isSocial
        ) {
            return true;
        }

        return false;
    });

    const handleSelectAccount = async (mappedProviderType: ProviderObject) => {
        setSelectedAccount(mappedProviderType);
        onOpen();
        if (mappedProviderType.isSocial && !isTwitterRequired) {
            onSocialConnected();
        }
    };

    const renderConnectButtonJSX = (
        account: any,
        mappedProviderType: ProviderObject
    ) => {
        const isWallet = mappedProviderType.type === "wallet";

        if (isWallet) {
            if (isWalletConnected) {
                return <Button sx={linkWalletButtonSX}>Connected</Button>;
            } else if (!address) {
                return (
                    <RainbowkitCustomConnectButton
                        color={THEME_COLOR_SECONDARY}
                    />
                );
            } else {
                return (
                    <Button
                        onClick={() => linkWalletDisclosure.onOpen()}
                        sx={linkWalletButtonSX}
                    >
                        Link Wallet
                    </Button>
                );
            }
        } else {
            return (
                <Button
                    bg={account?.id ? "blackAlpha.900" : "unset"}
                    sx={linkWalletButtonSX}
                    onClick={() => handleSelectAccount(mappedProviderType)}
                    isDisabled={!!account?.id}
                >
                    {account?.id ? "Connected" : "Connect"}
                </Button>
            );
        }
    };

    const shortenWalletAddress = shorten(userDB?.walletProvider?.address, {
        isAddress: true,
    });
    // Render connected account image
    const renderAccountImage = (account: any, provider: any) => {
        if (!account?.image) {
            return <Icon as={provider?.icon} boxSize="40px" mx="auto" mb={3} />;
        }

        return (
            <Image
                src={account?.image}
                alt="account logo"
                boxSize="50px"
                mx="auto"
                mb={3}
            />
        );
    };

    // Display connected or not connected text
    const displayConnectedNotConnectedText = (
        account: AccountProvider | WalletAccountProvider | any | null,
        providerType: string
    ): { isAccountConnected: boolean; providerConnectedText: string } => {
        const isConnected = !!account;
        if (isConnected) {
            if (providerType === "wallet") {
                if (account.address) {
                    return {
                        isAccountConnected: true,
                        providerConnectedText: `Wallet Address: ${shortenWalletAddress}`,
                    };
                } else {
                    return {
                        isAccountConnected: false,
                        providerConnectedText: "",
                    };
                }
            }
            return {
                isAccountConnected: true,
                providerConnectedText: `Connected to ${account?.name}`,
            };
        }
        return {
            isAccountConnected: false,
            providerConnectedText: "Not Connected",
        };
    };

    if (!userDB) {
        return <Box p={4}>User not found</Box>;
    }

    // Render connected accounts
    const renderConnectedAccountJSX = () => {
        return filteredAccountProviders.map((provider) => {
            const account = getUserDBProviderByType(userDB, provider.type);
            const { isAccountConnected, providerConnectedText } =
                displayConnectedNotConnectedText(account, provider.type);

            return (
                <GridItem
                    key={provider.type}
                    sx={connectedAccountGridItem(
                        userDB,
                        provider,
                        isAccountConnected,
                        THEME_COLOR_SECONDARY
                    )}
                >
                    <Flex sx={connectedAccountFlex}>
                        {account?.image ? (
                            <Image
                                src={account?.image}
                                alt="account logo"
                                boxSize="50px"
                                mx="auto"
                                mb={3}
                            />
                        ) : (
                            <Icon
                                as={provider.icon.type as any}
                                boxSize="40px"
                                mx="auto"
                                mb={3}
                            />
                        )}
                        <Text fontWeight="bold">{provider.name}</Text>
                        <Text sx={connectedAccountText(isAccountConnected)}>
                            {providerConnectedText}
                        </Text>
                        <Spacer />
                        {renderConnectButtonJSX(account, provider)}
                    </Flex>
                </GridItem>
            );
        });
    };

    return (
        <>
            <Card sx={connectedAccountsCard}>
                <Grid
                    sx={connectedAccountsCardGrid(
                        isWalletRequired,
                        isWalletConnected
                    )}
                >
                    <Flex
                        justifyContent="center"
                        alignItems="center"
                        wrap="wrap"
                    >
                        {renderConnectedAccountJSX()}
                    </Flex>
                </Grid>
            </Card>
            <LinkWalletProviderModal
                isOpen={linkWalletDisclosure.isOpen}
                onClose={linkWalletDisclosure.onClose}
                account={selectedAccount}
                setIsLinkingWallet={setIsLinkingWallet}
                isLinkingWallet={isLinkingWallet}
            />
            <LinkAdditionalProviderModal
                isOpen={isOpen}
                onClose={onClose}
                selectedAccount={selectedAccount}
                setIsLoadingSignIn={setIsLoadingSignIn}
                isLoadingSignIn={isLoadingSignIn}
                redirectUrl={redirectUrl}
            />
        </>
    );
};

export default ConnectedAccountsOnboardingFlow;
