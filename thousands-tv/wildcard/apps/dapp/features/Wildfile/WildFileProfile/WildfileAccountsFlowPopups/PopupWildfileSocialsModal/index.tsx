import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    Flex,
    Card,
    Text,
    Divider,
    Heading,
    Box,
    Button,
    Checkbox,
} from "@chakra-ui/react";
import { modalBodySx } from "../styles";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import UpdateDisplayNameForm from "./_ui/UpdateDisplayNameForm";
import { checkIfAtLeastOneSocialProviderIdExists } from "@/utils/accountsUtil";
import {
    THEME_COLOR_BG_PRIMARY,
    THEME_COLOR_FONT_PRIMARY,
    THEME_COLOR_SECONDARY,
} from "@/constants";
import { AccessRules, WILDFILE_ROUTES } from "@/constants/routes";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import axios from "axios";
import { signOut } from "next-auth/react";
import router from "next/router";
import { THEME_COLOR_DARK_GOLD } from "@/constants/constants";
import ConnectedAccountsOnboardingFlow from "@/pages/[serverCode]/wildfile/profile/[tab]/_ui/connected-account-onboarding-flow";
import { AccountProviderType } from "@repo/interfaces";

enum VerificationStep {
    DISPLAY_NAME = "displayName",
    SOCIAL = "social",
    WALLET = "wallet",
    TWITTER = "twitter",
    NONE = "",
}

interface PopupWildfileSocialsModalProps {
    socialsMessagePrompt: string;
    redirectUrl?: string;
    unmetRules: AccessRules[];
    onNext: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    followWildcardBool: boolean;
}

const PopupWildfileSocialsModal: React.FC<PopupWildfileSocialsModalProps> = ({
    socialsMessagePrompt,
    redirectUrl,
    unmetRules,
    onNext,
    hasNext,
    hasPrevious,
    followWildcardBool,
}) => {
    const { userDB, connectedUserDBEmail, setIsLoggedIn } =
        useWildfileUserContext();
    const { onMessage } = useInfoNotifications();
    const [followWildcard, setFollowWildcard] =
        useState<boolean>(followWildcardBool);
    const [currentStep, setCurrentStep] = useState(0);
    const [isDisplayNameSet, setIsDisplayNameSet] = useState<boolean>(
        !!userDB?.preferences?.displayName
    );
    const [isAtLeastOneSocialIsConnected, setIsAtLeastOneSocialIsConnected] =
        useState<boolean>(checkIfAtLeastOneSocialProviderIdExists(userDB));
    const [isLinkedWalletSet, setIsLinkedWalletSet] = useState<boolean>(
        !!userDB?.walletProvider?.address
    );
    const [agreedToTerms, setAggreedToTerms] = useState<boolean>(false);

    const steps = unmetRules.map((rule) => {
        switch (rule) {
            case AccessRules.REQUIRE_DISPLAY_NAME:
                return VerificationStep.DISPLAY_NAME;
            case AccessRules.REQUIRE_TWITTER_LINKED:
                return VerificationStep.TWITTER;
            case AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL:
                return VerificationStep.SOCIAL;
            case AccessRules.REQUIRE_LINKED_WALLET:
                return VerificationStep.WALLET;
            default:
                return VerificationStep.NONE;
        }
    });

    const tasksCompleted = unmetRules.reduce((count, rule) => {
        if (rule === AccessRules.REQUIRE_DISPLAY_NAME && isDisplayNameSet)
            return count + 1;
        if (
            rule === AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL &&
            isAtLeastOneSocialIsConnected
        )
            return count + 1;
        if (rule === AccessRules.REQUIRE_LINKED_WALLET && isLinkedWalletSet)
            return count + 1;
        return count;
    }, 0);

    const totalTasks = unmetRules.length;

    useEffect(() => {
        if (tasksCompleted === totalTasks) {
            window.location.href = redirectUrl ?? "/";
        }
    }, [tasksCompleted, totalTasks, redirectUrl]);

    const moveToNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else if (hasNext) {
            onNext();
        } else if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    };

    const handleDisplayNameSet = (isSet: boolean) => {
        setIsDisplayNameSet(isSet);
        if (isSet) {
            moveToNextStep();
        }
    };

    const handleSocialConnected = () => {
        setIsAtLeastOneSocialIsConnected(true);
        if (steps[currentStep] === VerificationStep.SOCIAL) {
            moveToNextStep();
        }
    };

    const handleWalletLinked = () => {
        setIsLinkedWalletSet(true);
        if (steps[currentStep] === VerificationStep.WALLET) {
            moveToNextStep();
        }
    };

    useEffect(() => {
        if (
            (steps[currentStep] === VerificationStep.DISPLAY_NAME &&
                isDisplayNameSet) ||
            (steps[currentStep] === VerificationStep.SOCIAL &&
                isAtLeastOneSocialIsConnected) ||
            (steps[currentStep] === VerificationStep.WALLET &&
                isLinkedWalletSet)
        ) {
            moveToNextStep();
        }
    }, [
        currentStep,
        isDisplayNameSet,
        isAtLeastOneSocialIsConnected,
        isLinkedWalletSet,
    ]);

    /**
     * Handle the logout action
     * @dev - Performs the NextAuth sign out operation and wait for it to complete
     */
    const handleLogout = async () => {
        try {
            const response = await axios.post("/api/auth/logout");
            if (response.status === 200) {
                const signOutResult = await signOut({ redirect: false });
                if (signOutResult?.url) {
                    window.location.href = signOutResult.url;
                } else {
                    router.push(WILDFILE_ROUTES.LOGIN.url);
                    setIsLoggedIn(false);
                    onMessage({
                        title: "Logged Out",
                        description: "You have successfully logged out.",
                        status: "info",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } else {
                throw new Error("Logout failed");
            }
        } catch (error) {
            console.error("Failed to log out:", error);
            onMessage({
                title: "Logout Error",
                description: "Failed to log out. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleTermsCheckboxChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setAggreedToTerms(e.target.checked);
    };

    const isTwitterRequired = unmetRules.includes(
        AccessRules.REQUIRE_TWITTER_LINKED
    );
    const renderStep = () => {
        switch (steps[currentStep]) {
            case VerificationStep.DISPLAY_NAME:
                return (
                    <>
                        <Box>
                            <Heading
                                as="h2"
                                size="md"
                                color={THEME_COLOR_DARK_GOLD}
                            >
                                Set your Display Name
                            </Heading>
                        </Box>
                        <Flex
                            sx={{
                                backgroundColor: "rgba(64, 64, 64, 0.35)",
                                borderRadius: "12px",
                            }}
                        >
                            <Flex
                                sx={{
                                    p: 2,
                                }}
                            >
                                <Checkbox
                                    onChange={handleTermsCheckboxChange}
                                />
                            </Flex>
                            <Flex sx={{ p: 2 }}>
                                <p>
                                    I agree to these{" "}
                                    <a
                                        href="/termsandconditions "
                                        target="_blank"
                                        className="font-normal text-blue underline"
                                    >
                                        Terms and Conditions
                                    </a>
                                </p>
                            </Flex>
                        </Flex>
                        <Flex flexDirection="row" alignItems="center">
                            <UpdateDisplayNameForm
                                initialName={
                                    userDB?.preferences?.displayName ?? ""
                                }
                                setIsDisplayNameSet={handleDisplayNameSet}
                                userId={userDB?._id?.toString() ?? ""}
                                isDisplayNameSet={isDisplayNameSet}
                                isButtonDisabled={agreedToTerms}
                            />
                        </Flex>
                    </>
                );
            case VerificationStep.SOCIAL:
            case VerificationStep.WALLET:
            case VerificationStep.TWITTER:
                return (
                    <>
                        <Box>
                            <Heading
                                as="h2"
                                size="md"
                                color={THEME_COLOR_DARK_GOLD}
                            >
                                {socialsMessagePrompt}
                            </Heading>
                        </Box>
                        <Box width="100%">
                            <ConnectedAccountsOnboardingFlow
                                includedProviders={
                                    isTwitterRequired
                                        ? [AccountProviderType.TWITTER]
                                        : [] // if null, all providers are included (by default)
                                }
                                requiredRules={unmetRules}
                                followWildcard={followWildcard}
                                setFollowWildcard={setFollowWildcard}
                                onSocialConnected={handleSocialConnected}
                                onWalletLinked={handleWalletLinked}
                                redirectUrl={redirectUrl}
                            />
                        </Box>
                    </>
                );
            case VerificationStep.NONE:
                return (
                    <Text color={THEME_COLOR_DARK_GOLD}>
                        All steps completed
                    </Text>
                );
        }
    };

    if (!userDB || tasksCompleted === totalTasks) {
        return null;
    }

    return (
        <Modal
            size={["xs", "sm", "sm", "5xl", "5xl"]}
            blockScrollOnMount={false}
            isCentered
            isOpen={true}
            onClose={() => {}}
            motionPreset="slideInRight"
            allowPinchZoom={true}
            closeOnEsc={false}
        >
            <ModalOverlay bg={THEME_COLOR_BG_PRIMARY} />
            <ModalContent w="100%">
                <ModalBody
                    sx={modalBodySx}
                    bg="blackAlpha.800"
                    border="1px solid white"
                    borderRadius="md"
                >
                    <Card bg="blackAlpha.100">
                        <Flex flexDirection="column" p="10px">
                            <Flex
                                alignItems="center"
                                justifyContent="center"
                                flexDirection="column"
                                my="10px"
                                gap="10px"
                            >
                                <Flex
                                    flexDirection="row"
                                    w="100%"
                                    alignItems="center"
                                    justifyContent="flex-end"
                                >
                                    <Button
                                        color={THEME_COLOR_FONT_PRIMARY}
                                        border={`1px solid ${THEME_COLOR_SECONDARY}`}
                                        borderRadius="2xl"
                                        onClick={handleLogout}
                                        variant="outline"
                                        w="fit-content"
                                    >
                                        Sign Out
                                    </Button>
                                </Flex>
                                {renderStep()}
                            </Flex>
                            <Divider my="10px" />
                        </Flex>
                    </Card>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PopupWildfileSocialsModal;
