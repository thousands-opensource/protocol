import React, { useState } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useStreamContext } from "@/contexts/streamContext";
import { ChatApp } from "@repo/interfaces";
import IdentitySelection from "@/features/Stream/Body/Credits/CreditPurchaseModal/IdentitySelection";
import CustomBoostPurchase from "@/features/Stream/Body/Credits/CreditPurchaseModal/CustomBoostPurchase";
import { CreditOption } from "@/features/Stream/Body/Credits/contants";
import { getIdentityById } from "@/utils/indentityUtil";
import { truncateString } from "@/utils/util";
import { Message } from "@pubnub/chat";

interface BoostComponentProps {
    onSendMessage: (
        message: string,
        quote?: Message | null,
        metadata?: {
            [objKey: string]: any;
        }
    ) => void;
    onSendBoost: (boostType: string, boostAmount: number) => void;
}

const BoostComponent = ({
    onSendMessage,
    onSendBoost,
}: BoostComponentProps) => {
    const { chatApp } = useStreamContext();
    const [showIdentities, setShowIdentities] = useState(false);
    const [showBoostPurchase, setShowBoostPurchase] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(
        null
    );
    const [selectedOption, setSelectedOption] = useState<CreditOption | null>(
        null
    );

    const selectedIdentity = getIdentityById(selectedIdentityId);

    const handleSendPledgeCustomMessage = async (
        boostTypeForDisplay: string,
        boostAmount: number
    ) => {
        const metadata = {
            actionTemplate: {
                actionLabel: "Wildcard", // pledge action - wildcard, cheer, etc
                text: `Queued a ${boostTypeForDisplay} boost of ${boostAmount} that will play soon.`,
                type: "pledge", // chat app type
                src: "",
                command: "",
                chatActionGuid: "",
            },
        };
        onSendMessage("", null, metadata);
    };

    const handleIdentitySelect = (identityId: string) => {
        setSelectedIdentityId(identityId);
        setShowIdentities(false);
        setShowBoostPurchase(true);
    };

    const handleCustomPurchase = (credits: number, price: number) => {
        if (!selectedIdentity || !selectedIdentity.price) {
            return;
        }

        setSelectedOption({
            credits,
            price,
            color: "bg-gradient-to-br from-purple-500 to-violet-700",
            tileColor: "bg-[#1A1B1F]",
            isAvailable: true,
            name: `Boost ${selectedIdentity.name ?? ""} - ${price} USD`,
            image: "/images/ServerNavigation/wildcardservercicle.svg",
            id: "test",
            sku: `thousands.credits.${credits}`,
        });
        setShowBoostPurchase(false);
        setShowModal(true);

        onSendBoost(selectedIdentity.fanfareType, selectedIdentity?.price);
        handleSendPledgeCustomMessage(
            selectedIdentity.customMessage,
            selectedIdentity?.price
        );
    };

    const handleButtonClick = () => {
        if (selectedIdentityId) {
            setShowBoostPurchase((prev) => !prev);
        } else {
            // If closing the identities section, reset the selectedIdentityId
            if (showIdentities) {
                setSelectedIdentityId(null);
            }
            setShowIdentities((prev) => !prev);
        }
    };

    if (chatApp !== ChatApp.BOOST) {
        return null;
    }

    return (
        <div className="relative">
            {/* Outer container with gradient border */}
            <div
                className="relative rounded-xl"
                style={{
                    background:
                        "linear-gradient(to right, #a32c24 60%, #471565)",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
                }}
            >
                {/* Inner container */}
                <div className="relative rounded-2xl">
                    {/* Sliding Identities UI */}
                    <div className="relative z-20">
                        <div
                            className={`absolute bottom-full left-0 right-0 mb-2 transform transition-all duration-300 ease-out ${
                                showIdentities
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-4 opacity-0 pointer-events-none"
                            }`}
                        >
                            <IdentitySelection
                                onSelectIdentity={handleIdentitySelect}
                            />
                        </div>
                    </div>

                    {/* Sliding Purchase UI */}
                    <div className="relative z-20">
                        <div
                            className={`absolute bottom-full left-0 right-0 mb-2 transform transition-all duration-300 ease-out ${
                                showBoostPurchase
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-4 opacity-0 pointer-events-none"
                            }`}
                        >
                            <CustomBoostPurchase
                                onCustomPurchase={handleCustomPurchase}
                                selectedIdentityId={selectedIdentityId}
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex items-stretch justify-between p-1 gap-1">
                        {/* Left Container - Wildcard */}
                        <div className="flex items-center gap-3 px-3 bg-gradient-to-tr from-primary-400 via-[#221f1f] to-[#592d27] rounded-lg flex-1 h-9">
                            <Image
                                src="/images/ServerNavigation/wildcardservercicle.svg"
                                alt="Credits"
                                width={28}
                                height={28}
                                className="w-7 h-7"
                            />
                            <span className="text-gray-200 text-xs font-normal">
                                {selectedIdentity
                                    ? truncateString(
                                          `Boost ${selectedIdentity.name}`,
                                          20
                                      )
                                    : "Select Boost"}
                            </span>
                        </div>

                        {/* Right Container - Boost Button */}
                        <button
                            onClick={handleButtonClick}
                            className={`relative px-6 h-9 rounded-lg transition-all duration-300 flex items-center
        ${
            showIdentities || showBoostPurchase
                ? "ring-1 ring-blue-400/30"
                : "ring-1 ring-white/5"
        }`}
                            style={{
                                background:
                                    "linear-gradient(180deg, #49aad1 0%, #4271e2 100%)",
                            }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-poppins">
                                    {selectedIdentityId ? "Boost" : "Boost"}
                                </span>
                                <div
                                    className={`transform transition-transform duration-300 ${
                                        showIdentities || showBoostPurchase
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Credits Purchase Modal */}
            {/* <CreditsPurchaseModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedOption(null);
                    setSelectedIdentityId(null);
                }}
                initialSelectedOption={selectedOption}
                selectedIdentityId={selectedIdentityId}
                setSelectedIdentityId={setSelectedIdentityId}
            /> */}
        </div>
    );
};

export default BoostComponent;
