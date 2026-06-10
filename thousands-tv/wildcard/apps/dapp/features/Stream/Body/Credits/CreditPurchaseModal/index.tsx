import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import CoinIcon from "./FloatingCoins";
import BonusComponent from "./BonusComponent";
import Image from "next/image";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { Avatar } from "@material-tailwind/react";
import { getUserProfilePicture } from "@/utils/userUtil";
import PaymentEmbedSection from "./PaymentEmbedSection";
import LimitedOfferCard from "./LimitedOfferCard";
import { CreditOption, creditOptions } from "../contants";
import { useGenerateTransactionId } from "@/hooks/credits/useGenerateTransactionId";
import usePollTransactionStatus from "@/hooks/credits/usePollTransactionStatus";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { CreditTransactionStatus } from "@repo/interfaces";

export const useSimulateTransactionCompletion = (
    setStatus: (status: CreditTransactionStatus) => void,
    delay: number = 10000
) => {
    useEffect(() => {
        // Simulate the transaction completion after `delay` milliseconds
        const timer = setTimeout(() => {
            setStatus(CreditTransactionStatus.COMPLETED);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay, setStatus]);
};

interface CreditsPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    bonusMap: Record<number, number>;
}

// seems to be deprecated?
const CreditsPurchaseModal = ({
    isOpen,
    onClose,
    bonusMap,
}: CreditsPurchaseModalProps) => {
    const [selectedOption, setSelectedOption] = useState<CreditOption | null>(
        null
    );
    const [showVerification, setShowVerification] = useState(false);
    const [showBonus, setShowBonus] = useState(false);
    const { userDB, connectedUserDBEmail } = useWildfileUserContext();
    const profPictureSrc = userDB ? getUserProfilePicture(userDB) : "";
    const [showPaymentEmbed, setShowPaymentEmbed] = useState(false);
    const [purchaseStarted, setPurchaseStarted] = useState<boolean>(false);

    const userId = userDB?._id?.toString() || "";
    const { creditBalance } = useWildfileUserContext();
    const {
        transactionId,
        setTransactionId,
        loading: isTransactionIdLoading,
        error: transactionIdError,
        fetchTransactionId,
    } =
        useGenerateTransactionId(); // Hook to generate transaction ID
    const { status, setStatus, error } = usePollTransactionStatus(
        transactionId || "",
        purchaseStarted
    );
    const [isTransactionIdFetched, setIsTransactionIdFetched] = useState(false);

    useEffect(() => {
        if (isOpen && !isTransactionIdFetched) {
            fetchTransactionId();
            setIsTransactionIdFetched(true); // Mark transaction ID as fetched
        }
    }, [isOpen, isTransactionIdFetched, fetchTransactionId]);

    const handleOptionSelect = (option: CreditOption) => {
        setSelectedOption({
            ...option,
            name: `${option.credits} Credits Package`,
            image: "/images/Credits/coin.webp",
        });
        setShowVerification(true);
    };

    /**
     * Handle the cancel of the purchase
     */
    const handleCancel = () => {
        setSelectedOption(null);
        setShowVerification(false);
        setPurchaseStarted(false);
        setIsTransactionIdFetched(false);
    };

    /**
     * Handle the purchase of credits
     */
    const handlePurchase = () => {
        setShowPaymentEmbed(true);
        setPurchaseStarted(true);
    };

    // use effect that set status to completed immediately
    // useSimulateTransactionCompletion(setStatus, 1000 * 1);

    /**
     * Close the modal and reset the selected option + payment embed
     */
    const handleCloseModal = () => {
        // Use React 18's automatic batching instead
        onClose();
        setSelectedOption(null);
        setShowVerification(false);
        setPurchaseStarted(false);
        setIsTransactionIdFetched(false);
        setStatus(CreditTransactionStatus.NONE);
        setTransactionId(null);
        setShowPaymentEmbed(false);
    };

    if (!isOpen) return null;

    const renderCancelPurchaseButton = () => {
        if (
            status === CreditTransactionStatus.PENDING ||
            status === CreditTransactionStatus.COMPLETED
        ) {
            return;
        }

        return (
            <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-400 font-semibold
                             hover:text-gray-300 transition-colors duration-200"
            >
                Cancel
            </button>
        );
    };

    /**
     * Render the verify purchase JSX
     * @param selectedOption - the selected credit option
     * @returns
     */
    const renderVerifyPurchaseJSX = (selectedOption: CreditOption) => {
        return (
            <>
                <div
                    className={`${selectedOption.color} rounded-xl overflow-hidden w-64 `}
                    style={{
                        background:
                            "linear-gradient(to right, #a32c24 60%, #471565)",
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <div className="flex flex-col items-center p-6">
                        <CoinIcon size="lg" showAnimation={true} />
                        <div className="flex items-center mt-4">
                            <span className="text-2xl font-bold text-white">
                                {selectedOption.credits}
                            </span>
                            <Image
                                src="/images/Credits/coin.webp"
                                alt="C"
                                className="w-8 h-8 ml-2"
                                width={32}
                                height={32}
                            />
                        </div>
                    </div>
                    <div className="bg-[#383838] p-3">
                        <div className="text-white font-semibold text-lg">
                            ${selectedOption.price}
                        </div>
                    </div>
                </div>

                <div className="space-y-3 w-64">
                    <button
                        onClick={() => {
                            handlePurchase();
                        }}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-3xl 
                                     hover:bg-blue-700 transition-colors duration-200"
                    >
                        PURCHASE
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
                        <div className="flex flex-col items-center p-2 sm:p-4">
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
     * Rebder the complete purchase display (thidweb payment embed)
     * @param selectedOption - the selected credit option
     * @returns
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
                    {status === CreditTransactionStatus.COMPLETED && (
                        <div className=" inset-0 z-10">
                            {renderTransactionCompletedJSX()}
                        </div>
                    )}
                </div>

                {status === CreditTransactionStatus.NONE && (
                    <button
                        onClick={() => {
                            setShowPaymentEmbed(false);
                            handleCancel();
                        }}
                        className="mt-4 w-full px-6 py-1 text-gray-400 font-semibold hover:text-gray-300 transition-colors duration-200"
                    >
                        CANCEL
                    </button>
                )}
            </div>
        );
    };

    /**
     * Show "Transaction Completed" when the transaction status is completed
     */
    const renderTransactionCompletedJSX = () => {
        return (
            <div className="relative w-full max-w-md mx-auto p-6 bg-[#131418] text-white rounded-lg border border-white shadow-lg">
                <ConfettiCelebration
                    colors={["#ff5959", "#ffbb00", "#37b24d", "#1c7ed6"]}
                />
                <div className="text-center">
                    <h4 className="text-2xl font-bold text-[#30A46C]">
                        Transaction Completed
                    </h4>
                    <p>Your purchase was successful!</p>
                    <button
                        onClick={() => {
                            handleCloseModal();
                            setStatus(CreditTransactionStatus.NONE);
                        }}
                        className="mt-4 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 border border-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    /**
     * Show "Transaction Processing" when the transaction status is pending
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
     * Show "Transaction Failed" when the transaction status is failed
     */
    const renderTransactionFailedJSX = () => (
        <div className="relative w-full max-w-md mx-auto p-6  bg-[#131418] text-white rounded-lg border border-white shadow-lg">
            <div className="text-center">
                <h4 className="text-2xl font-bold text-red-500">
                    Transaction Failed
                </h4>
                <p>There was an error processing your payment.</p>
                <button
                    onClick={() => {
                        handleCloseModal();
                        setStatus(CreditTransactionStatus.NONE);
                    }}
                    className="mt-4 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 border border-white"
                >
                    Close
                </button>
            </div>
        </div>
    );

    /**
     * Render the purchase options display ()
     * @param selectedOption - the selected credit option
     */
    const renderPurchaseOptionsDisplayJSX = (selectedOption: CreditOption) => {
        // Show pending/failed states as overlays if payment embed is visible
        if (showPaymentEmbed) {
            return (
                <div className="relative">
                    {renderCompletePurchaseDisplayJSX(selectedOption)}

                    {status === CreditTransactionStatus.PENDING && (
                        <div className=" inset-0 z-20 flex items-center justify-center">
                            {renderTransactionProcessingJSX()}
                        </div>
                    )}

                    {status === CreditTransactionStatus.FAILED && (
                        <div className=" inset-0 z-20 flex items-center justify-center ">
                            {renderTransactionFailedJSX()}
                        </div>
                    )}
                </div>
            );
        }

        // If payment embed isn't shown yet, show the verify purchase UI
        return <>{renderVerifyPurchaseJSX(selectedOption)}</>;
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
                <div
                    className="fixed inset-0 bg-[#121212]/65 backdrop-blur-lg"
                    onClick={showVerification ? undefined : handleCloseModal}
                />

                <div className="relative w-full max-w-2xl my-6 mx-auto bg-[#1A1B1F] rounded-2xl shadow-xl border border-white">
                    {/* Fixed Header */}
                    <div className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-gray-800 bg-[#1A1B1F] rounded-2xl">
                        <div className="flex items-center gap-2">
                            <X
                                className="w-6 h-6 cursor-pointer transition-all duration-200 ease-in-out"
                                onClick={handleCloseModal}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Bonus Button in Header */}
                            <button
                                onClick={() => setShowBonus(!showBonus)}
                                className={`top-4 right-4 px-4 py-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
                                    showBonus
                                        ? "bg-emerald-600 text-white hover:bg-emerald-800"
                                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                                }`}
                            >
                                Bonus
                            </button>
                            <Avatar
                                size="sm"
                                src={profPictureSrc}
                                alt={connectedUserDBEmail ?? ""}
                                className="w-8 h-8 rounded-full border-2 border-solid"
                            />
                        </div>
                    </div>

                    <div className=" max-h-[calc(100vh-4rem)] overflow-y-auto">
                        {/* Content */}
                        <div className="relative">
                            {/* Bonus Component */}
                            {showBonus && (
                                <div className="p-6 bg-gradient-to-r from-green-400/50 to-cyan-500/50">
                                    <BonusComponent
                                        credits={2000}
                                        onClaim={() => {
                                            setSelectedOption({
                                                credits: 2000,
                                                price: 0,
                                                color: "bg-gradient-to-r from-emerald-400 to-cyan-500",
                                                tileColor: "bg-[#1A1B1F]",
                                                isAvailable: true,
                                                name: "2,000 Credits Bonus Package",
                                                image: "/images/Credits/coin.webp",
                                                id: "test",
                                                sku: "thousands.credits.2000",
                                            });
                                            setShowVerification(true);
                                        }}
                                    />
                                </div>
                            )}

                            {/* Main Content */}
                            <div
                                className={`p-6 space-y-8 transition-opacity duration-200 ${
                                    showVerification
                                        ? "opacity-20 pointer-events-none"
                                        : "opacity-100"
                                }`}
                            >
                                <div>
                                    <h3 className="text-3xl font-bold text-white">
                                        Purchase Credits
                                    </h3>
                                    <p className="text-gray-400 mt-2">
                                        Lorem ipsum dolor sit amet, consectetuer
                                        adipiscing elit, sed diam nonummy nibh
                                        euismod tincidunt ut laoreet dolore
                                        magna aliquam erat
                                    </p>
                                </div>

                                {renderCreditPurchaseOptionsJSX()}

                                <div className="space-y-4">
                                    <h4 className="text-3xl font-bold text-white">
                                        Limited Offer
                                    </h4>
                                    {/* <div className="space-y-4">
                                        {limitedOffers.map(
                                            (
                                                offer: CreditsPurchaseOffer,
                                                index: number
                                            ) => (
                                                <LimitedOfferCard
                                                    key={index}
                                                    offer={offer}
                                                    onSelect={
                                                        handleOptionSelect
                                                    }
                                                />
                                            )
                                        )}
                                    </div> */}
                                </div>
                            </div>

                            {/* Verification Overlay */}
                            {showVerification && selectedOption && (
                                <div className="absolute inset-1 flex flex-col items-center justify-center bg-[#1A1B1F]/90  rounded-xl">
                                    <div className="text-center space-y-6">
                                        {renderPurchaseOptionsDisplayJSX(
                                            selectedOption
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreditsPurchaseModal;
