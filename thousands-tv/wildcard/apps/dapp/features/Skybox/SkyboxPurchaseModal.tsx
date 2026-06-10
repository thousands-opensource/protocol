import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Portal } from "@chakra-ui/react";
import { poppinsBold, poppinsLight, poppinsMedium } from "@/utils/themeUtil";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import { skyboxTierToMembership } from "./types";

export interface SkyboxPurchaseOption {
    id: number;
    title: string;
    price: number;
    creditPrice: number; // Price in credits
    color: string;
    borderColor: string;
    features: string[];
    maxMembers: number;
    includedPerks: string[];
}

export const skyboxOptions: SkyboxPurchaseOption[] = [
    {
        id: 1,
        title: "Club Skybox",
        price: 9.99,
        creditPrice: 60000,
        color: "bg-gradient-to-br from-blue-500 to-blue-700",
        borderColor: "border-blue-400",
        features: [/*"Club Skybox Features",*/ "Up to 4 Members"],
        maxMembers: skyboxTierToMembership[1],
        includedPerks: [
            "Private Chat",
            "All Skybox members receive 10% bonus points on all points earned",
            "Gain visibility in public chat via highlighted messages",
            "The Skybox purchaser receives 10% of their members' points added to their own total",
        ],
    },
    {
        id: 2,
        title: "VIP Skybox",
        price: 19.99,
        creditPrice: 120000,
        color: "bg-gradient-to-br from-purple-500 to-purple-700",
        borderColor: "border-purple-400",
        features: [/*"VIP Skybox Features",*/ "Up to 10 Members"],
        maxMembers: skyboxTierToMembership[2],
        includedPerks: [
            "Private Chat",
            "All Skybox members receive 10% bonus points on all points earned",
            "Gain visibility in public chat via highlighted messages",
            "The Skybox purchaser receives 10% of their members' points added to their own total",
        ],
    },
    {
        id: 3,
        title: "Thousands Skybox",
        price: 19.99,
        creditPrice: 200000,
        color: "bg-gradient-to-br from-orange-500 to-orange-700",
        borderColor: "border-purple-400",
        features: [/*"Thousands Skybox Features",*/ "Up to 20 Members"],
        maxMembers: skyboxTierToMembership[3],
        includedPerks: [
            "Private Chat",
            "All Skybox members receive 10% bonus points on all points earned",
            "Gain visibility in public chat via highlighted messages",
            "The Skybox purchaser receives 10% of their members' points added to their own total",
        ],
    },
];

interface SkyboxPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (option: SkyboxPurchaseOption) => void;
}

export const SkyboxPurchaseModal: React.FC<SkyboxPurchaseModalProps> = ({
    isOpen,
    onClose,
    onPurchase,
}) => {
    const [purchaseMethod, setPurchaseMethod] = useState<"credits" | "money">(
        "credits"
    );
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const { selectedOption, setSelectedOption } = useSkyboxStore();

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle purchase confirmation
    const handlePurchaseConfirm = () => {
        if (selectedOption) {
            onPurchase(selectedOption);
            onClose();
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedOption(null);
            setAgreedToTerms(false);
            setPurchaseMethod("credits");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div
                    ref={modalRef}
                    className="bg-[#1A1A1A] rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-fadeIn border border-gray-700 max-h-[90vh] flex flex-col"
                    style={{
                        backgroundImage:
                            "url(/images/whitecirclestopbgoverlay01.svg)",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top center",
                        backgroundBlendMode: "overlay",
                    }}
                >
                    {/* Header */}
                    <div className="bg-[#272727] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-shrink-0">
                        <h2
                            className={`text-xl sm:text-2xl text-white font-bold ${poppinsBold.className}`}
                        >
                            Purchase Skybox
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Description text */}
                    <div
                        className={`px-4 sm:px-6 pt-4 text-gray-300 ${poppinsLight.className}`}
                    >
                        <p>
                            Upgrade your streaming experience with a private
                            Skybox for you and your friends.
                        </p>
                        <p className="mt-4 text-sm font-bold">
                            All packages have the following benefits:
                        </p>
                        <ul className="text-xs sm:text-sm text-gray-300 space-y-0.5 sm:space-y-1 mt-2">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-1 sm:mr-2">
                                    ✓
                                </span>
                                Private Chat
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-1 sm:mr-2">
                                    ✓
                                </span>
                                All Skybox members receive 10% bonus points on
                                all points earned
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-1 sm:mr-2">
                                    ✓
                                </span>
                                Gain visibility in public chat via highlighted
                                messages
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-1 sm:mr-2">
                                    ✓
                                </span>
                                The Skybox purchaser receives 10% of their
                                members' points added to their own total
                            </li>
                        </ul>
                        <p className="text-sm text-gray-400 mt-4">
                            Select a package below to get started.
                        </p>
                    </div>

                    {/* Scrollable content area */}
                    <div className="overflow-y-auto flex-grow">
                        {/* Purchase Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
                            {skyboxOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className={`
                                        flex flex-col rounded-xl overflow-hidden cursor-pointer
                                        transition-all duration-200 ease-in-out
                                        border-2 border-transparent 
                                        ${
                                            selectedOption?.id === option.id
                                                ? "ring-2 ring-white scale-[1.01]"
                                                : "hover:border-white/50"
                                        }
                                    `}
                                    onClick={() => setSelectedOption(option)}
                                >
                                    {/* Top section with gradient */}
                                    <div
                                        className={`${option.color} relative p-4 sm:p-6`}
                                    >
                                        <div
                                            style={{
                                                backgroundSize: "100% auto",
                                            }}
                                            className="absolute inset-0 bg-[url('/images/limited-credit-offers/shimmer.svg')] bg-no-repeat opacity-30 pointer-events-none"
                                        />

                                        <div className="relative flex justify-between">
                                            <div>
                                                <h3
                                                    className={`text-lg sm:text-xl text-white font-bold ${poppinsBold.className}`}
                                                >
                                                    {option.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                                                    {option.features.map(
                                                        (feature, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="bg-black/30 text-white text-xs px-2 sm:px-3 py-1 rounded-full"
                                                            >
                                                                {feature}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom section with price and features */}
                                    <div className="bg-[#2A2A2A] p-3 sm:p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                                <div className="flex items-center">
                                                    <div className="flex items-center mr-4">
                                                        <Image
                                                            src="/images/Credits/coin.webp"
                                                            alt="Credits"
                                                            width={20}
                                                            height={20}
                                                            className="mr-1"
                                                        />
                                                        <span className="text-white font-bold text-sm sm:text-base">
                                                            {option.creditPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    Max {option.maxMembers}{" "}
                                                    members
                                                </span>
                                            </div>

                                            {/*
                                            <h4 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                                                Includes:
                                            </h4>
                                            <ul className="text-xs sm:text-sm text-gray-300 space-y-0.5 sm:space-y-1">
                                                {option.includedPerks.map(
                                                    (perk, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-center"
                                                        >
                                                            <span className="text-green-400 mr-1 sm:mr-2">
                                                                ✓
                                                            </span>
                                                            {perk}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
*/}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Terms and purchase button - fixed at bottom */}
                    <div className="bg-[#222222] px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                        <label className="flex items-center cursor-pointer mb-2 sm:mb-0">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) =>
                                    setAgreedToTerms(e.target.checked)
                                }
                                className="mr-2"
                            />
                            <span
                                className={`text-xs sm:text-sm text-gray-300 ${poppinsMedium.className}`}
                            >
                                I agree to the{" "}
                                <a
                                    href="/terms"
                                    target="_blank"
                                    className="text-blue-400 underline"
                                >
                                    Terms and Conditions
                                </a>
                            </span>
                        </label>

                        <div className="flex space-x-4 justify-between sm:justify-end w-full sm:w-auto">
                            <button
                                onClick={onClose}
                                className="px-3 sm:px-6 py-1.5 sm:py-2 text-sm text-gray-400 font-semibold hover:text-white transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handlePurchaseConfirm}
                                disabled={!selectedOption || !agreedToTerms}
                                className={`
                                    px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-white text-sm font-medium transition-all
                                    ${poppinsMedium.className}
                                    ${
                                        selectedOption && agreedToTerms
                                            ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                                            : "bg-[#444444] opacity-50 cursor-not-allowed"
                                    }
                                `}
                            >
                                {selectedOption
                                    ? `Purchase ${selectedOption.title}`
                                    : "Select a Skybox Option"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default SkyboxPurchaseModal;
