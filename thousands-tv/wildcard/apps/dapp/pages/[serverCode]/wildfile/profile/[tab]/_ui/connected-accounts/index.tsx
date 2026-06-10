import React, { useState, ReactElement, SetStateAction, Dispatch } from "react";
import {
    Box,
    Button,
    useDisclosure,
    Card,
    Grid,
    GridItem,
    Heading,
    Icon,
    Text,
    Image,
    Flex,
    Spacer,
    useToast,
} from "@chakra-ui/react";
import { FaDiscord, FaGoogle, FaTwitch, FaWallet } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { signIn } from "next-auth/react";
import { useAccount, useSignMessage } from "wagmi";
import {
    AccountProvider,
    AccountProviderType,
    EventPointTypeEnum,
    EventPoints,
    IPoints,
    WalletAccountProvider,
    WildcardApiResponse,
} from "@repo/interfaces";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import RainbowkitCustomConnectButton from "@/components/RainbowkitCustomConnectButton";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtil";
import {
    ProviderType,
    getConnectedProviderType,
    getUserDBProviderByType,
} from "@/utils/accountsUtil";
import {
    COOKIES_IS_LINKING_OUTH_WALLET,
    COOKIES_LINKING_OAUTH_WALLET_ADDRESS,
} from "@/utils/accountAPIUtil";
import { shorten } from "@/utils/util";
import LinkAdditionalProviderModal from "./_ui/LinkAdditionalProviderModal";
import LinkWalletProviderModal from "./_ui/LinkWalletProviderModal";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { CheckIcon } from "@chakra-ui/icons";
import { FOLLOW_TWITTER_DELAY_MS } from "@/constants/constants";
import { FaXTwitter } from "react-icons/fa6";

export interface ConnectedAccountGridItem {
    type: string;
    name: string;
    icon: ReactElement;
    isSocial: boolean;
}

export const accountProviders: ConnectedAccountGridItem[] = [
    { type: "twitter", name: "X", icon: <FaXTwitter />, isSocial: true },
    { type: "twitch", name: "Twitch", icon: <FaTwitch />, isSocial: true },
    {
        type: "discord",
        name: "Discord",
        icon: <FaDiscord />,
        isSocial: true,
    },
    { type: "google", name: "Google", icon: <FaGoogle />, isSocial: true },
    { type: "wallet", name: "Wallet", icon: <FaWallet />, isSocial: false },
];

export interface ProviderObject {
    type: string;
    name: string;
    logo?: string;
    icon?: ReactElement;
    connected?: boolean;
    username?: string;
    isSocial?: boolean;
}

interface ConnectedAccountsProps {
    redirectUrl?: string;
    followWildcard: boolean;
    setFollowWildcard: Dispatch<SetStateAction<boolean>>;
}

/**
 * React component that displays connected accounts.
 * @returns - The rendered `ConnectedAccounts` component.
 */
const ConnectedAccounts = ({
    followWildcard,
    setFollowWildcard,
    redirectUrl,
}: ConnectedAccountsProps) => {
    const [selectedAccount, setSelectedAccount] =
        useState<ProviderObject | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const linkWalletDisclosure = useDisclosure();
    const { onMessage } = useInfoNotifications();
    const [isLoadingSignIn, setIsLoadingSignIn] = useState<boolean>(false);
    const [isLinkingWallet, setIsLinkingWallet] = useState<boolean>(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState<boolean>(false);
    const toast = useToast();

    const { address, isConnected } = useAccount();
    const {
        userDB,
        setUserDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
    } = useWildfileUserContext();

    const handleActionClick = async (
        account: AccountProvider,
        mappedProviderType: ProviderObject
    ) => {
        setSelectedAccount(mappedProviderType);
        onOpen();
    };

    if (!userDB) {
        return <Box p={4}>Loading accounts...</Box>;
    }

    // Get the connected provider type
    const connectedProviderType = getConnectedProviderType(
        userDB,
        connectedUserDBProviderId
    );

    if (!userDB) {
        console.error(`User data not found`);
        onMessage({
            title: "User Data Not Found",
            description: "User data not found.",
            status: "error",
            duration: 5000,
            isClosable: true,
        });
        return;
    }

    // Connect additional providers from a web3 connected wallet
    const handleLinkAdditionalProviderToWeb3Wallet = async (
        providerType: string
    ) => {
        setIsLoadingSignIn(true);

        if (!address) {
            onMessage({
                title: "Failed to Account to Wallet",
                description:
                    "Unable to find an address for social account linking.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        Cookies.set(COOKIES_IS_LINKING_OUTH_WALLET, "true");
        Cookies.set(COOKIES_LINKING_OAUTH_WALLET_ADDRESS, address);

        // await signIn(accountType, { redirect: false });

        // Connect the user to the account provider via OAuth Sign in flow
        await signIn(providerType, {
            callbackUrl: redirectUrl
                ? redirectUrl
                : `${getAPIEndpointRootUrl()}/wildfile/profile/connected-accounts/`,
            redirect: true,
        });
        setIsLoadingSignIn(false);
    };

    const handleFollowPlayWildcard = async (e: any) => {
        try {
            setIsLoadingFollow(true);
            const socialEventPointResp = await axios.post(
                "/api/updateSocialEventPoints",
                {
                    socialEventPointsType: EventPointTypeEnum.FOLLOW_WILDCARD,
                }
            );

            const socialEventPoint: WildcardApiResponse =
                socialEventPointResp.data;
            if (!socialEventPoint.success) {
                const msg = "Failed to follow twitter account";
                toast({
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const pointObj: IPoints = socialEventPoint.data;
            const eventPoints: EventPoints[] = pointObj.eventPoints;

            const followTwitterEvent = eventPoints.find((eventPoint) => {
                return (
                    eventPoint.eventId === EventPointTypeEnum.FOLLOW_WILDCARD
                );
            });

            if (!followTwitterEvent) {
                const msg = "Unable to find twitter event";
                toast({
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            setTimeout(() => {
                setIsLoadingFollow(false);
                setFollowWildcard(true);
                toast({
                    description: "You successfully followed @PlayWildcard",
                    status: "success",
                    duration: 5000,
                    position: "top",
                });
            }, FOLLOW_TWITTER_DELAY_MS);

            window.open(
                "https://twitter.com/intent/follow?screen_name=playwildcard",
                "_blank"
            );
        } catch (e: any) {
            setIsLoadingFollow(false);
            const msg = "Error - Failed to follow twitter account";
            console.error(msg);
            toast({
                description: msg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }
    };

    const renderFollowWildcardJsx = () => {
        if (!followWildcard) {
            return (
                <Button
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px 12px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#1da1f2", // Twitter blue color
                        border: "none",
                        borderRadius: "4px",
                        textDecoration: "none",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                            backgroundColor: "#0d95e8", // Slightly darker blue on hover
                        },
                        "&:active": {
                            backgroundColor: "#0a85d4", // Even darker blue when clicked
                        },
                        "&:focus": {
                            outline: "none",
                            boxShadow: "0 0 0 3px rgba(29, 161, 242, 0.5)", // Outline for accessibility
                        },
                    }}
                    className="twitter-follow-button"
                    data-size="large"
                    id="twitter-btn-follow"
                    isLoading={isLoadingFollow}
                    onClick={handleFollowPlayWildcard}
                >
                    Follow @PlayWildcard
                </Button>
            );
        }

        return (
            <Flex flexDirection={"column"} gap={2} alignItems={"center"}>
                <Text fontSize={"sm"}>
                    You successfully followed @Playwildcard
                </Text>{" "}
                <CheckIcon color="green" />
            </Flex>
        );
    };

    // Render the 'Connect Providers' button options based on the account provider type
    const renderConnectWalletButtonJSX = (
        account: any,
        mappedProviderType: ProviderObject
    ) => {
        // Show the 'Link Wallet' button for user to link their wallet from a connected OAuth account
        if (
            userDB.walletProvider?.address &&
            mappedProviderType?.type === "wallet"
        ) {
            return (
                <Button
                    width="full"
                    bg="glass.bg"
                    border="1px solid"
                    borderColor={THEME_COLOR_SECONDARY}
                    isDisabled={true}
                >
                    Connected
                </Button>
            );
        } else if (mappedProviderType?.type === "wallet") {
            // show Rainbowkit connect button if user address is not connected
            if (!address) {
                return (
                    <RainbowkitCustomConnectButton
                        color={THEME_COLOR_SECONDARY}
                    />
                );
            }

            return (
                <Button
                    onClick={() => linkWalletDisclosure.onOpen()}
                    isDisabled={!!account?.id}
                    width="full"
                    bg="glass.bg"
                    border="1px solid"
                    borderColor={THEME_COLOR_SECONDARY}
                >
                    Link Wallet
                </Button>
            );
        }

        // Show the 'Link Socials' button if the user is connected to a wallet
        if (connectedProviderType === ProviderType.WalletProvider) {
            return (
                <Button
                    bg={account?.id ? "blackAlpha.900" : "unset"}
                    onClick={() =>
                        handleLinkAdditionalProviderToWeb3Wallet(
                            mappedProviderType?.type
                        )
                    }
                    isDisabled={!!account?.id}
                >
                    {account?.id ? "Connected" : "Connect"}
                </Button>
            );
        }

        if (!!account?.id && mappedProviderType.type === "twitter") {
            return renderFollowWildcardJsx();
        }

        // Show the 'Connect' button if the user is not connected to a wallet
        return (
            <Button
                bg={account?.id ? "blackAlpha.900" : "unset"}
                width="full"
                border="1px solid"
                borderColor={THEME_COLOR_SECONDARY}
                onClick={() => handleActionClick(account, mappedProviderType)}
                isDisabled={!!account?.id}
            >
                {account?.id ? "Connected" : "Connect"}
            </Button>
        );
    };

    const shortenWalletAddress = shorten(userDB.walletProvider?.address, {
        isAddress: true,
    });

    function displayConnectedNotConnectedText(
        account: AccountProvider | WalletAccountProvider | any | null,
        providerType: string
    ): { isAccountConnected: boolean; providerConnectedText: string } {
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
                        providerConnectedText: "Not Connected",
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
    }

    // Render JSX for connected providers options
    const renderConnectedProviderJSX = () => {
        return accountProviders.map((provider) => {
            const account = getUserDBProviderByType(userDB, provider.type);
            const providerType = provider.type;
            const { isAccountConnected, providerConnectedText } =
                displayConnectedNotConnectedText(account, providerType);

            return (
                <GridItem
                    key={provider.type}
                    w="100%"
                    borderWidth={
                        userDB.preferredProvider === providerType
                            ? "3px"
                            : "1px"
                    }
                    borderRadius="lg"
                    p={4}
                    textAlign="center"
                    opacity={isAccountConnected ? "0.8" : ""}
                    borderColor={
                        userDB.preferredProvider === providerType
                            ? THEME_COLOR_SECONDARY
                            : ""
                    }
                    position="relative"
                >
                    <Flex
                        flexDirection={"column"}
                        alignItems={"space-between"}
                        h="100%"
                    >
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
                        <Text
                            fontSize="sm"
                            mb={3}
                            color={isAccountConnected ? "gray.500" : "white"}
                        >
                            {providerConnectedText}
                        </Text>
                        <Spacer />
                        {renderConnectWalletButtonJSX(account, provider)}
                    </Flex>
                </GridItem>
            );
        });
    };

    return (
        <>
            <Card
                borderRadius="lg"
                p={4}
                mb={4}
                shadow="sm"
                bg="unset"
                color="white"
                w="100%"
            >
                <Heading size="md" mb={2}>
                    Apps and Accounts
                </Heading>
                <Text mb={4}>
                    Manage permissions for applications and connected accounts.
                    To connect, log in via a provider.
                </Text>
                <Grid templateColumns="repeat(4, 1fr)" gap={6}>
                    {renderConnectedProviderJSX()}
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
                redirectUrl={`${WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.CONNECTED_ACCOUNTS.url}?providerRedirect=true`}
            />
        </>
    );
};

export default ConnectedAccounts;
