import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { getUserProfilePicture } from "@/utils/userUtil";
import { useGenerateTransactionId } from "@/hooks/credits/useGenerateTransactionId";
import usePollTransactionStatus from "@/hooks/credits/usePollTransactionStatus";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { CreditTransactionStatus, IUser } from "@repo/interfaces";
import {
    CreditOption,
    creditOptions,
    limitedOffers,
} from "@/features/Stream/Body/Credits/contants";
import PaymentEmbedSection from "@/features/Stream/Body/Credits/CreditPurchaseModal/PaymentEmbedSection";
import CreditsGrid from "@/features/Stream/Body/Credits/CreditPurchaseModal/CreditsGrid";
import CreditsLogoutButton from "./CreditsLogoutButton";
import { calculateTotalCredits } from "@/utils/util";
import { Text, Box, Checkbox, Flex, Portal, Spinner } from "@chakra-ui/react";
import { getSizeClasses } from "@/features/Stream/Body/Credits/CreditPurchaseModal/PurchaseCard";
import { poppinsBold, poppinsLight } from "@/utils/themeUtil";
import useCreditBalance from "./useCreditBalance";
import { LimitedTimeDiscount } from "@/types";
import TransactionCompletionModal from "./TransactionCompletionModal";
import { useBuyCreditsStore } from "@/store/useBuyCreditsStore";
import waxios from "@/utils/waxios";
import { FaBitcoin, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import type { AccountListResponse } from "@snagsolutions/sdk/resources/loyalty/accounts";
import { getSnagLoyaltyPointsHomePageUrl } from "@/utils/environmentUtilWCA";

interface CreditsPurchaseUIProps {
    bonusMap: Record<string, number>;
    discountCategory: LimitedTimeDiscount[];
    isBonusLoading?: boolean;
}

/**
 * Credits purchase UI component
 */
const CreditsPurchaseUI = ({
    bonusMap,
    discountCategory,
    isBonusLoading = false,
}: CreditsPurchaseUIProps) => {
    const [selectedOption, setSelectedOption] = useState<CreditOption | null>(
        null
    );
    const {
        userDB,
        setUserDB,
        setConnectedUserDBProviderId,
        setConnectedUserDBEmail,
    } = useWildfileUserContext();
    const [showVerification, setShowVerification] = useState(false);
    const [showBonus, setShowBonus] = useState(false);
    const { connectedUserDBEmail } = useWildfileUserContext();
    const profPictureSrc = userDB ? getUserProfilePicture(userDB) : "";
    const [showPaymentEmbed, setShowPaymentEmbed] = useState("");
    const [purchaseStarted, setPurchaseStarted] = useState<boolean>(false);
    const [uniqueBtnId, setUniqueBtnId] = useState<string>("");
    const { creditBalanceObj, loading, error, fetchCreditBalance } =
        useCreditBalance(userDB?._id?.toString() || "");
    const [agreedToTerms, setAggreedToTerms] = useState<boolean>(false);
    const { purchaseType, setSku, sku, setXSollaAccessToken } =
        useBuyCreditsStore();

    const updateUserContext = useCallback(() => {
        setUserDB(userDB);
        if (connectedUserDBEmail) {
            setConnectedUserDBEmail(connectedUserDBEmail);
        }
    }, [userDB]);

    const {
        transactionId,
        setTransactionId,
        loading: isTransactionIdLoading,
        error: transactionIdError,
        fetchTransactionId,
    } = useGenerateTransactionId();
    const { status, setStatus } = usePollTransactionStatus(
        transactionId || "",
        purchaseStarted,
        fetchCreditBalance
    );
    const isTransactionCompleted = status === CreditTransactionStatus.COMPLETED;
    const [isTransactionIdFetched, setIsTransactionIdFetched] = useState(false);
    // False default to Pay with Crypto, (Credit card purchase is deprecated)
    const [isPayWithLoyaltyPoints, setIsPayWithLoyaltyPoints] = useState(false);
    const [loyaltyPointsBalance, setLoyaltyPointsBalance] = useState<number | null>(null);
    const [isLoyaltyLoading, setIsLoyaltyLoading] = useState<boolean>(false);
    const walletAddress = userDB?.walletProvider?.address;
    const loyaltyPointsHomePageUrl = getSnagLoyaltyPointsHomePageUrl();

    const hasEnoughLoyaltyPoints = useMemo(() => {
        if (!selectedOption) {
            return false;
        }

        if (loyaltyPointsBalance === null) {
            return false;
        }

        return loyaltyPointsBalance >= selectedOption.credits;
    }, [loyaltyPointsBalance, selectedOption]);

    useEffect(() => {
        updateUserContext();
    }, [updateUserContext]);

    useEffect(() => {
        if (!hasEnoughLoyaltyPoints && isPayWithLoyaltyPoints) {
            setIsPayWithLoyaltyPoints(false);
        }
    }, [hasEnoughLoyaltyPoints, isPayWithLoyaltyPoints]);

    const fetchLoyaltyPointsBalance = useCallback(async () => {
        if (!walletAddress) {
            setLoyaltyPointsBalance(null);
            return;
        }

        setIsLoyaltyLoading(true);

        try {
            const response = await waxios.get(
                "/api/referrals/getLoyaltyPointBalance",
                {
                    params: {
                        walletAddress,
                    },
                }
            );

            if (response?.data?.success) {
                const currentLoyaltyPointBalance = response.data.data;
                setLoyaltyPointsBalance(currentLoyaltyPointBalance);
            } else {
                setLoyaltyPointsBalance(0);
            }
        } catch (error) {
            console.error("Failed to fetch loyalty point balance", error);
            setLoyaltyPointsBalance(null);
        } finally {
            setIsLoyaltyLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchLoyaltyPointsBalance();
    }, [fetchLoyaltyPointsBalance]);

    const handleOpenLoyaltyPoints = useCallback(() => {
        if (!loyaltyPointsHomePageUrl) {
            console.warn(
                "Thousands points home page URL is not configured; cannot open portal."
            );
            return;
        }

        window.open(loyaltyPointsHomePageUrl, "_blank", "noopener,noreferrer");
    }, [loyaltyPointsHomePageUrl]);

    useEffect(() => {
        if (!isTransactionIdFetched) {
            fetchTransactionId();
            setIsTransactionIdFetched(true);
        }
    }, [isTransactionIdFetched, fetchTransactionId]);

    /**
     * When an option is selected, update the selected option state
     */
    const handleOptionSelect = (option: CreditOption) => {
        const creditsAmount = calculateTotalCredits(
            option.credits,
            bonusMap[option.id]
        );
        setSelectedOption({
            ...option,
            name: `${creditsAmount} Credits Package`,
            image: "/images/Credits/coin.webp",
        });
        setShowVerification(true);
        setAggreedToTerms(false);

        //if (purchaseType === "fiat") {
        setSku(option.sku);
        //}
    };

    /**
     * Cancel the current purchase process (only if not pending or completed)
     */
    const handleCancel = () => {
        setSelectedOption(null);
        setShowVerification(false);
        setPurchaseStarted(false);
        setIsTransactionIdFetched(false);
    };

    /*
    const fetchXSollaAccessToken = async () => {
        try {
            const body = {
                userId: userDB?._id?.toString(),
                userName: userDB?.twitchProvider?.name,
                userEmail: userDB?.twitchProvider?.email,
                sku: sku,
            };
            const response = await waxios.post(
                "/api/xsolla/payment-token",
                body
            );

            if (!response.data) {
                return;
            }

            if (!response.data.success) {
                return;
            }

            setXSollaAccessToken(response.data.token);
        } catch (e: any) {
            console.error("Failed to fetch payment token", e);
            setSku("");
        }
    };
    */

    /**
     * Trigger the purchase process by showing the payment embed
     */
    const handlePurchase = async () => {
        if (isPayWithLoyaltyPoints) {
            if (!selectedOption) {
                return;
            }

            setShowPaymentEmbed("loyaltypoints");
            setPurchaseStarted(true);
            setStatus(CreditTransactionStatus.PENDING);

            try {
                const response = await waxios.post(
                    "/api/credits/purchaseWithPoints",
                    {
                        transactionId,
                        credits: selectedOption.credits,
                    }
                );

                if (response?.data?.success) {
                    setStatus(CreditTransactionStatus.COMPLETED);
                } else {
                    setStatus(CreditTransactionStatus.FAILED);
                }
            } catch (error) {
                console.error("Failed to purchase with loyalty points", error);
                setStatus(CreditTransactionStatus.FAILED);
            }
        } else {
            setShowPaymentEmbed("crypto");
            setPurchaseStarted(true);
        }
    };

    /**
     * Reset the entire purchase flow (used by the close button)
     */
    const handleReset = async () => {
        setSelectedOption(null);
        setShowVerification(false);
        setPurchaseStarted(false);
        setIsTransactionIdFetched(false);
        setStatus(CreditTransactionStatus.NONE);
        setTransactionId(null);
        setShowPaymentEmbed("");
        await fetchLoyaltyPointsBalance();
        if (fetchCreditBalance) {
            await fetchCreditBalance();
        }
    };
    const handleTermsCheckboxChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setAggreedToTerms(e.target.checked);
    };

    const renderCancelPurchaseButton = () => {
        if (
            status === CreditTransactionStatus.PENDING ||
            status === CreditTransactionStatus.COMPLETED
        ) {
            return null;
        }
        return (
            <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-400 font-semibold hover:text-gray-300 transition-colors duration-200"
            >
                Cancel
            </button>
        );
    };

    /**
     * Render the verification step UI
     */
    /**
     * Render the verification step UI
     */
    const renderVerifyPurchaseJSX = (selectedOption: CreditOption) => {
        const creditsAmount = calculateTotalCredits(
            selectedOption.credits,
            bonusMap[selectedOption.id]
        );

        const { coinClass, creditsClass, oldCreditsClass } =
            getSizeClasses("medium");

        return (
            <>
                <div
                    className="
          flex flex-col
          w-64
          overflow-hidden
          border-[5px]
          border-[1px] border-white
            rounded-xl
        "
                >
                    {/* Top section with gradient overlay */}
                    <div
                        className={`
            relative flex-1 
            px-4 py-2 sm:px-6 sm:py-3
            ${selectedOption.color}
            rounded-t-xl
            border-2 
             border-[1px] border-white"
            
          `}
                    >
                        {/* SVG texture overlay */}
                        <div
                            className="
              absolute inset-0
              bg-[url('/images/limited-credit-offers/shimmer.svg')]
              bg-center bg-repeat
              bg-[length:750px_750px]
              opacity-30
              pointer-events-none
            "
                        />
                        {/* Content above overlay */}
                        <div className="flex flex-col items-center gap-2">
                            <span
                                className={`text-white font-bold leading-none ${creditsClass} ${poppinsBold.className}`}
                            >
                                {isPayWithLoyaltyPoints ? selectedOption.credits : creditsAmount}
                            </span>
                            <Image
                                src="/images/Credits/coin-large.webp"
                                alt="C"
                                className={`rounded-full opacity-90 ${coinClass}`}
                                width={64}
                                height={54}
                            />
                        </div>
                    </div>
                    {/* Bottom section with price */}
                    <div
                        className="
                            backdrop-blur-sm bg-white/15
                            px-2 p-2 sm:px-3 sm:p-2
                            flex justify-center
                            border-x-[1px] border-b-[0.5px] border-white/10
                            rounded-b-xl
                        "
                    >
                        <div className="flex flex-row mt-1 items-center gap-[10px]">
                            {!isPayWithLoyaltyPoints &&
                                <div className="bg-blue-500 rounded-3xl px-2 sm:px-4 h-8 sm:h-9 flex items-center">
                                    <span className="text-white font-semibold text-xs sm:text-sm">
                                        ${selectedOption.price}
                                    </span>
                                </div>
                            }
                            {isPayWithLoyaltyPoints &&
                                <div className="bg-white rounded-3xl px-2 sm:px-4 h-8 sm:h-9 flex items-center gap-1">
                                    <span className="font-semibold text-xs sm:text-sm" style={{ color: "#00c754" }}>
                                        {selectedOption.credits}
                                    </span>
                                    <Image
                                        src="/images/Credits/loyaltypointsstar.svg"
                                        alt="Thousands Points"
                                        width={16}
                                        height={16}
                                    />
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="space-y-3 w-64 mt-4">
                    <div
                        className="flex"
                        style={{
                            backgroundColor: "rgba(64, 64, 64, 0.35)",
                            borderRadius: "12px",
                            marginBottom: "12px",
                        }}
                    >
                        <Flex gap={1} w="100%">
                            {<Flex
                                flex={1}
                                flexDirection="column"
                                p={4}
                                textAlign="center"
                                borderRadius="lg"
                                boxShadow="md"
                                border="solid"
                                h="100px"
                                gap={1}
                                alignItems="center"
                                justifyContent="center"
                                cursor={hasEnoughLoyaltyPoints ? "pointer" : "not-allowed"}
                                opacity={hasEnoughLoyaltyPoints ? 1 : 0.4}
                                borderColor={
                                    isPayWithLoyaltyPoints
                                        ? "rgba(255,255,255,1"
                                        : "rgba(255,255,255,0.5)"
                                }
                                borderWidth={isPayWithLoyaltyPoints ? "3px" : "1px"}
                                zIndex={5}
                                onClick={() => {
                                    if (!hasEnoughLoyaltyPoints) {
                                        return;
                                    }
                                    setIsPayWithLoyaltyPoints(true);
                                }}
                            >
                                <Text>Thousands Points</Text>
                                <Box fontSize="24px">
                                    <Image
                                        src="/images/Credits/loyaltypointsstar.svg"
                                        alt="Thousands Points"
                                        width={20}
                                        height={20}
                                    />
                                </Box>
                            </Flex>}
                            <Flex
                                flex={1}
                                flexDirection="column"
                                p={4}
                                textAlign="center"
                                borderRadius="lg"
                                boxShadow="md"
                                border="solid"
                                h="100px"
                                gap={1}
                                alignItems="center"
                                justifyContent="center"
                                cursor="pointer"
                                borderColor={
                                    !isPayWithLoyaltyPoints
                                        ? "rgba(255,255,255,1"
                                        : "rgba(255,255,255,0.5)"
                                }
                                borderWidth={!isPayWithLoyaltyPoints ? "3px" : "1px"}
                                zIndex={5}
                                onClick={() => {
                                    setIsPayWithLoyaltyPoints(false);
                                }}
                            >
                                <Text>Crypto</Text>
                                <Box fontSize="24px">
                                    <FaBitcoin />
                                </Box>
                            </Flex>
                        </Flex>
                    </div>  
                    {(isPayWithLoyaltyPoints && 
                    <Text fontSize="12px" color="red">
                        When purchasing with Thousands Points, points are exchanged 1 for 1 with credits and credit purchase bonuses are not applied.
                    </Text>)}
                </div>

                <div className="space-y-3 w-64 mt-4">
                    <div
                        className="flex"
                        style={{
                            backgroundColor: "rgba(64, 64, 64, 0.35)",
                            borderRadius: "12px",
                            marginBottom: "12px",
                        }}
                    >
                        <div className="flex-1 p-2 flex items-center justify-center">
                            <Checkbox onChange={handleTermsCheckboxChange} />
                        </div>
                        <div className="flex-3 p-2">
                            <p>
                                I agree to these{" "}
                                <a
                                    href="/terms"
                                    target="_blank"
                                    className="font-normal text-blue underline"
                                >
                                    Terms and Conditions
                                </a>
                            </p>
                        </div>
                    </div>

                    <button
                        style={{
                            backgroundColor: agreedToTerms ? "" : "gray",
                            cursor: agreedToTerms ? "pointer" : "not-allowed",
                        }}
                        onClick={handlePurchase}
                        disabled={!agreedToTerms}
                        className={`w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-3xl border ] hover:bg-blue-700 transition-colors duration-200 ${poppinsBold.className}`}
                    >
                        Purchase
                    </button>
                    {renderCancelPurchaseButton()}
                </div>
            </>
        );
    };

    /**
     * Render the credit purchase options
     */
    const renderCreditPurchaseOptionsJSX = () => {
        return (
            <div className="grid grid-cols-4 gap-2 w-full">
                {creditOptions.map((option, index) => (
                    <div
                        key={index}
                        className={`${option.color} min-w-[50px] sm:min-w-[50px] md:min-w-[80px] lg:min-w-[80px] rounded-lg cursor-pointer transition-transform hover:scale-105`}
                        onClick={() => handleOptionSelect(option)}
                    >
                        <div
                            className="
                                absolute inset-0 
                                bg-center bg-cover
                                opacity-30 
                                pointer-events-none
                            "
                        />

                        {/* Actual content in a relative container so it sits above the overlay */}
                        <div className="relative flex flex-col items-center p-2">
                            <Image
                                src="/images/Credits/coin-large.webp"
                                alt="C"
                                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full opacity-90"
                                width={48}
                                height={48}
                            />
                            <div className="flex items-center mt-1 sm:mt-2">
                                <span className="text-sm sm:text-xl font-bold text-white whitespace-nowrap">
                                    {option.credits >= 1000
                                        ? `${option.credits / 1000}K`
                                        : option.credits}
                                </span>
                                <Image
                                    src="/images/Credits/coin.webp"
                                    alt="C"
                                    className="w-4 h-4 sm:w-6 sm:h-6 ml-1"
                                    width={24}
                                    height={24}
                                />
                            </div>
                        </div>
                        <div className="bg-[#383838] p-1 sm:p-2 rounded-bl-lg rounded-br-lg">
                            <button className="w-full px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 rounded-md text-white hover:bg-blue-700">
                                ${option.price}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    /**
     * Render the complete purchase UI (with payment embed)
     */
    const renderCompletePurchaseDisplayJSX = (selectedOption: CreditOption) => {
        return (
            <div className="w-full max-w-md">
                <div className="relative">
                    <PaymentEmbedSection
                        selectedOption={selectedOption}
                        userId={userDB?._id?.toString() || ""}
                        setTransactionId={setTransactionId}
                        transactionId={transactionId}
                        isTransactionIdLoading={isTransactionIdLoading}
                        transactionIdError={transactionIdError}
                        bonusMap={bonusMap}
                    />

                    {/* Overlay our completion/status UI */}
                    <TransactionCompletionModal
                        isVisible={isTransactionCompleted}
                        onClose={handleReset}
                        setStatus={setStatus}
                    />
                </div>

                {status === CreditTransactionStatus.NONE && (
                    <button
                        onClick={() => {
                            setShowPaymentEmbed("");
                            handleCancel();
                        }}
                        className="mt-4 w-full px-6 py-1 text-gray-400 font-semibold hover:text-gray-500 transition-colors duration-200"
                    >
                        CANCEL
                    </button>
                )}
            </div>
        );
    };

    /**
     * Render UI when transaction is processing
     */
    const renderTransactionProcessingJSX = () => (
        <div className="w-full text-center">
            <h4 className="text-xl font-bold">
                Your payment is being processed...
            </h4>
            <p>Please wait until the payment is complete.</p>
            <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        </div>
    );

    /**
     * Render UI when transaction has failed
     */
    const renderTransactionFailedJSX = () => (
        <div className="relative w-full max-w-md mx-auto p-6 bg-[#131418] text-white rounded-lg border border-white shadow-lg">
            <div className="text-center">
                <h4 className="text-2xl font-bold text-red-500">
                    Transaction Failed
                </h4>
                <p>There was an error processing your payment.</p>
                <button
                    onClick={handleReset}
                    className="mt-4 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 border border-white"
                >
                    Close
                </button>
            </div>
        </div>
    );

    /**
     * Render the overall purchase options UI—either showing the verification step
     * or the payment embed with overlays for pending/failed states.
     */
    const renderPurchaseOptionsDisplayJSX = (selectedOption: CreditOption) => {
        if (showPaymentEmbed === "loyaltypoints") {
            return (
                <div className="relative">
                    <div className="w-full max-w-md">
                        <div className="relative">
                            {/* Overlay our completion/status UI */}
                            <TransactionCompletionModal
                                isVisible={isTransactionCompleted}
                                onClose={handleReset}
                                setStatus={setStatus}
                            />
                        </div>

                        {status === CreditTransactionStatus.NONE && (
                            <button
                                onClick={() => {
                                    setShowPaymentEmbed("");
                                    handleCancel();
                                }}
                                className="mt-4 w-full px-6 py-1 text-gray-400 font-semibold hover:text-gray-500 transition-colors duration-200"
                            >
                                CANCEL
                            </button>
                        )}
                    </div>
                    {status === CreditTransactionStatus.PENDING && (
                        <div className="inset-0 z-20 flex items-center justify-center">
                            {renderTransactionProcessingJSX()}
                        </div>
                    )}
                    {status === CreditTransactionStatus.FAILED && (
                        <div className="inset-0 z-20 flex items-center justify-center">
                            {renderTransactionFailedJSX()}
                        </div>
                    )}
                </div>
            );
        }

        if (showPaymentEmbed === "crypto") {
            return (
                <div className="relative">
                    {renderCompletePurchaseDisplayJSX(selectedOption)}
                    {status === CreditTransactionStatus.PENDING && (
                        <div className="inset-0 z-20 flex items-center justify-center">
                            {renderTransactionProcessingJSX()}
                        </div>
                    )}
                    {status === CreditTransactionStatus.FAILED && (
                        <div className="inset-0 z-20 flex items-center justify-center">
                            {renderTransactionFailedJSX()}
                        </div>
                    )}
                </div>
            );
        }
        return <>{renderVerifyPurchaseJSX(selectedOption)}</>;
    };

    return (
        <div className="w-full sm:h-auto sm:max-w-[500px] sm:mx-auto sm:my-8 sm:rounded-2xl sm:shadow-xl sm:border sm:border-white">
            {/* Header */}

            {/* Main Content */}
            <div className="max-h-[calc(100vh-4rem)]">
                <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className={poppinsBold.className}>
                            Limited Time Credit Sale
                        </h2>
                        <button
                            type="button"
                            title="Thousands Points"                            
                            onClick={handleOpenLoyaltyPoints}
                            disabled={isLoyaltyLoading || !loyaltyPointsHomePageUrl}
                            className={`flex items-center justify-end min-w-[80px] gap-2 text-white bg-transparent border-0 p-0 focus:outline-none ${
                                isLoyaltyLoading || !loyaltyPointsHomePageUrl
                                    ? "cursor-default"
                                    : "cursor-pointer"
                            }`}
                            aria-label="Open Thousands Points"
                        >
                            {isLoyaltyLoading ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <>
                                    <span className={`${poppinsBold.className} text-sm sm:text-base`}>
                                        {loyaltyPointsBalance !== null
                                            ? loyaltyPointsBalance.toLocaleString()
                                            : "--"}
                                    </span>
                                    <Image
                                        src="/images/Credits/loyaltypointsstar.svg"
                                        alt="Thousands Points"
                                        width={20}
                                        height={20}
                                    />
                                </>
                            )}
                        </button>
                    </div>
                    <p
                        className={
                            "pt-2 pb-2 text-xs font-normal " +
                            poppinsLight.className
                        }
                    >
                        <span className="font-bold">
                            Exclusive Pre-Season SALE on Thousands Credits!
                        </span>{" "}
                        Unlock deep discounts on Thousands Credits, the native
                        on-platform currency of Thousands.tv. Use Credits to
                        shop, engage, and interact during upcoming live streams.
                        Get an extra bonus for full spectrum Wildpass collectors
                        and completed flair sets. Load up now while these
                        rewards last!
                    </p>

                    {/* Main Purchase Options */}
                    <div
                        className={`space-y-4 mt-1 transition-opacity duration-200 ${
                            isBonusLoading ? "opacity-60" : ""
                        }`}
                    >
                        <div
                            className={`space-y-4 relative ${
                                isBonusLoading ? "pointer-events-none" : ""
                            }`}
                        >
                            <CreditsGrid
                                offers={limitedOffers}
                                onSelect={handleOptionSelect}
                                bonusMap={bonusMap}
                                discountCategory={discountCategory}
                                loyaltyPointsBalance={loyaltyPointsBalance}
                                isBonusLoading={isBonusLoading}
                            />
                            {isBonusLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <Spinner
                                        size="sm"
                                        color="#FF5C34"
                                        thickness="3px"
                                    />
                                    <Text
                                        fontSize="sm"
                                        className={poppinsLight.className}
                                        color="#FF5C34"
                                    >
                                        Loading bonuses...
                                    </Text>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification Overlay */}
                    {showVerification && selectedOption && (
                        <Portal>
                            {/* z-index is 1400 for chakra drawer */}
                            <div
                                style={{ zIndex: 1500 }}
                                className="fixed inset-0 flex flex-col items-center justify-center bg-[#1F000F] bg-opacity-20 backdrop-blur-lg"
                            >
                                <div className="text-center space-y-6">
                                    {renderPurchaseOptionsDisplayJSX(
                                        selectedOption
                                    )}
                                </div>
                            </div>
                        </Portal>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreditsPurchaseUI;
