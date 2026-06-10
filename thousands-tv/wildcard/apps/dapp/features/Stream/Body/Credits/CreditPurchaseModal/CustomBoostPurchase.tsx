import React, { useEffect, useState } from "react";
import { Image } from "@chakra-ui/react";
import { identities } from "@/utils/indentityUtil";

interface CustomBoostPurchaseProps {
    onCustomPurchase: (credits: number, price: number) => void;
    selectedIdentityId: string | null;
}

const CustomBoostPurchase: React.FC<CustomBoostPurchaseProps> = ({
    onCustomPurchase,
    selectedIdentityId,
}) => {
    const [price, setPrice] = useState<string>(() => {
        if (!selectedIdentityId) return "0.001";
        const selectedIdentity = identities.find(
            (id) => id.id === selectedIdentityId
        );
        return selectedIdentity?.price?.toString() || "0.001";
    });
    const [credits, setCredits] = useState<number | null>(null);
    const [focused, setFocused] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Calculate credits based on price
    // Update price when identity selection changes
    useEffect(() => {
        if (selectedIdentityId) {
            const selectedIdentity = identities.find(
                (id) => id.id === selectedIdentityId
            );
            if (selectedIdentity?.price) {
                handlePriceChange(selectedIdentity.price.toString());
            }
        }
    }, [selectedIdentityId, identities]);
    const handlePriceChange = (value: string) => {
        const numericValue = parseFloat(value);
        setHasError(isNaN(numericValue) || numericValue <= 0);

        if (isNaN(numericValue) || numericValue <= 0) {
            setCredits(null);
        } else {
            setCredits(numericValue * 1.5);
        }

        setPrice(value);
    };

    const handlePurchase = () => {
        if (
            !credits ||
            !price ||
            parseFloat(price) <= 0 ||
            !selectedIdentityId
        ) {
            setHasError(true);
            return;
        }

        onCustomPurchase(credits, parseFloat(price));
    };

    // Dynamic gradient based on price
    const getGradient = () => {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0)
            return "from-purple-500/20 to-blue-500/20";
        if (priceNum < 10) return "from-purple-500 to-blue-500";
        if (priceNum < 50) return "from-blue-500 to-cyan-500";
        if (priceNum < 100) return "from-emerald-500 to-green-500";
        return "from-rose-500 to-orange-500";
    };

    return (
        <div
            className="space-y-6 rounded-xl p-6"
            style={{
                background: "linear-gradient(to right, #a32c24 60%, #471565)",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            }}
        >
            <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Image
                        src="/images/ServerNavigation/wildcardservercicle.svg"
                        alt="Credits"
                        width={7}
                        height={7}
                        className="w-4 h-4"
                    />
                    Boost Amount ⚡️
                </h4>
            </div>
            <div
                className={`relative rounded-xl bg-gradient-to-br ${getGradient()} p-[1px] transition-all duration-300`}
            >
                <div className="bg-[#1A1B1F] rounded-xl p-6 space-y-4">
                    <div className="relative">
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="Enter boost amount"
                            disabled={!selectedIdentityId}
                            className={`w-full px-4 py-3 bg-[#1E1F23] text-white rounded-lg 
                transition-all placeholder-blue-400
                ${!selectedIdentityId ? "opacity-50 cursor-not-allowed" : ""}
                ${
                    hasError
                        ? "ring-2 ring-red-500/50 border-red-500"
                        : "focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent"
                }`}
                            style={{ borderWidth: "1px" }}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            USD
                        </div>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={
                            !credits ||
                            parseFloat(price) <= 0 ||
                            !selectedIdentityId
                        }
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white text-md transition-all duration-300
                            ${
                                !credits || parseFloat(price) <= 0
                                    ? "bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            }`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomBoostPurchase;
