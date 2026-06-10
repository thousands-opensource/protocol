import React, { useEffect, useState } from "react";
import PopupWildfileVerifyEmailModal from "./PopupWildfileVerifyEmailModal";
import PopupWildfileSocialsModal from "./PopupWildfileSocialsModal";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { checkIfAtLeastOneSocialProviderIdExists } from "@/utils/accountsUtil";
import { AccessRules } from "@/constants/routes";
import { useRouter } from "next/router";

interface WildfileAccountsFlowPopupsProps {
    accessRules: string[];
    redirectUrl?: string;
    followWildcardBool: boolean;
}

/**
 * Account Flow Popups/ Wizard to guide the user through the account setup process based on the required access rules of the given page.
 */
const WildfileAccountsFlowPopups: React.FC<WildfileAccountsFlowPopupsProps> = ({
    accessRules,
    redirectUrl,
    followWildcardBool,
}) => {
    const { userDB, connectedUserDBEmail } = useWildfileUserContext();
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    const isUserEmailVerified = userDB?.beamableProvider?.isVerified || false;
    const isDisplayNameSet = !!userDB?.preferences.displayName;
    const isAtLeastOneSocialIsConnected =
        checkIfAtLeastOneSocialProviderIdExists(userDB);
    const isLinkedWalletSet = !!userDB?.walletProvider?.address;
    const hasEmail = !!connectedUserDBEmail;
    const requireEmail =
        accessRules.includes(AccessRules.REQUIRE_EMAIL) && !isUserEmailVerified;

    const requireTwitterLinked =
        accessRules.includes(AccessRules.REQUIRE_TWITTER_LINKED) &&
        !userDB?.twitterProvider?.id;

    // this includes a check for the user's email and if the user has at least one social account connected + a verified email
    const requireAtLeastOneSocial =
        accessRules.includes(AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL) &&
        !isAtLeastOneSocialIsConnected &&
        !requireTwitterLinked;

    const requireLinkedWallet =
        accessRules.includes(AccessRules.REQUIRE_LINKED_WALLET) &&
        !isLinkedWalletSet;

    const unmetRules: AccessRules[] = [];

    /**
     * Determine the unmet account rules based on the user's current state and required access rules.
     * The order of checks prioritizes certain actions (assuming all rules are required):
     * 1. Social account connection (if required i.e wallet address, in order to get an email for (4))
     * 2. Wallet linking
     * 3. Display name setting
     * 4. Email verification (only if user has an email)
     */
    if (requireTwitterLinked) {
        unmetRules.push(AccessRules.REQUIRE_TWITTER_LINKED);
    }
    if (requireAtLeastOneSocial) {
        unmetRules.push(AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL);
    }
    if (requireLinkedWallet) {
        unmetRules.push(AccessRules.REQUIRE_LINKED_WALLET);
    }
    if (
        accessRules.includes(AccessRules.REQUIRE_DISPLAY_NAME) &&
        !isDisplayNameSet
    ) {
        unmetRules.push(AccessRules.REQUIRE_DISPLAY_NAME);
    }
    if (requireEmail) {
        unmetRules.push(AccessRules.REQUIRE_EMAIL);
    }

    const handleNext = () => {
        if (currentStep < unmetRules.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    useEffect(() => {
        if (
            unmetRules.length === 0 &&
            redirectUrl &&
            router.asPath !== redirectUrl
        ) {
            router.push(redirectUrl);
        }
    }, [unmetRules, redirectUrl, router]);

    if (!userDB) {
        return null;
    }

    const renderModal = () => {
        const currentRule = unmetRules[currentStep];

        if (unmetRules.includes(AccessRules.REQUIRE_EMAIL)) {
            return (
                <PopupWildfileVerifyEmailModal
                    isUserEmailVerified={isUserEmailVerified}
                    redirectUrl={redirectUrl}
                    onNext={handleNext}
                />
            );
        }

        if (
            currentRule === AccessRules.REQUIRE_DISPLAY_NAME ||
            currentRule === AccessRules.REQUIRE_TWITTER_LINKED ||
            currentRule === AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL ||
            currentRule === AccessRules.REQUIRE_LINKED_WALLET
        ) {
            let socialsMessagePrompt = "";
            if (currentRule === AccessRules.REQUIRE_LINKED_WALLET) {
                socialsMessagePrompt = "Link your wallet to continue";
            } else if (currentRule === AccessRules.REQUIRE_TWITTER_LINKED) {
                socialsMessagePrompt =
                    "Connect your X (Twitter) account to continue";
            } else if (
                currentRule === AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL
            ) {
                socialsMessagePrompt =
                    "Connect at least one social account to continue";
            } else {
                socialsMessagePrompt = "Set your display name to continue";
            }

            return (
                <PopupWildfileSocialsModal
                    socialsMessagePrompt={socialsMessagePrompt}
                    redirectUrl={redirectUrl}
                    unmetRules={unmetRules.slice(currentStep)}
                    onNext={handleNext}
                    hasNext={currentStep < unmetRules.length - 1}
                    hasPrevious={currentStep > 0}
                    followWildcardBool={followWildcardBool}
                />
            );
        }

        return null;
    };

    return <>{renderModal()}</>;
};

export default WildfileAccountsFlowPopups;
