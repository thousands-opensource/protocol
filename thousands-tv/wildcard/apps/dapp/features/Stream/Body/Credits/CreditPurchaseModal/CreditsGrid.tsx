import React from "react";
import PurchaseCard from "./PurchaseCard";
import { CreditsPurchaseOffer } from "../contants";
import { LimitedTimeDiscount } from "@/types";

interface CreditsGridProps {
    offers: CreditsPurchaseOffer[];
    onSelect: (offer: CreditsPurchaseOffer) => void;
    bonusMap: Record<string, number>;
    discountCategory: LimitedTimeDiscount[];
    loyaltyPointsBalance: number | null;
    isBonusLoading?: boolean;
}

const CreditsGrid: React.FC<CreditsGridProps> = ({
    offers,
    onSelect,
    bonusMap,
    discountCategory,
    loyaltyPointsBalance,
    isBonusLoading = false,
}) => {
    return (
        <div className="flex flex-col gap-2">
            {offers.sort((a, b) => a.credits - b.credits).map((offer, index) => (
                <div key={index} className="w-full">
                    <PurchaseCard
                        offer={offer}
                        onSelect={onSelect}
                        bonusMap={bonusMap}
                        discountCategory={discountCategory}
                        loyaltyPointsBalance={loyaltyPointsBalance}
                        disabled={isBonusLoading}
                    />
                </div>
            ))}
        </div>
    );
};

export default CreditsGrid;
