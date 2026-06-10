import React, { useMemo, useRef } from "react";
import Image from "next/image";
import { CreditsPurchaseOffer } from "../contants";
import { poppinsBold, poppinsLight } from "@/utils/themeUtil";
import { calculateTotalCredits } from "@/utils/util";
import { LimitedTimeDiscount } from "@/types";
import { DISCOUNTS_CONFIG } from "@/features/LimitedTime/DiscountOverview";

interface PurchaseCardProps {
    offer: CreditsPurchaseOffer;
    onSelect: (offer: CreditsPurchaseOffer) => void;
    bonusMap: Record<string, number>;
    discountCategory: LimitedTimeDiscount[];
    loyaltyPointsBalance: number | null;
    disabled?: boolean;
}

/**
 * Returns Tailwind class strings for coin/image size, credits text size,
 * and oldCredits text size based on "size" + responsive breakpoints.
 */
export function getSizeClasses(size: "small" | "medium" | "large") {
    switch (size) {
        case "small":
            return {
                coinClass: "w-6 h-6 sm:w-8 sm:h-8",
                creditsClass: "text-2xl sm:text-3xl",
                oldCreditsClass: "text-xs sm:text-sm",
            };
        case "large":
            return {
                coinClass: "w-20 h-20 sm:w-24 sm:h-24",
                creditsClass: "text-6xl sm:text-7xl",
                oldCreditsClass: "text-sm sm:text-base",
            };
        default:
            return {
                coinClass: "w-10 h-10 sm:w-12 sm:h-12",
                creditsClass: "text-4xl sm:text-5xl",
                oldCreditsClass: "text-sm sm:text-base",
            };
    }
}

const PurchaseCard = ({
    offer,
    onSelect,
    bonusMap,
    discountCategory,
    loyaltyPointsBalance,
    disabled = false,
}: PurchaseCardProps) => {
    //Change totalStars to change the number of stars on the credit package button
    const normalizedLoyaltyPointsBalance = loyaltyPointsBalance ?? 0;
    const totalStars = 3;
    const stars = Array(totalStars).fill(0);
    const isCoinOnTop = !!offer.coinOnTop;
    const size = offer.size ?? "medium";
    const { coinClass, creditsClass, oldCreditsClass } = getSizeClasses(size);
    const creditsAmount = calculateTotalCredits(
        offer.credits,
        bonusMap[offer.id]
    );
    const starCount = useMemo(() => {
        return DISCOUNTS_CONFIG.reduce((star, discountItem) => {
            return discountCategory.includes(discountItem.discount)
                ? star + 1
                : star;
        }, 0);
    }, [discountCategory]);

    const containerRef = useRef<HTMLDivElement>(null);

    const containerClasses = `
      flex flex-col
      w-full
      h-full
      overflow-hidden
      border-2 border-transparent
      ${
          disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:scale-[1.02] hover:border-white hover:border-[1px] hover:opacity-90 hover:rounded-xl"
      }
    `;

    return (
        <div
            ref={containerRef}
            className={containerClasses}
            onClick={() => {
                if (disabled) {
                    return;
                }
                onSelect(offer);
            }}
            aria-disabled={disabled}
        >
            {/*
        TOP (gradient) section with no white border at top,
        but with border-2 of offer.borderColor, only around it.
        Rounded top corners.
        Use smaller padding on mobile, bigger on sm+.
      */}
            <div
                className={`
    relative flex-1 
    px-4 py-2 sm:px-6 sm:py-3
    ${offer.color}
    rounded-t-xl
    border-2 ${offer.borderColor}
    
  `}
            >
                {/* SVG texture overlay */}
                <div
                    style={{
                        backgroundSize: `100% auto`,
                    }}
                    className="
    absolute inset-0
    bg-[url('/images/limited-credit-offers/shimmer.svg')]
    bg-no-repeat
    opacity-30
    pointer-events-none
  "
                />

                {/* Content placed above the overlay */}
                <div className="relative flex flex-col items-start justify-center w-full h-full">
                    {isCoinOnTop ? (
                        <div className="flex flex-col items-center gap-0.5">
                            <Image
                                src="/images/Credits/coin-large.webp"
                                alt="C"
                                className={`rounded-full opacity-90 ${coinClass}`}
                                width={64}
                                height={54}
                            />
                            <span
                                className={`text-white font-bold leading-none ${creditsClass} ${poppinsBold.className}`}
                            >
                                {creditsAmount}
                            </span>
                            {offer.credits && starCount > 0 && (
                                <span
                                    className={`text-white line-through opacity-60 -mt-1 ${oldCreditsClass}`}
                                >
                                    {offer.credits}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <Image
                                src="/images/Credits/coin-large.webp"
                                alt="C"
                                className={`rounded-full opacity-90 ${coinClass}`}
                                width={64}
                                height={54}
                            />
                            <span
                                className={`text-white font-bold leading-none ${creditsClass} ${poppinsBold.className}`}
                            >
                                {creditsAmount}
                            </span>
                            {offer.credits && starCount > 0 && (
                                <span
                                    style={{ lineHeight: "1.75rem" }}
                                    className={`text-white line-through opacity-60 leading-none ${oldCreditsClass}`}
                                >
                                    {offer.credits}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/*
        BOTTOM (frosted) section with white border on left, right, bottom only.
        Rounded bottom corners.
        Smaller padding on mobile, bigger on sm+.
      */}
            <div
                className="
    backdrop-blur-sm bg-white/15
    px-2 p-2 sm:px-3 sm:p-2
    border-x-[1px] border-b-[0.5px] border-white/10
    rounded-b-xl
  "
            >
                <div className="flex justify-between gap-2">
                    {size === "large" && <div className="flex flex-1" />}
                    <div className="flex flex-col justify-center mt-1">
                        <div className="flex items-center gap-[10px]">
                            <div className="bg-blue-500 rounded-3xl px-2 sm:px-4 h-8 sm:h-9 flex items-center justify-center">
                                <span
                                    className={
                                        "text-white font-semibold text-xs sm:text-sm " +
                                        poppinsLight.className
                                    }
                                >
                                    ${offer.price.toLocaleString()}
                                </span>
                            </div>
                            <div
                                className="rounded-3xl px-2 sm:px-4 h-8 sm:h-9 flex items-center justify-center gap-1"
                                style={{
                                    backgroundColor:
                                        normalizedLoyaltyPointsBalance >= offer.credits
                                            ? "#fff"
                                            : "#878c96"
                                }}
                            >
                                <span
                                    className={
                                        "font-semibold text-xs sm:text-sm " +
                                        poppinsLight.className
                                    }
                                    style={{
                                        color: normalizedLoyaltyPointsBalance >= offer.credits
                                            ? "#00c754"
                                            : "#fff",
                                        opacity: normalizedLoyaltyPointsBalance >= offer.credits
                                            ? 1
                                            : 0.6,
                                    }}
                                >
                                    {offer.credits.toLocaleString()}
                                </span>
                                <Image
                                    src="/images/Credits/loyaltypointsstar.svg"
                                    alt="Thousands Points"
                                    width={16}
                                    height={16}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`flex flex-1 justify-end`}>
                        <div className="grid grid-cols-4 gap-1.5 place-items-center max-[340px]:scale-75 max-[340px]:origin-top-left">
                            {stars.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2.5 h-1 flex items-center justify-center ${index < starCount
                                            ? "text-white"
                                            : "text-white/30"
                                        }`}
                                >
                                    ★
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseCard;
